'use strict';

const { Router } = require('express');
const router = Router();

// TODO: implementar reports
router.get('/revenue', (req, res) => {
    res.json({ ok: true, message: 'Reports routes - coming soon' });
});

module.exports = router;