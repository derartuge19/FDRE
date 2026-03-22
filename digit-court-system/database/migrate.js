// PostgreSQL Migration Script for Ethiopian Court System
const { query, testConnection, close } = require('./postgres-config');

// Migration SQL scripts
const migrations = [
    {
        name: '001_create_users_table',
        sql: `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                roles TEXT[] NOT NULL DEFAULT '{}',
                permissions TEXT[] NOT NULL DEFAULT '{}',
                mfa_enabled BOOLEAN DEFAULT FALSE,
                mfa_secret VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                failed_attempts INTEGER DEFAULT 0,
                is_locked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
        `
    },
    {
        name: '002_create_hearings_table',
        sql: `
            CREATE TABLE IF NOT EXISTS hearings (
                id VARCHAR(50) PRIMARY KEY,
                case_number VARCHAR(50) NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'postponed')),
                presiding_judge VARCHAR(100) NOT NULL,
                courtroom VARCHAR(50),
                hearing_type VARCHAR(50) DEFAULT 'virtual' CHECK (hearing_type IN ('virtual', 'physical', 'hybrid')),
                created_by VARCHAR(50) REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_hearings_case_number ON hearings(case_number);
            CREATE INDEX IF NOT EXISTS idx_hearings_start_time ON hearings(start_time);
            CREATE INDEX IF NOT EXISTS idx_hearings_status ON hearings(status);
            CREATE INDEX IF NOT EXISTS idx_hearings_judge ON hearings(presiding_judge);
        `
    },
    {
        name: '003_create_recordings_table',
        sql: `
            CREATE TABLE IF NOT EXISTS recordings (
                id VARCHAR(50) PRIMARY KEY,
                hearing_id VARCHAR(50) NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size BIGINT NOT NULL DEFAULT 0,
                duration INTEGER NOT NULL DEFAULT 0, -- in seconds
                format VARCHAR(10) DEFAULT 'webm' CHECK (format IN ('webm', 'mp4', 'wav', 'mp3')),
                checksum VARCHAR(64), -- SHA-256 hash
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                status VARCHAR(20) DEFAULT 'recording' CHECK (status IN ('recording', 'completed', 'failed', 'processing')),
                quality VARCHAR(20) DEFAULT 'standard' CHECK (quality IN ('low', 'standard', 'high', 'hd')),
                created_by VARCHAR(50) REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_recordings_hearing_id ON recordings(hearing_id);
            CREATE INDEX IF NOT EXISTS idx_recordings_start_time ON recordings(start_time);
            CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
            CREATE INDEX IF NOT EXISTS idx_recordings_filename ON recordings(filename);
        `
    },
    {
        name: '004_create_participants_table',
        sql: `
            CREATE TABLE IF NOT EXISTS participants (
                id VARCHAR(50) PRIMARY KEY,
                hearing_id VARCHAR(50) NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
                user_id VARCHAR(50) REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                role VARCHAR(50) NOT NULL CHECK (role IN ('judge', 'lawyer', 'defendant', 'plaintiff', 'witness', 'clerk', 'observer')),
                join_time TIMESTAMP,
                leave_time TIMESTAMP,
                consent_given BOOLEAN DEFAULT FALSE,
                consent_timestamp TIMESTAMP,
                connection_quality VARCHAR(20) DEFAULT 'good' CHECK (connection_quality IN ('poor', 'fair', 'good', 'excellent')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_participants_hearing_id ON participants(hearing_id);
            CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
            CREATE INDEX IF NOT EXISTS idx_participants_role ON participants(role);
            CREATE INDEX IF NOT EXISTS idx_participants_join_time ON participants(join_time);
        `
    },
    {
        name: '005_create_recording_metadata_table',
        sql: `
            CREATE TABLE IF NOT EXISTS recording_metadata (
                id VARCHAR(50) PRIMARY KEY,
                recording_id VARCHAR(50) NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
                metadata_type VARCHAR(50) NOT NULL CHECK (metadata_type IN ('technical', 'legal', 'quality', 'security')),
                key VARCHAR(100) NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_recording_metadata_recording_id ON recording_metadata(recording_id);
            CREATE INDEX IF NOT EXISTS idx_recording_metadata_type ON recording_metadata(metadata_type);
            CREATE INDEX IF NOT EXISTS idx_recording_metadata_key ON recording_metadata(key);
        `
    },
    {
        name: '006_create_recording_access_log_table',
        sql: `
            CREATE TABLE IF NOT EXISTS recording_access_log (
                id VARCHAR(50) PRIMARY KEY,
                recording_id VARCHAR(50) NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
                user_id VARCHAR(50) REFERENCES users(id),
                access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('view', 'download', 'stream', 'delete', 'share')),
                ip_address INET,
                user_agent TEXT,
                access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                duration INTEGER, -- in seconds for streaming
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_access_log_recording_id ON recording_access_log(recording_id);
            CREATE INDEX IF NOT EXISTS idx_access_log_user_id ON recording_access_log(user_id);
            CREATE INDEX IF NOT EXISTS idx_access_log_access_time ON recording_access_log(access_time);
            CREATE INDEX IF NOT EXISTS idx_access_log_access_type ON recording_access_log(access_type);
        `
    },
    {
        name: '007_create_storage_usage_table',
        sql: `
            CREATE TABLE IF NOT EXISTS storage_usage (
                id VARCHAR(50) PRIMARY KEY,
                date DATE NOT NULL,
                total_recordings INTEGER DEFAULT 0,
                total_size BIGINT DEFAULT 0, -- in bytes
                total_duration INTEGER DEFAULT 0, -- in seconds
                average_file_size BIGINT DEFAULT 0,
                storage_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_usage_date ON storage_usage(date);
        `
    },
    {
        name: '008_create_cases_table',
        sql: `
            CREATE TABLE IF NOT EXISTS cases (
                id VARCHAR(50) PRIMARY KEY,
                case_number VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                case_type VARCHAR(50) NOT NULL CHECK (case_type IN ('civil', 'criminal', 'family', 'commercial', 'administrative')),
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended', 'appealed')),
                plaintiff VARCHAR(255),
                defendant VARCHAR(255),
                assigned_judge VARCHAR(100),
                court_division VARCHAR(100),
                filing_date DATE,
                created_by VARCHAR(50) REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
            CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
            CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
            CREATE INDEX IF NOT EXISTS idx_cases_judge ON cases(assigned_judge);
            CREATE INDEX IF NOT EXISTS idx_cases_filing_date ON cases(filing_date);
        `
    },
    {
        name: '009_add_case_reference_to_hearings',
        sql: `
            ALTER TABLE hearings ADD COLUMN IF NOT EXISTS case_id VARCHAR(50) REFERENCES cases(id);
            CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON hearings(case_id);
        `
    },
    {
        name: '010_create_updated_at_triggers',
        sql: `
            -- Function to update updated_at timestamp
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            -- Create triggers for all tables with updated_at column
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_hearings_updated_at ON hearings;
            CREATE TRIGGER update_hearings_updated_at BEFORE UPDATE ON hearings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_recordings_updated_at ON recordings;
            CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
            CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
            CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
    },
    {
        name: '011_create_messages_table',
        sql: `
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(50) PRIMARY KEY,
                sender_id VARCHAR(50) NOT NULL REFERENCES users(id),
                recipient_id VARCHAR(50) REFERENCES users(id), -- Null for group messages (future)
                room_id VARCHAR(50), -- Used for grouping messages in a context
                content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
                attachments JSONB DEFAULT '[]',
                is_deleted BOOLEAN DEFAULT FALSE,
                edited_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
            CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
            CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
            
            DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
            CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
    }
];

