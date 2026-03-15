// PostgreSQL Seed Script for Ethiopian Court System
const { testConnection, close } = require('./postgres-config');
const db = require('./postgres-database');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Cannot connect to PostgreSQL database');
        process.exit(1);
    }
    
    try {
        await db.initialize();
        
        // Seed users
        console.log('👥 Seeding users...');
        const users = [
            {
                id: 'judge-alemu',
                username: 'judge.alemu',
                password_hash: await bcrypt.hash('Judge123!', 10),
                name: 'Judge Alemu Bekele',
                email: 'a.bekele@court.gov.et',
                roles: ['judge', 'court_admin'],
                permissions: ['case_management', 'hearing_control', 'virtual_hearing', 'user_management', 'reporting', 'system_config'],
                mfa_enabled: true,
                is_active: true
            },
            {
                id: 'lawyer-sara',
                username: 'lawyer.sara',
                password_hash: await bcrypt.hash('Lawyer123!', 10),
                name: 'Lawyer Sara Ahmed',
                email: 's.ahmed@lawfirm.et',
                roles: ['lawyer'],
                permissions: ['case_management', 'virtual_hearing', 'communication'],
                mfa_enabled: true,
                is_active: true
            },
            {
                id: 'admin-system',
                username: 'admin.system',
                password_hash: await bcrypt.hash('Admin123!', 10),
                name: 'System Administrator',
                email: 'admin@court.gov.et',
                roles: ['admin'],
                permissions: ['user_management', 'case_management', 'hearing_control', 'virtual_hearing', 'communication', 'reporting', 'system_config', 'security'],
                mfa_enabled: true,
                is_active: true
            },
            {
                id: 'clerk-mohammed',
                username: 'clerk.mohammed',
                password_hash: await bcrypt.hash('Clerk123!', 10),
                name: 'Clerk Mohammed Hassan',
                email: 'm.hassan@court.gov.et',
                roles: ['clerk'],
                permissions: ['case_management', 'communication'],
                mfa_enabled: false,
                is_active: true
            },
            {
                id: 'plaintiff-john',
                username: 'plaintiff.john',
                password_hash: await bcrypt.hash('User123!', 10),
                name: 'John Doe',
                email: 'john.doe@email.com',
                roles: ['plaintiff'],
                permissions: ['case_management', 'virtual_hearing'],
                mfa_enabled: false,
                is_active: true
            },
            {
                id: 'lawyer-robert',
                username: 'lawyer.robert',
                password_hash: await bcrypt.hash('Lawyer123!', 10),
                name: 'Lawyer Robert Johnson',
                email: 'r.johnson@lawfirm.et',
                roles: ['lawyer'],
                permissions: ['case_management', 'virtual_hearing', 'communication'],
                mfa_enabled: true,
                is_active: true
            }
        ];
        
        for (const user of users) {
            try {
                await db.createUser(user);
                console.log(`   ✅ Created user: ${user.name}`);
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ⏭️  User already exists: ${user.name}`);
                } else {
                    throw error;
                }
            }
        }
        
        // Seed cases
        console.log('📁 Seeding cases...');
        const cases = [
            {
                id: 'case-001',
                case_number: 'CIV-2026-001',
                title: 'Contract Dispute - ABC Corporation vs John Doe',
                description: 'Breach of contract dispute regarding software development services',
                case_type: 'civil',
                status: 'active',
                plaintiff: 'ABC Corporation',
                defendant: 'John Doe',
                assigned_judge: 'Judge Alemu Bekele',
                court_division: 'Commercial Division',
                filing_date: '2026-02-15',
                created_by: 'clerk-mohammed'
            },
            {
                id: 'case-002',
                case_number: 'CIV-2026-002',
                title: 'Property Dispute - Land Ownership Case',
                description: 'Dispute over land ownership and boundaries in Addis Ababa',
                case_type: 'civil',
                status: 'active',
                plaintiff: 'Meron Tadesse',
                defendant: 'Dawit Alemayehu',
                assigned_judge: 'Judge Alemu Bekele',
                court_division: 'Civil Division',
                filing_date: '2026-03-01',
                created_by: 'clerk-mohammed'
            },
            {
                id: 'case-003',
                case_number: 'FAM-2026-001',
                title: 'Divorce Proceedings - Custody and Asset Division',
                description: 'Divorce case with child custody and property division issues',
                case_type: 'family',
                status: 'active',
                plaintiff: 'Hanan Mohammed',
                defendant: 'Ahmed Hassan',
                assigned_judge: 'Judge Alemu Bekele',
                court_division: 'Family Division',
                filing_date: '2026-02-28',
                created_by: 'clerk-mohammed'
            }
        ];
        
        for (const caseData of cases) {
            try {
                await db.createCase(caseData);
                console.log(`   ✅ Created case: ${caseData.case_number}`);
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ⏭️  Case already exists: ${caseData.case_number}`);
                } else {
                    throw error;
                }
            }
        }
        
        // Seed hearings
        console.log('📅 Seeding hearings...');
        const hearings = [
            {
                id: 'hearing-001',
                case_id: 'case-001',
                case_number: 'CIV-2026-001',
                title: 'Contract Dispute - Initial Hearing',
                description: 'Initial hearing for contract dispute case',
                start_time: '2026-03-13T10:00:00Z',
                end_time: '2026-03-13T12:00:00Z',
                status: 'completed',
                presiding_judge: 'Judge Alemu Bekele',
                courtroom: 'Virtual Room 1',
                hearing_type: 'virtual',
                created_by: 'clerk-mohammed'
            },
            {
                id: 'hearing-002',
                case_id: 'case-002',
                case_number: 'CIV-2026-002',
                title: 'Property Dispute - Evidence Presentation',
                description: 'Hearing for evidence presentation in property dispute',
                start_time: '2026-03-13T14:00:00Z',
                end_time: null,
                status: 'active',
                presiding_judge: 'Judge Alemu Bekele',
                courtroom: 'Virtual Room 2',
                hearing_type: 'virtual',
                created_by: 'clerk-mohammed'
            },
            {
                id: 'hearing-003',
                case_id: 'case-003',
                case_number: 'FAM-2026-001',
                title: 'Divorce Proceedings - Mediation Session',
                description: 'Mediation session for divorce case',
                start_time: '2026-03-14T09:00:00Z',
                end_time: null,
                status: 'scheduled',
                presiding_judge: 'Judge Alemu Bekele',
                courtroom: 'Virtual Room 1',
                hearing_type: 'virtual',
                created_by: 'clerk-mohammed'
            }
        ];
        
        for (const hearing of hearings) {
            try {
                await db.createHearing(hearing);
                console.log(`   ✅ Created hearing: ${hearing.title}`);
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ⏭️  Hearing already exists: ${hearing.title}`);
                } else {
                    throw error;
                }
            }
        }
        
        // Seed recordings
        console.log('🎥 Seeding recordings...');
        const recordings = [
            {
                id: 'rec-001',
                hearing_id: 'hearing-001',
                filename: 'hearing-CIV-2026-001-20260313-100000.webm',
                file_path: '/recordings/2026/03/13/hearing-CIV-2026-001-20260313-100000.webm',
                file_size: 524288000,
                duration: 7200,
                format: 'webm',
                checksum: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
                start_time: '2026-03-13T10:00:00Z',
                end_time: '2026-03-13T12:00:00Z',
                status: 'completed',
                quality: 'high',
                created_by: 'judge-alemu'
            },
            {
                id: 'rec-002',
                hearing_id: 'hearing-002',
                filename: 'hearing-CIV-2026-002-20260313-140000.webm',
                file_path: '/recordings/2026/03/13/hearing-CIV-2026-002-20260313-140000.webm',
                file_size: 256000000,
                duration: 3600,
                format: 'webm',
                checksum: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
                start_time: '2026-03-13T14:00:00Z',
                end_time: '2026-03-13T15:00:00Z',
                status: 'completed',
                quality: 'standard',
                created_by: 'judge-alemu'
            }
        ];
        
        for (const recording of recordings) {
            try {
                await db.createRecording(recording);
                console.log(`   ✅ Created recording: ${recording.filename}`);
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ⏭️  Recording already exists: ${recording.filename}`);
                } else {
                    throw error;
                }
            }
        }
        
        // Seed participants
        console.log('👥 Seeding participants...');
        const participants = [
            {
                id: 'part-001',
                hearing_id: 'hearing-001',
                user_id: 'judge-alemu',
                name: 'Judge Alemu Bekele',
                email: 'a.bekele@court.gov.et',
                role: 'judge',
                join_time: '2026-03-13T09:55:00Z',
                leave_time: '2026-03-13T12:05:00Z',
                consent_given: true,
                consent_timestamp: '2026-03-13T09:55:00Z',
                connection_quality: 'excellent'
            },
            {
                id: 'part-002',
                hearing_id: 'hearing-001',
                user_id: 'lawyer-sara',
                name: 'Lawyer Sara Ahmed',
                email: 's.ahmed@lawfirm.et',
                role: 'lawyer',
                join_time: '2026-03-13T09:58:00Z',
                leave_time: '2026-03-13T12:02:00Z',
                consent_given: true,
                consent_timestamp: '2026-03-13T09:58:00Z',
                connection_quality: 'good'
            },
            {
                id: 'part-003',
                hearing_id: 'hearing-001',
                user_id: 'plaintiff-john',
                name: 'John Doe',
                email: 'john.doe@email.com',
                role: 'plaintiff',
                join_time: '2026-03-13T10:02:00Z',
                leave_time: '2026-03-13T11:58:00Z',
                consent_given: true,
                consent_timestamp: '2026-03-13T10:02:00Z',
                connection_quality: 'fair'
            },
            {
                id: 'part-004',
                hearing_id: 'hearing-002',
                user_id: 'judge-alemu',
                name: 'Judge Alemu Bekele',
                email: 'a.bekele@court.gov.et',
                role: 'judge',
                join_time: '2026-03-13T13:58:00Z',
                leave_time: null,
                consent_given: true,
                consent_timestamp: '2026-03-13T13:58:00Z',
                connection_quality: 'excellent'
            }
        ];
        
        for (const participant of participants) {
            try {
                await db.createParticipant(participant);
                console.log(`   ✅ Created participant: ${participant.name} in ${participant.hearing_id}`);
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ⏭️  Participant already exists: ${participant.name}`);
                } else {
                    throw error;
                }
            }
        }
        
        // Update storage usage
        console.log('💾 Updating storage usage...');
        await db.updateStorageUsage();
        console.log('   ✅ Storage usage updated');
        
        console.log('🎉 Database seeding completed successfully!');
        
        // Show summary
        const hearingsCount = await db.getHearings();
        const recordingsCount = await db.getRecordings();
        const usersCount = await db.getUserById('judge-alemu') ? 'Multiple users' : 'No users';
        
        console.log('\n📊 Database Summary:');
        console.log(`   👥 Users: ${users.length} seeded`);
        console.log(`   📁 Cases: ${cases.length} seeded`);
        console.log(`   📅 Hearings: ${hearingsCount.length} total`);
        console.log(`   🎥 Recordings: ${recordingsCount.length} total`);
        console.log(`   👥 Participants: ${participants.length} seeded`);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await close();
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };