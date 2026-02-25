const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

let db;

const connectMongo = async () => {
    try {
        await client.connect();
        db = client.db(process.env.MONGODB_DB);
        console.log("MongoDB conectado");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
        throw error;
    }
};

module.exports = connectMongo;
module.exports.client = client;
module.exports.getDb = () => db;