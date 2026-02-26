'use strict';

const { Router } = require('express');
const { runMigration } = require('../services/migrationService');
const router = Router();

router.get('/', (req, res) => {
    res.json({
        ok: true,
        message: 'SaludPlus Migration Endpoint',
        endpoints: {
            migrate: 'POST /api/simulacro/migrate'
        }
    });
});

router.post('/migrate', async (req, res) => {
    try {
        const { clearBefore = false } = req.body;
        console.log(' Iniciando migración...');

        const result = await runMigration({ clearBefore });

        res.status(200).json({
            ok: true,
            message: 'Migration completed successfully',
            result
        });

    } catch (error) {
        console.error(' Migration error:', error.message);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

module.exports = router;
