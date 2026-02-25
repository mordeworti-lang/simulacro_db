'use strict';

const { Router } = require('express');
const router = Router();

// TODO: implementar doctors
router.get('/', (req, res) => {
    res.json({ ok: true, message: 'Doctors routes - coming soon' });
});

module.exports = router;