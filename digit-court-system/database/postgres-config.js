// PostgreSQL Database Configuration for Ethiopian Court System
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'court',
    password: process.env.DB_PASSWORD || 'dere2010',
    port: process.env.DB_PORT || 5432,
    
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // How long to wait for a connection
    
    // SSL configuration (for production)
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully at:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
}

// Execute query with error handling
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed:', { text: text.substring(0, 50) + '...', duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        console.error('📝 Query:', text);
        console.error('📝 Params:', params);
        throw error;
    }
}

// Get a client from the pool for transactions
async function getClient() {
    return await pool.connect();
}

// Close all connections
async function close() {
    await pool.end();
    console.log('🔌 PostgreSQL pool closed');
}

module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    close,
    dbConfig
};