// src/config/postgres.js
'use strict';

const { Pool } = require('pg');
const { DATABASE_URL, NODE_ENV } = require('./env');

// Pool de conexiones — no crear una conexión por request
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,                // máximo 10 conexiones simultáneas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Evento para detectar errores silenciosos en el pool
pool.on('error', (err) => {
    console.error(' PostgreSQL pool error:', err.message);
});

// Función de conexión que se llama en server.js
async function connectPostgres() {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()'); // ping
    } finally {
        client.release(); // siempre liberar el cliente al pool
    }
}

module.exports = connectPostgres;
module.exports.pool = pool; // exportar pool para usarlo en repositories