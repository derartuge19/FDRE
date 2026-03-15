// Server-side Media Capture Service for Virtual Hearing Recordings
const fs = require('fs').promises;
const path = require('path');
const fileStorageService = require('./file-storage');
const hearingDatabase = require('../database/init-database');

class MediaCaptureService {
    constructor() {
        this.activeRecordings = new Map(); // recordingId -> recording session
        this.streamBuffers = new Map(); // recordingId -> array of stream chunks
        this.recordingMetadata = new Map(); // recordingId -> metadata
    }

    /**
     * Start capturing media streams for a hearing recording
     */
    async startCapture(recordingId, hearingId, participants = []) {
        try {
            if (this.activeRecordings.has(recordingId)) {
                throw new Error(`Recording ${recordingId} is already active`);
            }

            const recordingSession = {
                recordingId,
                hearingId,
                participants: new Map(),
                startTime: new Date(),
                status: 'recording',
                streamCount: 0,
                totalDataReceived: 0,
                hasScreenShare: false,
                audioQuality: 'standard',
                videoQuality: 'standard'
            };

            // Initialize participant streams
            participants.forEach(participant => {
                if (participant.consentGiven) {
                    recordingSession.participants.set(participant.userId, {
                        userId: participant.userId,
                        name: participant.name,
                        role: participant.role,
                        streamActive: false,
                        audioEnabled: true,
                        videoEnabled: true,
                        dataReceived: 0,
                        lastActivity: new Date()
                    });
                }
            });

            // Initialize stream buffer for this recording
            this.streamBuffers.set(recordingId, []);
            this.activeRecordings.set(recordingId, recordingSession);

            console.log(`🎥 Started media capture for recording ${recordingId} with ${recordingSession.participants.size} participants`);

            return {
                success: true,
                recordingId,
                participantCount: recordingSession.participants.size,
                startTime: recordingSession.startTime.toISOString()
            };

        } catch (error) {
            console.error(`❌ Failed to start media capture for ${recordingId}:`, error);
            throw error;
        }
    }

    /**
     * Process incoming media stream data
     */
    async processStreamData(recordingId, participantId, streamData, streamType = 'video') {
        try {
            const recordingSession = this.activeRecordings.get(recordingId);
            if (!recordingSession) {
                throw new Error(`No active recording session found for ${recordingId}`);
            }

            const participant = recordingSession.participants.get(participantId);
            if (!participant) {
                console.warn(`⚠️ Participant ${participantId} not found in recording ${recordingId}`);
                return;
            }

            // Update participant activity
            participant.lastActivity = new Date();
            participant.streamActive = true;
            participant.dataReceived += streamData.length;

            // Update recording session stats
            recordingSession.totalDataReceived += streamData.length;
            recordingSession.streamCount++;

            // Store stream data chunk
            const streamChunk = {
                timestamp: new Date().toISOString(),
                participantId,
                participantName: participant.name,
                streamType, // 'video', 'audio', 'screen'
                dataSize: streamData.length,
                data: streamData
            };

            const streamBuffer = this.streamBuffers.get(recordingId);
            streamBuffer.push(streamChunk);

            // Update quality metrics based on data size and frequency
            this.updateQualityMetrics(recordingSession, streamChunk);

            // Check for screen sharing
            if (streamType === 'screen') {
                recordingSession.hasScreenShare = true;
            }

            console.log(`📊 Processed ${streamType} stream from ${participant.name}: ${streamData.length} bytes`);

            return {
                success: true,
                participantId,
                streamType,
                dataSize: streamData.length,
                totalReceived: recordingSession.totalDataReceived
            };

        } catch (error) {
            console.error(`❌ Failed to process stream data for ${recordingId}:`, error);
            throw error;
        }
    }

