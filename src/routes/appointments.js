'use strict';

const { Router } = require('express');
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = Router();

// Mis citas: para patient → sus citas; para doctor → sus citas (filtrables por fecha)
router.get('/mine', authMiddleware, appointmentController.mine);

router.get('/', authMiddleware, appointmentController.getAll);
router.get('/:id', authMiddleware, appointmentController.getById);
router.post('/', authMiddleware, appointmentController.create);

module.exports = router;
