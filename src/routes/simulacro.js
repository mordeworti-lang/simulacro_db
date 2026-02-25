'use strict';

const { Router } = require('express');
const router = Router();

// TODO: implementar migración
router.get('/', (req, res) => {
    res.json({ ok: true, message: 'Simulacro routes - coming soon' });
});

module.exports = router;