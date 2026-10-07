import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using environment configuration
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const missingUriMsg = 'Database configuration error: MONGODB_URI is not defined in environment variables.';
    console.error(`[Database Error] ${missingUriMsg}`);
    throw new Error(missingUriMsg);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Connection failed: ${error.message}`);
    throw error;
  }
};

/**
 * Helper to inspect current database connection status
 * @returns {string} - 'connected' | 'connecting' | 'disconnected' | 'disconnecting'
 */
export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'disconnected';
};

/**
 * Gracefully close database connection
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed');
  }
};
