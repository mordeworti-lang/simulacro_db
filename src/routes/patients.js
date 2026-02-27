'use strict';

const { Router } = require('express');
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');
const router = Router();

// Historial por email (admin / doctor)
router.get('/:email/history', authMiddleware, patientController.getHistory);

// Buscar pacientes por nombre o email (doctor / admin)
router.get('/', authMiddleware, patientController.search);

module.exports = router;
