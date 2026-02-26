'use strict';

const { Router } = require('express');
const router = Router();

// TODO: implementar auth
router.get('/', (req, res) => {
    res.json({ ok: true, message: 'Auth routes - coming soon' });
});

module.exports = router;