'use strict';

const { Router } = require('express');
const reportController = require('../controllers/reportController');
const router = Router();

router.get('/revenue', reportController.getRevenue);

module.exports = router;