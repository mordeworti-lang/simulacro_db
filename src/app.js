const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const errorMiddleware = require('./middleware/errorMiddleware');

const simulacroRoutes = require('./routes/simulacro');
const doctorsRoutes = require('./routes/doctors');
const reportsRoutes = require('./routes/reports');
const patientsRoutes = require('./routes/patients');
const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');

const app = express();

// =========================
// SECURITY MIDDLEWARES
// =========================
// Relajar helmet para permitir cargar fuentes de Google desde el frontend
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: '*', credentials: false }));

// =========================
// BODY PARSERS
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// RATE LIMITING
// =========================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiadas solicitudes, intenta en 15 minutos" }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiados intentos de login, intenta en 15 minutos" }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// =========================
// HEALTH CHECK
// =========================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "SaludPlus API",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// =========================
// API ROUTES
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/simulacro', simulacroRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/admin', adminRoutes);

// =========================
// FRONTEND ESTÁTICO
// Sirve index.html en la raíz → http://localhost:3000
// =========================
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Cualquier ruta que no sea /api → devuelve el frontend
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use(errorMiddleware);

module.exports = app;
