'use strict';

const { Router } = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = Router();

// Públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protegida — requiere token
router.get('/me', authMiddleware, authController.me);

module.exports = router;