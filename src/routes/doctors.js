'use strict';

const { Router } = require('express');
const doctorController = require('../controllers/doctorController');
const router = Router();

router.get('/', doctorController.getAll);
router.get('/:id', doctorController.getById);
router.put('/:id', doctorController.update);

module.exports = router;