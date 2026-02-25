const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const errorMiddleware = require('./middleware/errorMiddleware');

const simulacroRoutes = require('./routes/simulacro');
const doctorsRoutes = require('./routes/doctors');
const reportsRoutes = require('./routes/reports');
const patientsRoutes = require('./routes/patients');
const authRoutes = require('./routes/auth');

const app = express();

// =========================
// SECURITY MIDDLEWARES
// =========================
app.use(helmet());

// CORRECCIÓN: CORS flexible para desarrollo/producción
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // '*' solo en desarrollo
    credentials: process.env.FRONTEND_URL ? true : false // credentials no funciona con '*'
}));

// =========================
// BODY PARSERS
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// RATE LIMITING
// =========================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,   // NUEVO: headers estándar RateLimit-*
    legacyHeaders: false,     // NUEVO: desactiva X-RateLimit-* obsoletos
    message: {
        ok: false,
        error: "Demasiadas solicitudes, intenta en 15 minutos"
    }
});

// CORRECCIÓN: loginLimiter ANTES de montar las rutas de auth
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        error: "Demasiados intentos de login, intenta en 15 minutos"
    }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter); // Aplica solo a login

// =========================
// HEALTH CHECK
// =========================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "SaludPlus API",
        version: "1.0.0",
        timestamp: new Date().toISOString() // NUEVO: útil para debugging
    });
});

// =========================
// ROUTES
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/simulacro', simulacroRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/patients', patientsRoutes);

// =========================
// 404 HANDLER
// =========================
app.use((req, res) => {
    res.status(404).json({
        ok: false,           // CORRECCIÓN: usa 'ok' para consistencia con el resto del proyecto
        error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
});

// =========================
// GLOBAL ERROR HANDLER (siempre al final)
// =========================
app.use(errorMiddleware);

module.exports = app;