    /**
     * Update quality metrics based on stream data
     */
    updateQualityMetrics(recordingSession, streamChunk) {
        const { streamType, dataSize } = streamChunk;

        // Simple quality assessment based on data size
        if (streamType === 'video') {
            if (dataSize > 100000) { // > 100KB per chunk suggests HD
                recordingSession.videoQuality = 'hd';
            } else if (dataSize > 50000) { // > 50KB suggests high quality
                recordingSession.videoQuality = 'high';
            } else {
                recordingSession.videoQuality = 'standard';
            }
        } else if (streamType === 'audio') {
            if (dataSize > 10000) { // > 10KB per chunk suggests high quality audio
                recordingSession.audioQuality = 'high';
            } else {
                recordingSession.audioQuality = 'standard';
            }
        }
    }

    /**
     * Handle participant joining during recording
     */
    async addParticipant(recordingId, participant) {
        try {
            const recordingSession = this.activeRecordings.get(recordingId);
            if (!recordingSession) {
                throw new Error(`No active recording session found for ${recordingId}`);
            }

            if (participant.consentGiven) {
                recordingSession.participants.set(participant.userId, {
                    userId: participant.userId,
                    name: participant.name,
                    role: participant.role,
                    streamActive: false,
                    audioEnabled: true,
                    videoEnabled: true,
                    dataReceived: 0,
                    lastActivity: new Date(),
                    joinedDuringRecording: true
                });

                console.log(`👋 Added participant ${participant.name} to recording ${recordingId}`);

                return {
                    success: true,
                    participantId: participant.userId,
                    participantCount: recordingSession.participants.size
                };
            } else {
                console.log(`⚠️ Participant ${participant.name} did not consent to recording`);
                return {
                    success: false,
                    reason: 'No consent given'
                };
            }

        } catch (error) {
            console.error(`❌ Failed to add participant to recording ${recordingId}:`, error);
            throw error;
        }
    }

    /**
     * Handle participant leaving during recording
     */
    async removeParticipant(recordingId, participantId) {
        try {
            const recordingSession = this.activeRecordings.get(recordingId);
            if (!recordingSession) {
                return { success: false, reason: 'Recording not found' };
            }

            const participant = recordingSession.participants.get(participantId);
            if (participant) {
                participant.streamActive = false;
                participant.leftAt = new Date();
                console.log(`👋 Participant ${participant.name} left recording ${recordingId}`);
            }

            return {
                success: true,
                participantId,
                participantCount: recordingSession.participants.size
            };

        } catch (error) {
            console.error(`❌ Failed to remove participant from recording ${recordingId}:`, error);
            throw error;
        }
    }

    /**
     * Stop capturing and finalize recording
     */
    async stopCapture(recordingId, caseNumber) {
        try {
            const recordingSession = this.activeRecordings.get(recordingId);
            if (!recordingSession) {
                throw new Error(`No active recording session found for ${recordingId}`);
            }

            const endTime = new Date();
            const duration = Math.floor((endTime - recordingSession.startTime) / 1000);

            // Get all stream data
            const streamBuffer = this.streamBuffers.get(recordingId);
            const totalChunks = streamBuffer.length;

            // Create a mock recording blob (in real implementation, this would be actual media data)
            const recordingBlob = this.createRecordingBlob(streamBuffer);

            // Save recording to file storage
            const fileInfo = await fileStorageService.saveRecording(
                recordingSession.hearingId,
                caseNumber,
                recordingBlob,
                'webm'
            );

            // Create recording metadata
            const metadata = {
                recordingId,
                participantCount: recordingSession.participants.size,
                hasScreenShare: recordingSession.hasScreenShare,
                audioQuality: recordingSession.audioQuality,
                videoQuality: recordingSession.videoQuality,
                totalChunks,
                totalDataSize: recordingSession.totalDataReceived,
                duration,
                participants: Array.from(recordingSession.participants.values()).map(p => ({
                    userId: p.userId,
                    name: p.name,
                    role: p.role,
                    dataReceived: p.dataReceived,
                    joinedDuringRecording: p.joinedDuringRecording || false
                }))
            };

            // Store metadata in database
            await hearingDatabase.tables.recording_metadata.set(`meta-${recordingId}`, {
                id: `meta-${recordingId}`,
                recording_id: recordingId,
                participant_count: metadata.participantCount,
                has_screen_share: metadata.hasScreenShare,
                audio_quality: metadata.audioQuality,
                video_quality: metadata.videoQuality,
                file_checksum: fileInfo.checksum,
                compression_ratio: this.calculateCompressionRatio(metadata.totalDataSize, fileInfo.fileSize),
                created_at: new Date().toISOString()
            });

            // Clean up active recording
            this.activeRecordings.delete(recordingId);
            this.streamBuffers.delete(recordingId);

            console.log(`⏹️ Stopped media capture for recording ${recordingId}: ${duration}s, ${fileInfo.fileSize} bytes`);

            return {
                success: true,
                recordingId,
                duration,
                fileInfo,
                metadata,
                endTime: endTime.toISOString()
            };

        } catch (error) {
            console.error(`❌ Failed to stop media capture for ${recordingId}:`, error);
            throw error;
        }
    }

