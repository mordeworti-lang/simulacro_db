'use strict';

const { MongoClient } = require('mongodb');
const { MONGODB_URI, MONGODB_DB } = require('./env');

let db = null;

async function connectMongo() {
    const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5 segundos para conectar
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 }); // ping para verificar

    db = client.db(MONGODB_DB);

    // Evento para detectar desconexiones
    client.on('close', () => {
        console.warn(' MongoDB desconectado');
    });
}

// Esta función la usan los repositories para hacer queries
function getDb() {
    if (!db) {
        throw new Error('MongoDB no está conectado. Llama connectMongo() primero.');
    }
    return db;
}

module.exports = connectMongo;
module.exports.getDb = getDb;