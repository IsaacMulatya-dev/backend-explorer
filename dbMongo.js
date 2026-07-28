const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/backend_explorer';

const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(' Successfully connected to local MongoDB!');
  } catch (err) {
    console.error(' Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectMongo;