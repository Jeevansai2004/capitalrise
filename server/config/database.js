const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'capital_rise';

let client;
let db;

async function connectToDatabase() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

module.exports = {
  connectToDatabase,
  getClient: () => client,
}; 