    /**
     * Create a mock recording blob from stream chunks
     */
    createRecordingBlob(streamBuffer) {
        // In a real implementation, this would combine all audio/video streams
        // into a proper WebM or MP4 file using FFmpeg or similar
        
        const mockHeader = Buffer.from('WEBM_HEADER_MOCK', 'utf8');
        const mockFooter = Buffer.from('WEBM_FOOTER_MOCK', 'utf8');
        
        // Calculate total size of all stream data
        const totalStreamSize = streamBuffer.reduce((total, chunk) => total + chunk.dataSize, 0);
        
        // Create a mock recording file
        const mockRecordingData = Buffer.alloc(totalStreamSize + mockHeader.length + mockFooter.length);
        
        let offset = 0;
        mockHeader.copy(mockRecordingData, offset);
        offset += mockHeader.length;
        
        // In real implementation, stream data would be properly muxed here
        streamBuffer.forEach(chunk => {
            if (chunk.data && Buffer.isBuffer(chunk.data)) {
                chunk.data.copy(mockRecordingData, offset);
                offset += chunk.data.length;
            }
        });
        
        mockFooter.copy(mockRecordingData, offset);
        
        return mockRecordingData;
    }

    /**
     * Calculate compression ratio
     */
    calculateCompressionRatio(originalSize, compressedSize) {
        if (originalSize === 0) return 0;
        return Math.round((compressedSize / originalSize) * 100) / 100;
    }

    /**
     * Get recording session status
     */
    getRecordingStatus(recordingId) {
        const recordingSession = this.activeRecordings.get(recordingId);
        if (!recordingSession) {
            return { active: false };
        }

        const activeParticipants = Array.from(recordingSession.participants.values())
            .filter(p => p.streamActive);

        return {
            active: true,
            recordingId,
            hearingId: recordingSession.hearingId,
            startTime: recordingSession.startTime.toISOString(),
            duration: Math.floor((new Date() - recordingSession.startTime) / 1000),
            participantCount: recordingSession.participants.size,
            activeParticipants: activeParticipants.length,
            totalDataReceived: recordingSession.totalDataReceived,
            streamCount: recordingSession.streamCount,
            hasScreenShare: recordingSession.hasScreenShare,
            audioQuality: recordingSession.audioQuality,
            videoQuality: recordingSession.videoQuality
        };
    }

    /**
     * Get all active recordings
     */
    getActiveRecordings() {
        const activeRecordings = [];
        
        this.activeRecordings.forEach((session, recordingId) => {
            activeRecordings.push(this.getRecordingStatus(recordingId));
        });

        return activeRecordings;
    }

    /**
     * Handle recording errors and cleanup
     */
    async handleRecordingError(recordingId, error) {
        console.error(`❌ Recording error for ${recordingId}:`, error);

        const recordingSession = this.activeRecordings.get(recordingId);
        if (recordingSession) {
            // Update recording status in database
            await hearingDatabase.updateRecording(recordingId, {
                status: 'failed',
                end_time: new Date().toISOString(),
                error_message: error.message
            });

            // Clean up
            this.activeRecordings.delete(recordingId);
            this.streamBuffers.delete(recordingId);

            console.log(`🧹 Cleaned up failed recording ${recordingId}`);
        }

        return {
            success: false,
            recordingId,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Export singleton instance
const mediaCaptureService = new MediaCaptureService();

module.exports = mediaCaptureService;