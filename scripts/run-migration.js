'use strict';

require('dotenv').config();

const connectPostgres = require('../src/config/postgres');
const connectMongo = require('../src/config/mongodb');
const { runMigration } = require('../src/services/migrationService');

async function main() {
    try {
        console.log('Connecting to databases...');

        await connectPostgres();
        console.log('PostgreSQL connected');

        await connectMongo();
        console.log('MongoDB connected');

        // Leer argumento --clear desde la terminal
        const clearBefore = process.argv.includes('--clear');

        if (clearBefore) {
            console.log('--clear flag detected, existing data will be deleted');
        }

        console.log('Starting migration...');
        const result = await runMigration({ clearBefore });

        console.log('');
        console.log('========================================');
        console.log('       MIGRATION COMPLETED');
        console.log('========================================');
        console.log(`Insurances:    ${result.insurances}`);
        console.log(`Doctors:       ${result.doctors}`);
        console.log(`Patients:      ${result.patients}`);
        console.log(`Appointments:  ${result.appointments}`);
        console.log(`Histories:     ${result.histories}`);
        console.log(`CSV:           ${result.csvPath}`);
        console.log('========================================');

        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

main();