async function runMigrations(shouldClose = true) {
    console.log('🚀 Starting PostgreSQL migrations for Ethiopian Court System...');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Cannot connect to PostgreSQL. Please ensure:');
        console.error('   1. PostgreSQL is installed and running');
        console.error('   2. Database "court" exists');
        console.error('   3. Connection credentials are correct');
        if (shouldClose) process.exit(1);
        throw new Error('Database connection failed');
    }
    
    try {
        // Create migrations tracking table
        await query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Get already executed migrations
        const executedResult = await query('SELECT name FROM migrations');
        const executedMigrations = executedResult.rows.map(row => row.name);
        
        // Run pending migrations
        for (const migration of migrations) {
            if (executedMigrations.includes(migration.name)) {
                console.log(`⏭️  Skipping ${migration.name} (already executed)`);
                continue;
            }
            
            console.log(`🔄 Running migration: ${migration.name}`);
            
            try {
                await query(migration.sql);
                await query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
                console.log(`✅ Migration ${migration.name} completed`);
            } catch (error) {
                console.error(`❌ Migration ${migration.name} failed:`, error.message);
                throw error;
            }
        }
        
        console.log('🎉 All migrations completed successfully!');
        
        // Show database info
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📊 Database tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`   📋 ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        if (shouldClose) process.exit(1);
        throw error;
    } finally {
        if (shouldClose) await close();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations, migrations };