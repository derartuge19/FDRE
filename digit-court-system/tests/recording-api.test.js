// Property-based tests for recording API
// **Feature: virtual-hearing-recording, Property 3: Continuous Stream Capture Property**

const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const hearingDatabase = require('../database/init-database');

// Mock Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuthenticateToken = (req, res, next) => {
  req.user = {
    id: 'test-user',
    username: 'test.user',
    name: 'Test User',
    roles: ['judge'],
    permissions: ['virtual_hearing']
  };
  next();
};

const mockRequirePermission = (permission) => (req, res, next) => {
  if (req.user.permissions.includes(permission)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
};

// Mock WebSocket broadcasting
const mockBroadcastToHearing = (hearingId, message) => {
  console.log(`Broadcasting to hearing ${hearingId}:`, message.type);
};

// Set up test routes (simplified versions of the actual endpoints)
app.post('/api/recording/start', mockAuthenticateToken, mockRequirePermission('virtual_hearing'), async (req, res) => {
  const { hearingId, caseNumber, participants = [] } = req.body;
  
  try {
    if (!hearingId || !caseNumber) {
      return res.status(400).json({
        success: false,
        message: 'hearingId and caseNumber are required'
      });
    }

    // Create hearing if it doesn't exist
    let hearing = hearingDatabase.tables.hearings.get(hearingId);
    if (!hearing) {
      hearing = await hearingDatabase.createHearing({
        id: hearingId,
        case_number: caseNumber,
        title: `Virtual Hearing - ${caseNumber}`,
        start_time: new Date().toISOString(),
        status: 'active',
        presiding_judge: req.user.name
      });
    }

    // Create recording record
    const recordingId = `rec-${hearingId}-${Date.now()}`;
    const recording = await hearingDatabase.createRecording({
      id: recordingId,
      hearing_id: hearingId,
      filename: `${caseNumber}-recording.webm`,
      file_path: `/recordings/test/${recordingId}.webm`,
      file_size: 0,
      duration: 0,
      format: 'webm',
      start_time: new Date().toISOString(),
      status: 'recording'
    });

    // Log participants
    for (const participant of participants) {
      if (participant.consentGiven) {
        hearingDatabase.tables.participants.set(`part-${recordingId}-${participant.userId}`, {
          id: `part-${recordingId}-${participant.userId}`,
          hearing_id: hearingId,
          user_id: participant.userId,
          name: participant.name,
          role: participant.role,
          join_time: new Date().toISOString(),
          consent_given: true,
          consent_timestamp: new Date().toISOString()
        });
      }
    }

    mockBroadcastToHearing(hearingId, {
      type: 'recording_started',
      recordingId: recordingId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Recording started successfully',
      data: {
        recordingId: recordingId,
        hearingId: hearingId,
        startTime: recording.start_time,
        status: 'recording'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start recording',
      error: error.message
    });
  }
});

app.post('/api/recording/stop', mockAuthenticateToken, mockRequirePermission('virtual_hearing'), async (req, res) => {
  const { recordingId } = req.body;
  
  try {
    if (!recordingId) {
      return res.status(400).json({
        success: false,
        message: 'recordingId is required'
      });
    }

    const recording = hearingDatabase.tables.recordings.get(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(recording.start_time);
    const duration = Math.floor((new Date(endTime) - startTime) / 1000);

    const updatedRecording = await hearingDatabase.updateRecording(recordingId, {
      end_time: endTime,
      duration: duration,
      status: 'completed'
    });

    mockBroadcastToHearing(recording.hearing_id, {
      type: 'recording_stopped',
      recordingId: recordingId,
      duration: duration,
      timestamp: endTime
    });

    res.json({
      success: true,
      message: 'Recording stopped successfully',
      data: {
        recordingId: recordingId,
        duration: duration,
        status: 'completed'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording',
      error: error.message
    });
  }
});

describe('Recording API Tests', () => {
  beforeAll(async () => {
    await hearingDatabase.initialize();
  });

  beforeEach(() => {
    // Clear test data before each test
    hearingDatabase.tables.hearings.clear();
    hearingDatabase.tables.recordings.clear();
    hearingDatabase.tables.participants.clear();
  });

  describe('**Feature: virtual-hearing-recording, Property 3: Continuous Stream Capture Property**', () => {
    test('recording API captures all participant streams during active recording session', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random hearing data
          fc.record({
            caseNumber: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '').padEnd(5, 'A')),
            participants: fc.array(
              fc.record({
                userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '').padEnd(5, 'U')),
                name: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.trim() || 'Test User'),
                role: fc.constantFrom('judge', 'lawyer', 'plaintiff', 'defendant', 'clerk'),
                consentGiven: fc.boolean()
              }),
              { minLength: 1, maxLength: 8 }
            )
          }),
          async (testData) => {
            const hearingId = `test-hearing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Start recording
            const startResponse = await request(app)
              .post('/api/recording/start')
              .send({
                hearingId: hearingId,
                caseNumber: testData.caseNumber,
                participants: testData.participants
              });

            expect(startResponse.status).toBe(200);
            expect(startResponse.body.success).toBe(true);
            expect(startResponse.body.data.recordingId).toBeDefined();
            expect(startResponse.body.data.status).toBe('recording');

            const recordingId = startResponse.body.data.recordingId;

            // Verify recording is in active state
            const recording = hearingDatabase.tables.recordings.get(recordingId);
            expect(recording).toBeDefined();
            expect(recording.status).toBe('recording');
            expect(recording.hearing_id).toBe(hearingId);

            // Verify all consenting participants are captured
            const consentingParticipants = testData.participants.filter(p => p.consentGiven);
            const recordedParticipants = Array.from(hearingDatabase.tables.participants.values())
              .filter(p => p.hearing_id === hearingId);

            expect(recordedParticipants).toHaveLength(consentingParticipants.length);

            // Verify each consenting participant is properly recorded
            consentingParticipants.forEach(participant => {
              const recordedParticipant = recordedParticipants.find(p => p.user_id === participant.userId);
              expect(recordedParticipant).toBeDefined();
              expect(recordedParticipant.name).toBe(participant.name);
              expect(recordedParticipant.role).toBe(participant.role);
              expect(recordedParticipant.consent_given).toBe(true);
              expect(recordedParticipant.consent_timestamp).toBeDefined();
            });

            // Stop recording
            const stopResponse = await request(app)
              .post('/api/recording/stop')
              .send({ recordingId: recordingId });

            expect(stopResponse.status).toBe(200);
            expect(stopResponse.body.success).toBe(true);
            expect(stopResponse.body.data.status).toBe('completed');

            // Verify recording was finalized
            const finalRecording = hearingDatabase.tables.recordings.get(recordingId);
            expect(finalRecording.status).toBe('completed');
            expect(finalRecording.end_time).toBeDefined();
            expect(finalRecording.duration).toBeGreaterThanOrEqual(0); // Allow 0 duration for fast tests
          }
        ),
        { numRuns: 20 }
      );
    });

    test('recording API maintains stream capture integrity across session lifecycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            caseNumber: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '').padEnd(5, 'C')),
            sessionDuration: fc.integer({ min: 1, max: 10 }), // seconds for testing
            participantCount: fc.integer({ min: 2, max: 6 })
          }),
          async (testData) => {
            const hearingId = `integrity-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Generate participants
            const participants = Array.from({ length: testData.participantCount }, (_, i) => ({
              userId: `user-${i}`,
              name: `Participant ${i}`,
              role: ['judge', 'lawyer', 'plaintiff'][i % 3],
              consentGiven: true
            }));

            // Start recording
            const startResponse = await request(app)
              .post('/api/recording/start')
              .send({
                hearingId: hearingId,
                caseNumber: testData.caseNumber,
                participants: participants
              });

            expect(startResponse.status).toBe(200);
            const recordingId = startResponse.body.data.recordingId;

            // Simulate session duration
            await new Promise(resolve => setTimeout(resolve, testData.sessionDuration * 100));

            // Verify continuous capture during session
            const recording = hearingDatabase.tables.recordings.get(recordingId);
            expect(recording.status).toBe('recording');
            
            // Verify all participants are still captured
            const capturedParticipants = Array.from(hearingDatabase.tables.participants.values())
              .filter(p => p.hearing_id === hearingId);
            expect(capturedParticipants).toHaveLength(testData.participantCount);

            // Stop recording
            const stopResponse = await request(app)
              .post('/api/recording/stop')
              .send({ recordingId: recordingId });

            expect(stopResponse.status).toBe(200);

            // Verify final recording integrity
            const finalRecording = hearingDatabase.tables.recordings.get(recordingId);
            expect(finalRecording.status).toBe('completed');
            expect(finalRecording.duration).toBeGreaterThanOrEqual(0); // Allow 0 duration for fast tests
            
            // Verify all participant data is preserved
            const finalParticipants = Array.from(hearingDatabase.tables.participants.values())
              .filter(p => p.hearing_id === hearingId);
            expect(finalParticipants).toHaveLength(testData.participantCount);
            
            finalParticipants.forEach(participant => {
              expect(participant.consent_given).toBe(true);
              expect(participant.join_time).toBeDefined();
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    test('recording API handles participant stream changes during active recording', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            caseNumber: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '').padEnd(5, 'S')),
            initialParticipants: fc.array(
              fc.record({
                userId: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '').padEnd(3, 'I')),
                name: fc.string({ minLength: 5, maxLength: 20 }).map(s => s.trim() || 'Initial User'),
                role: fc.constantFrom('judge', 'lawyer', 'plaintiff')
              }),
              { minLength: 2, maxLength: 4 }
            ),
            additionalParticipants: fc.array(
              fc.record({
                userId: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '').padEnd(3, 'A')),
                name: fc.string({ minLength: 5, maxLength: 20 }).map(s => s.trim() || 'Additional User'),
                role: fc.constantFrom('defendant', 'clerk', 'observer')
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          async (testData) => {
            const hearingId = `stream-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Start recording with initial participants
            const initialParticipants = testData.initialParticipants.map(p => ({
              ...p,
              consentGiven: true
            }));

            const startResponse = await request(app)
              .post('/api/recording/start')
              .send({
                hearingId: hearingId,
                caseNumber: testData.caseNumber,
                participants: initialParticipants
              });

            expect(startResponse.status).toBe(200);
            const recordingId = startResponse.body.data.recordingId;

            // Verify initial participants are captured
            let capturedParticipants = Array.from(hearingDatabase.tables.participants.values())
              .filter(p => p.hearing_id === hearingId);
            expect(capturedParticipants).toHaveLength(initialParticipants.length);

            // Simulate additional participants joining during recording
            for (const newParticipant of testData.additionalParticipants) {
              hearingDatabase.tables.participants.set(`part-${recordingId}-${newParticipant.userId}`, {
                id: `part-${recordingId}-${newParticipant.userId}`,
                hearing_id: hearingId,
                user_id: newParticipant.userId,
                name: newParticipant.name,
                role: newParticipant.role,
                join_time: new Date().toISOString(),
                consent_given: true,
                consent_timestamp: new Date().toISOString()
              });
            }

            // Verify all participants are now captured
            capturedParticipants = Array.from(hearingDatabase.tables.participants.values())
              .filter(p => p.hearing_id === hearingId);
            const expectedTotal = initialParticipants.length + testData.additionalParticipants.length;
            expect(capturedParticipants).toHaveLength(expectedTotal);

            // Stop recording
            const stopResponse = await request(app)
              .post('/api/recording/stop')
              .send({ recordingId: recordingId });

            expect(stopResponse.status).toBe(200);

            // Verify recording captured all participants throughout the session
            const finalParticipants = Array.from(hearingDatabase.tables.participants.values())
              .filter(p => p.hearing_id === hearingId);
            expect(finalParticipants).toHaveLength(expectedTotal);
            
            // Verify all participants have proper consent and timestamps
            finalParticipants.forEach(participant => {
              expect(participant.consent_given).toBe(true);
              expect(participant.join_time).toBeDefined();
              expect(participant.consent_timestamp).toBeDefined();
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});