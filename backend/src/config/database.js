/**
 * Database Connection Configuration
 * Handles MongoDB connection setup
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor_appointment';

    const connection = await mongoose.connect(uri, {
      // Automatically create indexes defined in schemas
      autoIndex: true,
    });

    console.log(`✅ MongoDB Connected Successfully`);
    console.log(`Host: ${connection.connection.host}`);
    console.log(`Database: ${connection.connection.name}`);

    return connection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed:`);
    console.error(`Error: ${error.message}`);

    // Exit process with failure code
    process.exit(1);
  }
};

// Handle disconnection
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = { connectDB, disconnectDB };
