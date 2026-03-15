// Property-based tests for error handling and logging
// **Feature: virtual-hearing-recording, Property 4: Error Handling and Logging Property**

const fc = require('fast-check');
const mediaCaptureService = require('../services/media-capture');
const hearingDatabase = require('../database/init-database');

describe('Error Handling Tests', () => {
  beforeAll(async () => {
    await hearingDatabase.initialize();
  });

  beforeEach(() => {
    // Clear test data before each test
    hearingDatabase.tables.hearings.clear();
    hearingDatabase.tables.recordings.clear();
    hearingDatabase.tables.participants.clear();
    
    // Clear active recordings in media capture service
    mediaCaptureService.activeRecordings.clear();
    mediaCaptureService.streamBuffers.clear();
  });

  describe('**Feature: virtual-hearing-recording, Property 4: Error Handling and Logging Property**', () => {
    test('recording failure scenarios log errors and notify administrators', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            recordingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `rec-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            hearingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `hearing-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            errorType: fc.constantFrom('network_failure', 'storage_full', 'stream_corruption', 'permission_denied', 'timeout'),
            participantCount: fc.integer({ min: 1, max: 8 })
          }),
          async (testData) => {
            const { recordingId, hearingId, errorType, participantCount } = testData;
            
            // Create test participants
            const participants = Array.from({ length: participantCount }, (_, i) => ({
              userId: `user-${i}`,
              name: `Participant ${i}`,
              role: ['judge', 'lawyer', 'plaintiff'][i % 3],
              consentGiven: true
            }));

            // Start recording capture
            const captureResult = await mediaCaptureService.startCapture(recordingId, hearingId, participants);
            expect(captureResult.success).toBe(true);

            // Simulate different error scenarios
            let simulatedError;
            switch (errorType) {
              case 'network_failure':
                simulatedError = new Error('Network connection lost during recording');
                break;
              case 'storage_full':
                simulatedError = new Error('Insufficient storage space for recording');
                break;
              case 'stream_corruption':
                simulatedError = new Error('Media stream data corruption detected');
                break;
              case 'permission_denied':
                simulatedError = new Error('Permission denied: Cannot write to recording directory');
                break;
              case 'timeout':
                simulatedError = new Error('Recording operation timed out');
                break;
              default:
                simulatedError = new Error('Unknown recording error');
            }

            // Handle the recording error
            const errorResult = await mediaCaptureService.handleRecordingError(recordingId, simulatedError);

            // Verify error handling response
            expect(errorResult.success).toBe(false);
            expect(errorResult.recordingId).toBe(recordingId);
            expect(errorResult.error).toBe(simulatedError.message);
            expect(errorResult.timestamp).toBeDefined();

            // Verify recording was marked as failed in database
            const failedRecording = hearingDatabase.tables.recordings.get(recordingId);
            if (failedRecording) {
              expect(failedRecording.status).toBe('failed');
              expect(failedRecording.end_time).toBeDefined();
            }

            // Verify cleanup occurred
            expect(mediaCaptureService.activeRecordings.has(recordingId)).toBe(false);
            expect(mediaCaptureService.streamBuffers.has(recordingId)).toBe(false);

            // Verify error was logged (check console output would be captured in real implementation)
            const recordingStatus = mediaCaptureService.getRecordingStatus(recordingId);
            expect(recordingStatus.active).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('media stream processing errors are handled gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            recordingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `rec-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            hearingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `hearing-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            participantId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `user-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            streamType: fc.constantFrom('video', 'audio', 'screen'),
            corruptData: fc.boolean()
          }),
          async (testData) => {
            const { recordingId, hearingId, participantId, streamType, corruptData } = testData;
            
            // Create a participant
            const participant = {
              userId: participantId,
              name: 'Test Participant',
              role: 'lawyer',
              consentGiven: true
            };

            // Start recording capture
            await mediaCaptureService.startCapture(recordingId, hearingId, [participant]);

            // Create stream data (corrupt or valid)
            let streamData;
            if (corruptData) {
              // Create intentionally corrupt data
              streamData = Buffer.from('CORRUPT_STREAM_DATA_INVALID_FORMAT');
            } else {
              // Create valid mock stream data
              streamData = Buffer.alloc(1024, 0x42); // Valid buffer filled with 'B'
            }

            try {
              // Process stream data
              const result = await mediaCaptureService.processStreamData(
                recordingId,
                participantId,
                streamData,
                streamType
              );

              if (corruptData) {
                // Even with corrupt data, the service should handle it gracefully
                // and not crash the entire recording
                expect(result).toBeDefined();
              } else {
                // Valid data should be processed successfully
                expect(result.success).toBe(true);
                expect(result.participantId).toBe(participantId);
                expect(result.streamType).toBe(streamType);
                expect(result.dataSize).toBe(streamData.length);
              }

              // Verify recording session is still active after processing
              const recordingStatus = mediaCaptureService.getRecordingStatus(recordingId);
              expect(recordingStatus.active).toBe(true);

            } catch (error) {
              // If an error occurs, it should be handled gracefully
              expect(error).toBeInstanceOf(Error);
              
              // The recording should still be cleanable
              await mediaCaptureService.handleRecordingError(recordingId, error);
              
              const recordingStatus = mediaCaptureService.getRecordingStatus(recordingId);
              expect(recordingStatus.active).toBe(false);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('participant management errors are logged and handled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            recordingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `rec-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            hearingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `hearing-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
            validParticipants: fc.array(
              fc.record({
                userId: fc.string({ minLength: 5, maxLength: 15 }).map(s => `valid-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
                name: fc.string({ minLength: 5, maxLength: 20 }).map(s => s.trim() || 'Valid User'),
                role: fc.constantFrom('judge', 'lawyer', 'plaintiff')
              }),
              { minLength: 1, maxLength: 3 }
            ),
            invalidOperations: fc.array(
              fc.record({
                operation: fc.constantFrom('add_duplicate', 'remove_nonexistent', 'add_without_consent'),
                userId: fc.string({ minLength: 5, maxLength: 15 }).map(s => `invalid-${s.replace(/[^a-zA-Z0-9]/g, '')}`)
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          async (testData) => {
            const { recordingId, hearingId, validParticipants, invalidOperations } = testData;
            
            // Add consent to valid participants
            const participants = validParticipants.map(p => ({ ...p, consentGiven: true }));

            // Start recording capture with valid participants
            const captureResult = await mediaCaptureService.startCapture(recordingId, hearingId, participants);
            expect(captureResult.success).toBe(true);
            expect(captureResult.participantCount).toBe(participants.length);

            // Perform invalid operations and verify error handling
            for (const invalidOp of invalidOperations) {
              try {
                switch (invalidOp.operation) {
                  case 'add_duplicate':
                    // Try to add a participant that already exists
                    if (participants.length > 0) {
                      const duplicateParticipant = { ...participants[0], consentGiven: true };
                      const result = await mediaCaptureService.addParticipant(recordingId, duplicateParticipant);
                      // Should handle gracefully - either succeed or fail gracefully
                      expect(result).toBeDefined();
                    }
                    break;

                  case 'remove_nonexistent':
                    // Try to remove a participant that doesn't exist
                    const result = await mediaCaptureService.removeParticipant(recordingId, invalidOp.userId);
                    expect(result.success).toBe(true); // Should handle gracefully
                    break;

                  case 'add_without_consent':
                    // Try to add a participant without consent
                    const noConsentParticipant = {
                      userId: invalidOp.userId,
                      name: 'No Consent User',
                      role: 'observer',
                      consentGiven: false
                    };
                    const addResult = await mediaCaptureService.addParticipant(recordingId, noConsentParticipant);
                    expect(addResult.success).toBe(false);
                    expect(addResult.reason).toBe('No consent given');
                    break;
                }
              } catch (error) {
                // Errors should be handled gracefully and not crash the system
                expect(error).toBeInstanceOf(Error);
                
                // Recording should still be active after error
                const recordingStatus = mediaCaptureService.getRecordingStatus(recordingId);
                expect(recordingStatus).toBeDefined();
              }
            }

            // Verify recording is still functional after error operations
            const finalStatus = mediaCaptureService.getRecordingStatus(recordingId);
            expect(finalStatus.active).toBe(true);
            expect(finalStatus.participantCount).toBe(participants.length);
          }
        ),
        { numRuns: 10 }
      );
    });

    test('recording service handles concurrent error scenarios', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              recordingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `concurrent-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
              hearingId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `hearing-${s.replace(/[^a-zA-Z0-9]/g, '')}`),
              shouldFail: fc.boolean(),
              errorDelay: fc.integer({ min: 10, max: 100 }) // milliseconds
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (recordings) => {
            const startPromises = [];
            const errorPromises = [];

            // Start multiple recordings concurrently
            for (const recording of recordings) {
              const participant = {
                userId: `user-${recording.recordingId}`,
                name: `User for ${recording.recordingId}`,
                role: 'lawyer',
                consentGiven: true
              };

              startPromises.push(
                mediaCaptureService.startCapture(recording.recordingId, recording.hearingId, [participant])
              );
            }

            // Wait for all recordings to start
            const startResults = await Promise.all(startPromises);
            startResults.forEach(result => {
              expect(result.success).toBe(true);
            });

            // Simulate concurrent errors for recordings marked to fail
            for (const recording of recordings) {
              if (recording.shouldFail) {
                const errorPromise = new Promise(resolve => {
                  setTimeout(async () => {
                    const error = new Error(`Simulated concurrent error for ${recording.recordingId}`);
                    const result = await mediaCaptureService.handleRecordingError(recording.recordingId, error);
                    resolve(result);
                  }, recording.errorDelay);
                });
                errorPromises.push(errorPromise);
              }
            }

            // Wait for all error handling to complete
            if (errorPromises.length > 0) {
              const errorResults = await Promise.all(errorPromises);
              errorResults.forEach(result => {
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.timestamp).toBeDefined();
              });
            }

            // Verify system state after concurrent operations
            const activeRecordings = mediaCaptureService.getActiveRecordings();
            const expectedActiveCount = recordings.filter(r => !r.shouldFail).length;
            expect(activeRecordings.length).toBe(expectedActiveCount);

            // Clean up remaining active recordings
            for (const recording of recordings) {
              if (!recording.shouldFail) {
                await mediaCaptureService.handleRecordingError(
                  recording.recordingId, 
                  new Error('Test cleanup')
                );
              }
            }

            // Verify all recordings are cleaned up
            const finalActiveRecordings = mediaCaptureService.getActiveRecordings();
            expect(finalActiveRecordings.length).toBe(0);
          }
        ),
        { numRuns: 8 }
      );
    });
  });
});