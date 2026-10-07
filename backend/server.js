import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`[Server Warning] Database could not be reached: ${error.message}`);
    console.warn('[Server Warning] Server will continue running. Ensure MONGODB_URI is configured in .env for database operations.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] Zaiqo Backend server running on port ${PORT}`);
    console.log(`[Server] Health Check endpoints: /health and /api/health`);
    console.log(`[Server] Auth endpoints: /api/auth`);
    console.log(`[Server] Preference endpoints: /api/preferences`);
    console.log(`[Server] Recipe endpoints: /api/recipes`);
  });

  return server;
};

// Handle process level exceptions
process.on('unhandledRejection', (err) => {
  console.error('[Process Error] Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err);
});

startServer();
