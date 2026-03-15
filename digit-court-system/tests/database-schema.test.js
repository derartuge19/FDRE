// Property-based tests for database schema integrity
// **Feature: virtual-hearing-recording, Property 2: Recording Lifecycle Integrity Property**

const fc = require('fast-check');
const hearingDatabase = require('../database/init-database');

describe('Database Schema Integrity Tests', () => {
    beforeAll(async () => {
        await hearingDatabase.initialize();
    });

    describe('**Feature: virtual-hearing-recording, Property 2: Recording Lifecycle Integrity Property**', () => {
        test('starting recording creates exactly one database record, stopping finalizes with metadata, and associates with hearing', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate random hearing data
                    fc.record({
                        caseNumber: fc.string({ minLength: 5, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '')),
                        title: fc.string({ minLength: 10, maxLength: 100 }),
                        presidingJudge: fc.string({ minLength: 5, maxLength: 50 })
                    }),
                    // Generate random recording data
                    fc.record({
                        duration: fc.integer({ min: 60, max: 14400 }), // 1 minute to 4 hours
                        fileSize: fc.integer({ min: 1024, max: 1073741824 }), // 1KB to 1GB
                        format: fc.constantFrom('webm', 'mp4')
                    }),
                    async (hearingData, recordingData) => {
                        // Create a hearing
                        const hearingId = `test-hearing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        const hearing = await hearingDatabase.createHearing({
                            id: hearingId,
                            case_number: hearingData.caseNumber,
                            title: hearingData.title,
                            start_time: new Date().toISOString(),
                            status: 'active',
                            presiding_judge: hearingData.presidingJudge
                        });

                        // Verify hearing was created
                        expect(hearing).toBeDefined();
                        expect(hearing.id).toBe(hearingId);
                        expect(hearing.case_number).toBe(hearingData.caseNumber);

                        // Start recording - should create exactly one recording record
                        const recordingId = `test-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        const recording = await hearingDatabase.createRecording({
                            id: recordingId,
                            hearing_id: hearingId,
                            filename: `${hearingData.caseNumber}-recording.${recordingData.format}`,
                            file_path: `/recordings/test/${recordingId}.${recordingData.format}`,
                            file_size: recordingData.fileSize,
                            duration: recordingData.duration,
                            format: recordingData.format,
                            start_time: new Date().toISOString(),
                            status: 'recording'
                        });

                        // Verify recording was created with correct association
                        expect(recording).toBeDefined();
                        expect(recording.id).toBe(recordingId);
                        expect(recording.hearing_id).toBe(hearingId);
                        expect(recording.status).toBe('recording');

                        // Stop recording - should finalize with complete metadata
                        const finalizedRecording = await hearingDatabase.updateRecording(recordingId, {
                            end_time: new Date().toISOString(),
                            status: 'completed',
                            file_size: recordingData.fileSize,
                            duration: recordingData.duration
                        });

                        // Verify recording was finalized properly
                        expect(finalizedRecording.status).toBe('completed');
                        expect(finalizedRecording.end_time).toBeDefined();
                        expect(finalizedRecording.file_size).toBe(recordingData.fileSize);
                        expect(finalizedRecording.duration).toBe(recordingData.duration);

                        // Verify recording is properly associated with hearing case number
                        const hearingRecordings = await hearingDatabase.getRecordings(hearingId);
                        expect(hearingRecordings).toHaveLength(1);
                        expect(hearingRecordings[0].id).toBe(recordingId);
                        expect(hearingRecordings[0].hearing_id).toBe(hearingId);

                        // Verify referential integrity - hearing should exist for recording
                        const associatedHearing = hearingDatabase.tables.hearings.get(hearingId);
                        expect(associatedHearing).toBeDefined();
                        expect(associatedHearing.case_number).toBe(hearingData.caseNumber);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('database maintains referential integrity between hearings and recordings', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            caseNumber: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '')),
                            title: fc.string({ minLength: 10, maxLength: 80 }),
                            recordingCount: fc.integer({ min: 1, max: 3 })
                        }),
                        { minLength: 1, maxLength: 5 }
                    ),
                    async (hearingsData) => {
                        const createdHearings = [];
                        const createdRecordings = [];

                        // Create hearings and their recordings
                        for (const hearingData of hearingsData) {
                            const hearingId = `integrity-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                            
                            const hearing = await hearingDatabase.createHearing({
                                id: hearingId,
                                case_number: hearingData.caseNumber,
                                title: hearingData.title,
                                start_time: new Date().toISOString(),
                                status: 'active',
                                presiding_judge: 'Test Judge'
                            });
                            
                            createdHearings.push(hearing);

                            // Create multiple recordings for this hearing
                            for (let i = 0; i < hearingData.recordingCount; i++) {
                                const recordingId = `rec-${hearingId}-${i}`;
                                const recording = await hearingDatabase.createRecording({
                                    id: recordingId,
                                    hearing_id: hearingId,
                                    filename: `${hearingData.caseNumber}-${i}.webm`,
                                    file_path: `/recordings/test/${recordingId}.webm`,
                                    file_size: 1024 * (i + 1),
                                    duration: 3600,
                                    format: 'webm',
                                    start_time: new Date().toISOString(),
                                    status: 'completed'
                                });
                                
                                createdRecordings.push(recording);
                            }
                        }

                        // Verify all recordings have valid hearing references
                        for (const recording of createdRecordings) {
                            const associatedHearing = hearingDatabase.tables.hearings.get(recording.hearing_id);
                            expect(associatedHearing).toBeDefined();
                            expect(associatedHearing.id).toBe(recording.hearing_id);
                        }

                        // Verify each hearing has the correct number of recordings
                        for (let i = 0; i < createdHearings.length; i++) {
                            const hearing = createdHearings[i];
                            const hearingRecordings = await hearingDatabase.getRecordings(hearing.id);
                            expect(hearingRecordings).toHaveLength(hearingsData[i].recordingCount);
                            
                            // All recordings should belong to this hearing
                            hearingRecordings.forEach(recording => {
                                expect(recording.hearing_id).toBe(hearing.id);
                            });
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('database schema provides complete table structure information', async () => {
            const schema = hearingDatabase.getTableSchema();
            
            // Verify all required tables exist
            expect(schema).toHaveProperty('hearings');
            expect(schema).toHaveProperty('recordings');
            expect(schema).toHaveProperty('participants');

            // Verify hearings table structure
            const hearingsTable = schema.hearings;
            expect(hearingsTable.columns).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY' }),
                    expect.objectContaining({ name: 'case_number', type: 'VARCHAR(50)', key: 'INDEX' }),
                    expect.objectContaining({ name: 'title', type: 'VARCHAR(255)' }),
                    expect.objectContaining({ name: 'start_time', type: 'TIMESTAMP', key: 'INDEX' }),
                    expect.objectContaining({ name: 'status', type: 'ENUM', key: 'INDEX' })
                ])
            );

            // Verify recordings table structure and relationships
            const recordingsTable = schema.recordings;
            expect(recordingsTable.columns).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY' }),
                    expect.objectContaining({ name: 'hearing_id', type: 'VARCHAR(50)', key: 'FOREIGN' }),
                    expect.objectContaining({ name: 'file_size', type: 'BIGINT' }),
                    expect.objectContaining({ name: 'duration', type: 'INT' })
                ])
            );

            expect(recordingsTable.relationships).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        table: 'hearings', 
                        column: 'hearing_id', 
                        references: 'id' 
                    })
                ])
            );

            // Verify participants table structure and relationships
            const participantsTable = schema.participants;
            expect(participantsTable.columns).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY' }),
                    expect.objectContaining({ name: 'hearing_id', type: 'VARCHAR(50)', key: 'FOREIGN' }),
                    expect.objectContaining({ name: 'role', type: 'ENUM', key: 'INDEX' })
                ])
            );

            expect(participantsTable.relationships).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        table: 'hearings', 
                        column: 'hearing_id', 
                        references: 'id' 
                    })
                ])
            );
        });
    });
});