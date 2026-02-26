'use strict';

const { Router } = require('express');
const patientController = require('../controllers/patientController');
const router = Router();

router.get('/:email/history', patientController.getHistory);

module.exports = router;