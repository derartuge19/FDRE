
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'court',
    password: 'dere2010',
    port: 5432,
});

async function test() {
    try {
        console.log('Testing connection...');
        const client = await pool.connect();
        console.log('Connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        client.release();
        await pool.end();
    } catch (err) {
        console.error('Connection error:', err.stack);
        await pool.end();
    }
}

test();
