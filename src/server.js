require('dotenv').config();
const app = require('./app');
const connectPostgres = require('./config/postgres');
const connectMongo = require('./config/mongodb');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log(' Conectando a bases de datos...');

        await connectPostgres();
        console.log(' PostgreSQL conectado');

        await connectMongo();
        console.log(' MongoDB conectado');

        app.listen(PORT, () => {
            console.log('========================================');
            console.log('        SALUDPLUS - API Backend         ');
            console.log('========================================');
            console.log(` Servidor: http://localhost:${PORT}`);
            console.log(` Entorno:  ${process.env.NODE_ENV || 'development'}`);
            console.log('========================================');
        });

    } catch (error) {
        console.error(" Error iniciando el servidor:", error.message);
        process.exit(1);
    }
}

// Manejo de errores no capturados — NUEVO, muy importante en producción
process.on('unhandledRejection', (reason) => {
    console.error(' UnhandledRejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error(' UncaughtException:', error.message);
    process.exit(1);
});

startServer();