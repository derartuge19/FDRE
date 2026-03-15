# PostgreSQL Setup for Ethiopian Court System

This document explains how to set up PostgreSQL for the Virtual Hearing Recording System.

## 🎯 Overview

The system has been migrated from a mock in-memory database to a full PostgreSQL database with the following features:

- **Database Name**: `court`
- **Tables**: 8 main tables with relationships
- **Recording Storage**: File system + PostgreSQL metadata
- **Sample Data**: Pre-populated with users, cases, hearings, and recordings

## 📋 Prerequisites

1. **PostgreSQL Installation**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Node.js Dependencies**
   - `pg` - PostgreSQL client
   - `pg-pool` - Connection pooling
   - `bcrypt` - Password hashing

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
node setup-postgres.js setup
```

This will:
- Install required npm packages
- Test PostgreSQL connection
- Run all database migrations
- Seed the database with sample data

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   npm install pg pg-pool bcrypt
   ```

2. **Create Database**
   ```sql
   psql -U postgres -c "CREATE DATABASE court;"
   ```

3. **Run Migrations**
   ```bash
   node setup-postgres.js migrate
   ```

4. **Seed Database**
   ```bash
   node setup-postgres.js seed
   ```

## 🗄️ Database Schema

### Core Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| `users` | System users (judges, lawyers, etc.) | Authentication, roles, permissions |
| `cases` | Legal cases | Case numbers, parties, status |
| `hearings` | Court hearings/sessions | Virtual/physical, scheduling |
| `recordings` | Video/audio recordings | File metadata, checksums |
| `participants` | Hearing participants | Consent tracking, connection quality |
| `recording_access_log` | Audit trail | Who accessed what, when |
| `storage_usage` | Storage statistics | Daily usage tracking |
| `recording_metadata` | Additional metadata | Technical, legal, quality data |

### Relationships

```
cases (1) ←→ (many) hearings
hearings (1) ←→ (many) recordings
hearings (1) ←→ (many) participants
recordings (1) ←→ (many) recording_access_log
users (1) ←→ (many) participants
```

## 📁 Recording Storage

### File System Structure
```
recordings/
├── 2026/
│   ├── 03/
│   │   ├── 13/
│   │   │   ├── hearing-CIV-2026-001-2026-03-13T10-00-00.webm
│   │   │   ├── hearing-CIV-2026-002-2026-03-13T14-00-00.webm
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ...
```

### Database Metadata
- **File Path**: Stored in `recordings.file_path`
- **File Size**: Stored in `recordings.file_size`
- **Checksum**: SHA-256 hash for integrity
- **Duration**: Recording length in seconds
- **Status**: recording, completed, failed, processing

## 👥 Sample Data

### Users
- **judge.alemu** / Judge123! (Judge, Admin)
- **lawyer.sara** / Lawyer123! (Lawyer)
- **admin.system** / Admin123! (System Admin)
- **clerk.mohammed** / Clerk123! (Court Clerk)
- **plaintiff.john** / User123! (Plaintiff)
- **lawyer.robert** / Lawyer123! (Lawyer)

### Cases
- **CIV-2026-001**: Contract Dispute - ABC Corp vs John Doe
- **CIV-2026-002**: Property Dispute - Land Ownership Case
- **FAM-2026-001**: Divorce Proceedings - Custody and Asset Division

### Hearings
- Multiple hearings scheduled and completed
- Virtual hearing rooms configured
- Recording consent tracking

## 🔧 Configuration

### Environment Variables
```bash
DB_HOST=localhost          # PostgreSQL host
DB_PORT=5432              # PostgreSQL port
DB_NAME=court             # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
NODE_ENV=development      # Environment
```

### Connection Pool Settings
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds
- **SSL**: Disabled in development, enabled in production

## 📊 Database Management

### Check Status
```bash
node setup-postgres.js status
```

### View Database
- **Web Interface**: http://localhost:5173/database-viewer.html
- **Direct Access**: `psql -U postgres -d court`

### Backup Database
```bash
pg_dump -U postgres court > court_backup.sql
```

### Restore Database
```bash
psql -U postgres court < court_backup.sql
```

## 🔍 API Endpoints

### Database API
- `GET /api/database/schema` - Database schema
- `GET /api/database/cases` - All cases
- `GET /api/database/hearings` - All hearings
- `GET /api/database/recordings` - All recordings
- `GET /api/database/participants` - All participants
- `GET /api/database/storage-info` - Storage statistics

### Recording API
- `POST /api/recording/start-test` - Start recording (test)
- `POST /api/recording/stop-test` - Stop recording (test)
- `GET /api/recording/:hearingId` - Get recordings for hearing

## 🚨 Troubleshooting

### Connection Issues
1. **PostgreSQL not running**
   ```bash
   # Windows
   net start postgresql-x64-13
   
   # macOS/Linux
   sudo service postgresql start
   ```

2. **Database doesn't exist**
   ```sql
   psql -U postgres -c "CREATE DATABASE court;"
   ```

3. **Permission denied**
   ```sql
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE court TO postgres;"
   ```

### Migration Issues
1. **Table already exists**
   - Migrations are tracked and won't run twice
   - Check `migrations` table for executed migrations

2. **Foreign key constraints**
   - Ensure parent tables exist before child tables
   - Check migration order in `migrate.js`

### Performance Issues
1. **Slow queries**
   - Check indexes on frequently queried columns
   - Use `EXPLAIN ANALYZE` to analyze query performance

2. **Connection pool exhausted**
   - Increase `max` connections in pool config
   - Check for connection leaks

## 📈 Monitoring

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('court')) as database_size;
```

### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'court';
```

## 🔐 Security

### Production Considerations
1. **Password Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access

2. **User Permissions**
   - Create application-specific database user
   - Grant minimal required permissions
   - Avoid using postgres superuser

3. **Data Encryption**
   - Enable SSL/TLS for connections
   - Consider column-level encryption for sensitive data
   - Regular security audits

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl-best-practices.html)

---

**Note**: This system stores recordings as files on the server file system with metadata in PostgreSQL. All recordings are server-side and not stored on client machines.