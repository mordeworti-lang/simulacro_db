'use strict';

const { Router } = require('express');
const router = Router();

// TODO: implementar patients
router.get('/', (req, res) => {
    res.json({ ok: true, message: 'Patients routes - coming soon' });
});

module.exports = router;