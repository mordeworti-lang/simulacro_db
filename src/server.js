require('dotenv').config();
const app = require('./app');
const connectPostgres = require('./config/postgres');
const connectMongo = require('./config/mongodb');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Conectar bases de datos primero
        await connectPostgres();
        await connectMongo();

        app.listen(PORT, () => {
            console.log('========================================');
            console.log('        SALUDPLUS - API Backend');
            console.log('========================================');
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log('========================================');
        });

    } catch (error) {
        console.error("Error iniciando el servidor:", error);
        process.exit(1);
    }
}

startServer();