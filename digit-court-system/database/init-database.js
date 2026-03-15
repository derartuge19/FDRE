// Database initialization script for Virtual Hearing Recording System
const fs = require('fs');
const path = require('path');

// Mock database implementation (in production, use MySQL/PostgreSQL)
class HearingDatabase {
    constructor() {
        this.tables = {
            hearings: new Map(),
            recordings: new Map(),
            participants: new Map(),
            recording_metadata: new Map(),
            recording_access_log: new Map(),
            storage_usage: new Map()
        };
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log('🗄️ Initializing Virtual Hearing Recording Database...');
        
        // Create recordings directory structure
        this.createDirectoryStructure();
        
        // Load sample data
        await this.loadSampleData();
        
        this.initialized = true;
        console.log('✅ Database initialized successfully');
    }

    createDirectoryStructure() {
        const recordingsDir = path.join(__dirname, '..', 'recordings');
        const yearDir = path.join(recordingsDir, '2026');
        const monthDir = path.join(yearDir, '03');
        const dayDir = path.join(monthDir, '13');

        // Create directory structure
        [recordingsDir, yearDir, monthDir, dayDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
    }

    async loadSampleData() {
        // Sample hearings
        const hearings = [
            {
                id: 'hearing-001',
                case_number: 'CIV-2026-001',
                title: 'Contract Dispute - ABC Corp vs John Doe',
                start_time: '2026-03-13T10:00:00Z',
                end_time: '2026-03-13T12:00:00Z',
                status: 'completed',
                presiding_judge: 'Judge Alemu Bekele',
                created_at: new Date().toISOString()
            },
            {
                id: 'hearing-002',
                case_number: 'CIV-2026-002',
                title: 'Property Dispute - Land Ownership Case',
                start_time: '2026-03-13T14:00:00Z',
                end_time: null,
                status: 'active',
                presiding_judge: 'Judge Alemu Bekele',
                created_at: new Date().toISOString()
            }
        ];

        // Sample recordings
        const recordings = [
            {
                id: 'rec-001',
                hearing_id: 'hearing-001',
                filename: 'hearing-CIV-2026-001-20260313-100000.webm',
                file_path: '/recordings/2026/03/13/hearing-CIV-2026-001-20260313-100000.webm',
                file_size: 524288000,
                duration: 7200,
                format: 'webm',
                start_time: '2026-03-13T10:00:00Z',
                end_time: '2026-03-13T12:00:00Z',
                status: 'completed',
                created_at: new Date().toISOString()
            }
        ];

        // Sample participants
        const participants = [
            {
                id: 'part-001',
                hearing_id: 'hearing-001',
                user_id: 'judge-alemu',
                name: 'Judge Alemu Bekele',
                role: 'judge',
                join_time: '2026-03-13T09:55:00Z',
                leave_time: '2026-03-13T12:05:00Z',
                consent_given: true,
                consent_timestamp: '2026-03-13T09:55:00Z'
            },
            {
                id: 'part-002',
                hearing_id: 'hearing-001',
                user_id: 'lawyer-sara',
                name: 'Lawyer Sara Ahmed',
                role: 'lawyer',
                join_time: '2026-03-13T09:58:00Z',
                leave_time: '2026-03-13T12:02:00Z',
                consent_given: true,
                consent_timestamp: '2026-03-13T09:58:00Z'
            }
        ];

        // Load data into mock database
        hearings.forEach(hearing => this.tables.hearings.set(hearing.id, hearing));
        recordings.forEach(recording => this.tables.recordings.set(recording.id, recording));
        participants.forEach(participant => this.tables.participants.set(participant.id, participant));

        console.log(`📊 Loaded ${hearings.length} hearings, ${recordings.length} recordings, ${participants.length} participants`);
    }

    // Database query methods
    async getHearings(filters = {}) {
        let results = Array.from(this.tables.hearings.values());
        
        if (filters.status) {
            results = results.filter(h => h.status === filters.status);
        }
        if (filters.case_number) {
            results = results.filter(h => h.case_number.includes(filters.case_number));
        }
        
        return results;
    }

    async getRecordings(hearingId = null) {
        let results = Array.from(this.tables.recordings.values());
        
        if (hearingId) {
            results = results.filter(r => r.hearing_id === hearingId);
        }
        
        return results;
    }

    async getParticipants(hearingId) {
        return Array.from(this.tables.participants.values())
            .filter(p => p.hearing_id === hearingId);
    }

    async createHearing(hearingData) {
        const hearing = {
            id: hearingData.id || `hearing-${Date.now()}`,
            ...hearingData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.tables.hearings.set(hearing.id, hearing);
        return hearing;
    }

    async createRecording(recordingData) {
        const recording = {
            id: recordingData.id || `rec-${Date.now()}`,
            ...recordingData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.tables.recordings.set(recording.id, recording);
        return recording;
    }

    async updateRecording(recordingId, updates) {
        const recording = this.tables.recordings.get(recordingId);
        if (recording) {
            Object.assign(recording, updates, { updated_at: new Date().toISOString() });
            this.tables.recordings.set(recordingId, recording);
        }
        return recording;
    }

    async logAccess(accessData) {
        const logEntry = {
            id: `log-${Date.now()}`,
            ...accessData,
            access_time: new Date().toISOString()
        };
        
        this.tables.recording_access_log.set(logEntry.id, logEntry);
        return logEntry;
    }

    // Schema information for admin interface
    getTableSchema() {
        return {
            hearings: {
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY' },
                    { name: 'case_number', type: 'VARCHAR(50)', key: 'INDEX' },
                    { name: 'title', type: 'VARCHAR(255)', key: '' },
                    { name: 'start_time', type: 'TIMESTAMP', key: 'INDEX' },
                    { name: 'end_time', type: 'TIMESTAMP', key: '' },
                    { name: 'status', type: 'ENUM', key: 'INDEX' },
                    { name: 'presiding_judge', type: 'VARCHAR(100)', key: '' },
                    { name: 'created_at', type: 'TIMESTAMP', key: '' },
                    { name: 'updated_at', type: 'TIMESTAMP', key: '' }
                ],
                relationships: []
            },
            recordings: {
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY' },
                    { name: 'hearing_id', type: 'VARCHAR(50)', key: 'FOREIGN' },
                    { name: 'filename', type: 'VARCHAR(255)', key: '' },
                    { name: 'file_path', type: 'VARCHAR(500)', key: '' },
                    { name: 'file_size', type: 'BIGINT', key: '' },
                    { name: 'duration', type: 'INT', key: '' },
                    { name: 'format', type: 'ENUM', key: '' },
                    { name: 'start_time', type: 'TIMESTAMP', key: 'INDEX' },
                    { name: 'end_time', type: 'TIMESTAMP', key: '' },
                    { name: 'status', type: 'ENUM', key: 'INDEX' }
                ],
                relationships: [
                    { table: 'hearings', column: 'hearing_id', references: 'id' }
                ]
            },
            participants: {
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY' },
                    { name: 'hearing_id', type: 'VARCHAR(50)', key: 'FOREIGN' },
                    { name: 'user_id', type: 'VARCHAR(50)', key: 'INDEX' },
                    { name: 'name', type: 'VARCHAR(100)', key: '' },
                    { name: 'role', type: 'ENUM', key: 'INDEX' },
                    { name: 'join_time', type: 'TIMESTAMP', key: '' },
                    { name: 'leave_time', type: 'TIMESTAMP', key: '' },
                    { name: 'consent_given', type: 'BOOLEAN', key: '' }
                ],
                relationships: [
                    { table: 'hearings', column: 'hearing_id', references: 'id' }
                ]
            }
        };
    }
}

// Export singleton instance
const hearingDatabase = new HearingDatabase();

module.exports = hearingDatabase;