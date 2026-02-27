#!/usr/bin/env node
/**
 * rehash-migrated.js
 * Assigns a default password (saludplus123) to all migrated users
 * so they can log in from the frontend.
 *
 * Usage:  node scripts/rehash-migrated.js
 * Or via API: POST /api/admin/rehash-migrated  (admin token required)
 */
'use strict';

require('../src/config/env');
const { pool } = require('../src/config/postgres');
const { hashPassword } = require('../src/utils/hash');

const DEFAULT_PASSWORD = 'saludplus123';

async function rehash() {
    const hashed = await hashPassword(DEFAULT_PASSWORD);

    const result = await pool.query(
        `UPDATE users
         SET password = $1
         WHERE password = 'migrated_no_password'
         RETURNING id, name, email, role`,
        [hashed]
    );

    console.log(`\nRe-hasheados: ${result.rows.length} usuarios`);
    result.rows.forEach(u => console.log(`  [${u.role}] ${u.name} — ${u.email}`));
    console.log(`\nContraseña asignada: "${DEFAULT_PASSWORD}"`);
    console.log('Los usuarios pueden iniciar sesión con esa contraseña.\n');

    await pool.end();
}

rehash().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
