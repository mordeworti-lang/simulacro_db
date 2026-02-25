const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const connectPostgres = async () => {
    try {
        await pool.query('SELECT 1');
        console.log("PostgreSQL conectado");
    } catch (error) {
        console.error("Error conectando a PostgreSQL:", error);
        throw error;
    }
};

module.exports = connectPostgres;
module.exports.pool = pool;