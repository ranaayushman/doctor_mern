require('dotenv').config();
const { connectDB, disconnectDB } = require('./src/config/database');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Backend listening on ${PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal} - shutting down`);
      try {
        await disconnectDB();
      } finally {
        server.close(() => process.exit(0));
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
