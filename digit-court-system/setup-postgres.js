// PostgreSQL Setup Script for Ethiopian Court System
const { execSync } = require('child_process');
const { testConnection } = require('./database/postgres-config');
const { runMigrations } = require('./database/migrate');
const { seedDatabase } = require('./database/seed');

async function setupPostgreSQL() {
    console.log('🚀 Setting up PostgreSQL for Ethiopian Court System...\n');
    
    try {
        // Step 1: Install dependencies
        console.log('📦 Installing PostgreSQL dependencies...');
        try {
            execSync('npm install pg pg-pool bcrypt', { stdio: 'inherit' });
            console.log('✅ Dependencies installed successfully\n');
        } catch (error) {
            console.error('❌ Failed to install dependencies:', error.message);
            console.log('Please run: npm install pg pg-pool bcrypt\n');
        }
        
        // Step 2: Check PostgreSQL connection
        console.log('🔌 Testing PostgreSQL connection...');
        const connected = await testConnection();
        
        if (!connected) {
            console.log('\n❌ PostgreSQL connection failed!');
            console.log('\n📋 Setup Instructions:');
            console.log('1. Install PostgreSQL:');
            console.log('   - Windows: Download from https://www.postgresql.org/download/windows/');
            console.log('   - macOS: brew install postgresql');
            console.log('   - Linux: sudo apt-get install postgresql postgresql-contrib');
            console.log('\n2. Start PostgreSQL service:');
            console.log('   - Windows: Start "PostgreSQL" service in Services');
            console.log('   - macOS/Linux: sudo service postgresql start');
            console.log('\n3. Create database:');
            console.log('   psql -U postgres -c "CREATE DATABASE court;"');
            console.log('\n4. Set environment variables (optional):');
            console.log('   DB_HOST=localhost');
            console.log('   DB_PORT=5432');
            console.log('   DB_NAME=court');
            console.log('   DB_USER=postgres');
            console.log('   DB_PASSWORD=postgres');
            console.log('\n5. Run this setup script again');
            return;
        }
        
        // Step 3: Run migrations
        console.log('🔄 Running database migrations...');
        await runMigrations();
        console.log('✅ Migrations completed\n');
        
        // Step 4: Seed database
        console.log('🌱 Seeding database with sample data...');
        await seedDatabase();
        console.log('✅ Database seeded successfully\n');
        
        console.log('🎉 PostgreSQL setup completed successfully!');
        console.log('\n📊 What was created:');
        console.log('   🗄️  Database: court');
        console.log('   📋 Tables: users, cases, hearings, recordings, participants, etc.');
        console.log('   👥 Sample users: judge.alemu, lawyer.sara, admin.system, etc.');
        console.log('   📁 Sample cases: CIV-2026-001, CIV-2026-002, FAM-2026-001');
        console.log('   📅 Sample hearings with recordings');
        console.log('\n🚀 You can now start the server with: node server.js');
        console.log('🔍 View database: http://localhost:5173/database-viewer.html');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Create a simple database status check
async function checkDatabaseStatus() {
    console.log('📊 Checking database status...\n');
    
    try {
        const connected = await testConnection();
        if (!connected) {
            console.log('❌ Database not connected');
            return;
        }
        
        const db = require('./database/postgres-database');
        await db.initialize();
        
        // Get counts
        const hearings = await db.getHearings();
        const recordings = await db.getRecordings();
        const cases = await db.getCases();
        
        console.log('✅ Database Status:');
        console.log(`   📁 Cases: ${cases.length}`);
        console.log(`   📅 Hearings: ${hearings.length}`);
        console.log(`   🎥 Recordings: ${recordings.length}`);
        console.log(`   💾 Storage: ${recordings.reduce((sum, r) => sum + (r.file_size || 0), 0)} bytes`);
        
        // Show recent recordings
        if (recordings.length > 0) {
            console.log('\n📹 Recent Recordings:');
            recordings.slice(0, 3).forEach(rec => {
                console.log(`   • ${rec.filename} (${rec.duration}s, ${rec.file_size} bytes)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Status check failed:', error);
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'setup':
        setupPostgreSQL();
        break;
    case 'status':
        checkDatabaseStatus();
        break;
    case 'migrate':
        runMigrations();
        break;
    case 'seed':
        seedDatabase();
        break;
    default:
        console.log('🗄️  PostgreSQL Setup for Ethiopian Court System\n');
        console.log('Usage:');
        console.log('  node setup-postgres.js setup   - Full setup (install, migrate, seed)');
        console.log('  node setup-postgres.js status  - Check database status');
        console.log('  node setup-postgres.js migrate - Run migrations only');
        console.log('  node setup-postgres.js seed    - Seed database only');
        break;
}

module.exports = { setupPostgreSQL, checkDatabaseStatus };