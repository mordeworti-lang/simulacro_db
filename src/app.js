require('dotenv').config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const simulacroRoutes = require('./routes/simulacro');
const doctorsRoutes = require('./routes/doctors');
const reportsRoutes = require('./routes/reports');
const patientsRoutes = require('./routes/patients');
const authRoutes = require('./routes/auth');

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// RATE LIMITING GENERAL
// =========================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Demasiadas solicitudes desde esta IP."
});

app.use('/api', limiter);

// =========================
// RATE LIMIT LOGIN
// =========================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Demasiados intentos de login."
});

app.use('/api/auth/login', loginLimiter);

// =========================
// ENDPOINT PRINCIPAL
// =========================
app.get('/', (req, res) => {
    res.json({
        message: "API SaludPlus - Gestión Híbrida SQL/NoSQL",
        version: "1.0.0",
        author: "Jhon Jaramillo",
        endpoints: {
            auth: "/api/auth",
            simulacro: "/api/simulacro",
            doctors: "/api/doctors",
            reports: "/api/reports",
            patients: "/api/patients"
        }
    });
});

// =========================
// RUTAS
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/simulacro', simulacroRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/patients', patientsRoutes);

// =========================
// 404
// =========================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// =========================
// ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

module.exports = app;