// PostgreSQL Database Service for Virtual Hearing Recording System
const { query, getClient, testConnection } = require('./postgres-config');
const crypto = require('crypto');

class PostgresHearingDatabase {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log('🗄️ Initializing PostgreSQL Virtual Hearing Recording Database...');
        
        // Test connection
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Failed to connect to PostgreSQL database');
        }
        
        this.initialized = true;
        console.log('✅ PostgreSQL database initialized successfully');
    }

    // User management
    async createUser(userData) {
        const id = userData.id || `user-${Date.now()}`;
        const passwordHash = userData.password_hash || userData.password; // In production, hash the password
        
        const result = await query(`
            INSERT INTO users (id, username, password_hash, name, email, roles, permissions, mfa_enabled, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            id,
            userData.username,
            passwordHash,
            userData.name,
            userData.email,
            userData.roles || [],
            userData.permissions || [],
            userData.mfa_enabled || false,
            userData.is_active !== false
        ]);
        
        return result.rows[0];
    }

    async getUserByUsername(username) {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    }

    async getUserById(id) {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    async updateUser(id, updates) {
        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(updates)];
        
        const result = await query(`
            UPDATE users SET ${setClause} WHERE id = $1 RETURNING *
        `, values);
        
        return result.rows[0];
    }

    // Case management
    async createCase(caseData) {
        const id = caseData.id || `case-${Date.now()}`;
        
        const result = await query(`
            INSERT INTO cases (id, case_number, title, description, case_type, status, plaintiff, defendant, assigned_judge, court_division, filing_date, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            id,
            caseData.case_number,
            caseData.title,
            caseData.description,
            caseData.case_type,
            caseData.status || 'active',
            caseData.plaintiff,
            caseData.defendant,
            caseData.assigned_judge,
            caseData.court_division,
            caseData.filing_date,
            caseData.created_by
        ]);
        
        return result.rows[0];
    }

    async getCases(filters = {}) {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.status) {
            whereClause += ` AND status = $${++paramCount}`;
            values.push(filters.status);
        }
        if (filters.case_number) {
            whereClause += ` AND case_number ILIKE $${++paramCount}`;
            values.push(`%${filters.case_number}%`);
        }
        if (filters.case_type) {
            whereClause += ` AND case_type = $${++paramCount}`;
            values.push(filters.case_type);
        }

        const result = await query(`
            SELECT * FROM cases ${whereClause} ORDER BY created_at DESC
        `, values);
        
        return result.rows;
    }

    // Hearing management
    async createHearing(hearingData) {
        const id = hearingData.id || `hearing-${Date.now()}`;
        
        const result = await query(`
            INSERT INTO hearings (id, case_number, title, description, start_time, end_time, status, presiding_judge, courtroom, hearing_type, case_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            id,
            hearingData.case_number,
            hearingData.title,
            hearingData.description,
            hearingData.start_time,
            hearingData.end_time,
            hearingData.status || 'scheduled',
            hearingData.presiding_judge,
            hearingData.courtroom,
            hearingData.hearing_type || 'virtual',
            hearingData.case_id,
            hearingData.created_by
        ]);
        
        return result.rows[0];
    }

    async getHearings(filters = {}) {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.status) {
            whereClause += ` AND status = $${++paramCount}`;
            values.push(filters.status);
        }
        if (filters.case_number) {
            whereClause += ` AND case_number ILIKE $${++paramCount}`;
            values.push(`%${filters.case_number}%`);
        }
        if (filters.date) {
            whereClause += ` AND DATE(start_time) = $${++paramCount}`;
            values.push(filters.date);
        }

        const result = await query(`
            SELECT h.*, c.title as case_title 
            FROM hearings h 
            LEFT JOIN cases c ON h.case_id = c.id 
            ${whereClause} 
            ORDER BY start_time DESC
        `, values);
        
        return result.rows;
    }

    async getHearingById(id) {
        const result = await query('SELECT * FROM hearings WHERE id = $1', [id]);
        return result.rows[0];
    }

    async updateHearing(id, updates) {
        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(updates)];
        
        const result = await query(`
            UPDATE hearings SET ${setClause} WHERE id = $1 RETURNING *
        `, values);
        
        return result.rows[0];
    }

    // Recording management
    async createRecording(recordingData) {
        const id = recordingData.id || `rec-${Date.now()}`;
        
        const result = await query(`
            INSERT INTO recordings (id, hearing_id, filename, file_path, file_size, duration, format, checksum, start_time, end_time, status, quality, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            id,
            recordingData.hearing_id,
            recordingData.filename,
            recordingData.file_path,
            recordingData.file_size || 0,
            recordingData.duration || 0,
            recordingData.format || 'webm',
            recordingData.checksum,
            recordingData.start_time,
            recordingData.end_time,
            recordingData.status || 'recording',
            recordingData.quality || 'standard',
            recordingData.created_by
        ]);
        
        return result.rows[0];
    }

    async getRecordings(hearingId = null) {
        let whereClause = '';
        const values = [];

        if (hearingId) {
            whereClause = 'WHERE hearing_id = $1';
            values.push(hearingId);
        }

        const result = await query(`
            SELECT r.*, h.case_number, h.title as hearing_title 
            FROM recordings r 
            LEFT JOIN hearings h ON r.hearing_id = h.id 
            ${whereClause} 
            ORDER BY r.start_time DESC
        `, values);
        
        return result.rows;
    }

    async getRecordingById(id) {
        const result = await query(`
            SELECT r.*, h.case_number, h.title as hearing_title 
            FROM recordings r 
            LEFT JOIN hearings h ON r.hearing_id = h.id 
            WHERE r.id = $1
        `, [id]);
        
        return result.rows[0];
    }

    async updateRecording(recordingId, updates) {
        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [recordingId, ...Object.values(updates)];
        
        const result = await query(`
            UPDATE recordings SET ${setClause} WHERE id = $1 RETURNING *
        `, values);
        
        return result.rows[0];
    }

    // Participant management
    async createParticipant(participantData) {
        const id = participantData.id || `part-${Date.now()}`;
        
        const result = await query(`
            INSERT INTO participants (id, hearing_id, user_id, name, email, role, join_time, leave_time, consent_given, consent_timestamp, connection_quality)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            id,
            participantData.hearing_id,
            participantData.user_id,
            participantData.name,
            participantData.email,
            participantData.role,
            participantData.join_time,
            participantData.leave_time,
            participantData.consent_given || false,
            participantData.consent_timestamp,
            participantData.connection_quality || 'good'
        ]);
        
        return result.rows[0];
    }

    async getParticipants(hearingId) {
        const result = await query(`
            SELECT p.*, u.username 
            FROM participants p 
            LEFT JOIN users u ON p.user_id = u.id 
            WHERE p.hearing_id = $1 
            ORDER BY p.join_time ASC
        `, [hearingId]);
        
        return result.rows;
    }

    async updateParticipant(id, updates) {
        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(updates)];
        
        const result = await query(`
            UPDATE participants SET ${setClause} WHERE id = $1 RETURNING *
        `, values);
        
        return result.rows[0];
    }

    // Access logging
    async logAccess(accessData) {
        const id = accessData.id || `log-${Date.now()}`;
        
        const result = await query(`
            INSERT INTO recording_access_log (id, recording_id, user_id, access_type, ip_address, user_agent, duration, success, error_message)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            id,
            accessData.recording_id,
            accessData.user_id,
            accessData.access_type,
            accessData.ip_address,
            accessData.user_agent,
            accessData.duration,
            accessData.success !== false,
            accessData.error_message
        ]);
        
        return result.rows[0];
    }

    async getAccessLogs(recordingId = null, userId = null) {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (recordingId) {
            whereClause += ` AND recording_id = $${++paramCount}`;
            values.push(recordingId);
        }
        if (userId) {
            whereClause += ` AND user_id = $${++paramCount}`;
            values.push(userId);
        }

        const result = await query(`
            SELECT al.*, u.name as user_name, r.filename 
            FROM recording_access_log al 
            LEFT JOIN users u ON al.user_id = u.id 
            LEFT JOIN recordings r ON al.recording_id = r.id 
            ${whereClause} 
            ORDER BY al.access_time DESC
        `, values);
        
        return result.rows;
    }

    // Storage usage tracking
    async updateStorageUsage() {
        const today = new Date().toISOString().split('T')[0];
        
        // Get current storage statistics
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total_recordings,
                COALESCE(SUM(file_size), 0) as total_size,
                COALESCE(SUM(duration), 0) as total_duration,
                COALESCE(AVG(file_size), 0) as average_file_size
            FROM recordings 
            WHERE status = 'completed'
        `);
        
        const stats = statsResult.rows[0];
        
        // Upsert storage usage record
        await query(`
            INSERT INTO storage_usage (id, date, total_recordings, total_size, total_duration, average_file_size, storage_path)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (date) DO UPDATE SET
                total_recordings = EXCLUDED.total_recordings,
                total_size = EXCLUDED.total_size,
                total_duration = EXCLUDED.total_duration,
                average_file_size = EXCLUDED.average_file_size,
                created_at = CURRENT_TIMESTAMP
        `, [
            `storage-${today}`,
            today,
            parseInt(stats.total_recordings),
            parseInt(stats.total_size),
            parseInt(stats.total_duration),
            parseInt(stats.average_file_size),
            '/recordings'
        ]);
        
        return stats;
    }

    async getStorageUsage(days = 30) {
        const result = await query(`
            SELECT * FROM storage_usage 
            WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY date DESC
        `);
        
        return result.rows;
    }

    // Database schema information
    getTableSchema() {
        return {
            users: {
                description: 'System users (judges, lawyers, clerks, etc.)',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique user identifier' },
                    { name: 'username', type: 'VARCHAR(100)', key: 'UNIQUE', description: 'Login username' },
                    { name: 'password_hash', type: 'VARCHAR(255)', key: '', description: 'Hashed password' },
                    { name: 'name', type: 'VARCHAR(255)', key: '', description: 'Full name' },
                    { name: 'email', type: 'VARCHAR(255)', key: 'UNIQUE', description: 'Email address' },
                    { name: 'roles', type: 'TEXT[]', key: '', description: 'User roles array' },
                    { name: 'permissions', type: 'TEXT[]', key: '', description: 'User permissions array' },
                    { name: 'mfa_enabled', type: 'BOOLEAN', key: '', description: 'Multi-factor authentication enabled' },
                    { name: 'is_active', type: 'BOOLEAN', key: 'INDEX', description: 'Account active status' },
                    { name: 'created_at', type: 'TIMESTAMP', key: '', description: 'Account creation time' }
                ]
            },
            cases: {
                description: 'Legal cases in the court system',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique case identifier' },
                    { name: 'case_number', type: 'VARCHAR(50)', key: 'UNIQUE', description: 'Court case number' },
                    { name: 'title', type: 'VARCHAR(500)', key: '', description: 'Case title' },
                    { name: 'case_type', type: 'VARCHAR(50)', key: 'INDEX', description: 'Type of case (civil, criminal, etc.)' },
                    { name: 'status', type: 'VARCHAR(20)', key: 'INDEX', description: 'Case status' },
                    { name: 'plaintiff', type: 'VARCHAR(255)', key: '', description: 'Plaintiff name' },
                    { name: 'defendant', type: 'VARCHAR(255)', key: '', description: 'Defendant name' },
                    { name: 'assigned_judge', type: 'VARCHAR(100)', key: 'INDEX', description: 'Assigned judge' }
                ]
            },
            hearings: {
                description: 'Court hearings and sessions',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique hearing identifier' },
                    { name: 'case_id', type: 'VARCHAR(50)', key: 'FOREIGN', description: 'Associated case ID' },
                    { name: 'case_number', type: 'VARCHAR(50)', key: 'INDEX', description: 'Court case number' },
                    { name: 'title', type: 'VARCHAR(500)', key: '', description: 'Hearing title' },
                    { name: 'start_time', type: 'TIMESTAMP', key: 'INDEX', description: 'Scheduled start time' },
                    { name: 'end_time', type: 'TIMESTAMP', key: '', description: 'Actual end time' },
                    { name: 'status', type: 'VARCHAR(20)', key: 'INDEX', description: 'Hearing status' },
                    { name: 'presiding_judge', type: 'VARCHAR(100)', key: 'INDEX', description: 'Presiding judge' },
                    { name: 'hearing_type', type: 'VARCHAR(50)', key: '', description: 'Virtual, physical, or hybrid' }
                ]
            },
            recordings: {
                description: 'Video/audio recordings of hearings',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique recording identifier' },
                    { name: 'hearing_id', type: 'VARCHAR(50)', key: 'FOREIGN', description: 'Associated hearing ID' },
                    { name: 'filename', type: 'VARCHAR(255)', key: 'INDEX', description: 'Recording file name' },
                    { name: 'file_path', type: 'VARCHAR(500)', key: '', description: 'Full file system path' },
                    { name: 'file_size', type: 'BIGINT', key: '', description: 'File size in bytes' },
                    { name: 'duration', type: 'INTEGER', key: '', description: 'Recording duration in seconds' },
                    { name: 'format', type: 'VARCHAR(10)', key: '', description: 'Video format (webm, mp4)' },
                    { name: 'checksum', type: 'VARCHAR(64)', key: '', description: 'SHA-256 file hash' },
                    { name: 'status', type: 'VARCHAR(20)', key: 'INDEX', description: 'Recording status' },
                    { name: 'quality', type: 'VARCHAR(20)', key: '', description: 'Recording quality level' }
                ]
            },
            participants: {
                description: 'Hearing participants and their details',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique participant identifier' },
                    { name: 'hearing_id', type: 'VARCHAR(50)', key: 'FOREIGN', description: 'Associated hearing ID' },
                    { name: 'user_id', type: 'VARCHAR(50)', key: 'FOREIGN', description: 'System user ID (if registered)' },
                    { name: 'name', type: 'VARCHAR(255)', key: '', description: 'Participant full name' },
                    { name: 'role', type: 'VARCHAR(50)', key: 'INDEX', description: 'Participant role' },
                    { name: 'join_time', type: 'TIMESTAMP', key: 'INDEX', description: 'When participant joined' },
                    { name: 'leave_time', type: 'TIMESTAMP', key: '', description: 'When participant left' },
                    { name: 'consent_given', type: 'BOOLEAN', key: '', description: 'Recording consent status' },
                    { name: 'connection_quality', type: 'VARCHAR(20)', key: '', description: 'Connection quality rating' }
                ]
            },
            recording_access_log: {
                description: 'Audit log for recording access',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique log entry identifier' },
                    { name: 'recording_id', type: 'VARCHAR(50)', key: 'FOREIGN', description: 'Accessed recording ID' },
                    { name: 'user_id', type: 'VARCHAR(50)', key: 'FOREIGN', description: 'User who accessed recording' },
                    { name: 'access_type', type: 'VARCHAR(50)', key: 'INDEX', description: 'Type of access (view, download, etc.)' },
                    { name: 'access_time', type: 'TIMESTAMP', key: 'INDEX', description: 'When access occurred' },
                    { name: 'ip_address', type: 'INET', key: '', description: 'Client IP address' },
                    { name: 'success', type: 'BOOLEAN', key: '', description: 'Whether access was successful' }
                ]
            },
            storage_usage: {
                description: 'Daily storage usage statistics',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', key: 'PRIMARY', description: 'Unique usage record identifier' },
                    { name: 'date', type: 'DATE', key: 'UNIQUE', description: 'Date of usage record' },
                    { name: 'total_recordings', type: 'INTEGER', key: '', description: 'Total number of recordings' },
                    { name: 'total_size', type: 'BIGINT', key: '', description: 'Total storage used in bytes' },
                    { name: 'total_duration', type: 'INTEGER', key: '', description: 'Total recording duration in seconds' },
                    { name: 'average_file_size', type: 'BIGINT', key: '', description: 'Average file size in bytes' }
                ]
            }
        };
    }
}

// Export singleton instance
const postgresHearingDatabase = new PostgresHearingDatabase();

module.exports = postgresHearingDatabase;