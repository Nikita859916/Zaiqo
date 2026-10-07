import mongoose from 'mongoose';

/**
 * Redact sensitive credentials from MongoDB URIs and error strings
 * @param {string} msg
 * @returns {string}
 */
const redactCredentials = (msg) => {
  if (typeof msg !== 'string') return '';
  return msg
    .replace(/mongodb(\+srv)?:\/\/[^\s@]+@/gi, 'mongodb://[REDACTED]@')
    .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/key=[a-zA-Z0-9_-]+/gi, 'key=[REDACTED]');
};

/**
 * Connect to MongoDB instance using environment configuration
 * @param {object} customOptions - Optional Mongoose connection options override
 */
export const connectDB = async (customOptions = {}) => {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri || !rawUri.trim()) {
    const missingUriMsg = 'Database configuration error: MONGODB_URI is not defined in environment variables.';
    console.error(`[Database Error] ${missingUriMsg}`);
    throw new Error(missingUriMsg);
  }

  const uri = rawUri.trim();

  // Validate for unreplaced placeholder template strings
  if (uri.includes('<username>') || uri.includes('<password>')) {
    const placeholderMsg = 'Database configuration error: MONGODB_URI contains unreplaced placeholders (<username> or <password>). Replace them with actual MongoDB Atlas credentials.';
    console.error(`[Database Error] ${placeholderMsg}`);
    throw new Error(placeholderMsg);
  }

  // Validate supported URI scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    const schemeMsg = "Database configuration error: MONGODB_URI must begin with 'mongodb://' or 'mongodb+srv://'.";
    console.error(`[Database Error] ${schemeMsg}`);
    throw new Error(schemeMsg);
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 5000, // 5s timeout prevents hanging cloud container boot
    ...customOptions,
  };

  const attemptConnect = async () => {
    return await mongoose.connect(uri, connectionOptions);
  };

  try {
    let conn;
    try {
      conn = await attemptConnect();
    } catch (initialErr) {
      // If local DNS resolver fails with querySrv ECONNREFUSED on SRV lookup, attempt fallback to public DNS
      if (initialErr?.message?.includes('querySrv ECONNREFUSED')) {
        try {
          const dns = await import('dns');
          const setServers = dns.default?.setServers || dns.setServers;
          if (typeof setServers === 'function') {
            setServers(['8.8.8.8', '1.1.1.1']);
          }
          conn = await attemptConnect();
        } catch (retryErr) {
          throw retryErr;
        }
      } else {
        throw initialErr;
      }
    }

    const host = conn.connection.host || 'unknown-host';
    const dbName = conn.connection.name || 'default';
    console.log(`[Database] MongoDB connected successfully: host=${host}, db=${dbName}`);
    return conn;
  } catch (error) {
    const safeMessage = redactCredentials(error.message || 'Unknown connection error');
    console.error(`[Database] Connection failed: ${safeMessage}`);

    // Actionable diagnostic logs for cloud deployment & developer troubleshooting without secret leakage
    if (
      safeMessage.includes('whitelisted') ||
      safeMessage.includes('Could not connect to any servers in your MongoDB Atlas cluster') ||
      error.name === 'MongooseServerSelectionError'
    ) {
      console.error(
        '[Database Diagnostic] Atlas Network Access required: Your connecting IP address is not whitelisted in MongoDB Atlas.\n' +
        '  -> To allow Render or cloud deployments: In MongoDB Atlas Console -> Network Access -> Add IP Address -> Add "0.0.0.0/0" (Allow Access from Anywhere).\n' +
        '  -> To allow local development: Add your current public IP address or "0.0.0.0/0".'
      );
    } else if (safeMessage.includes('auth') || safeMessage.includes('Authentication failed')) {
      console.error(
        '[Database Diagnostic] Atlas Authentication failed: Verify username and password under Database Access in MongoDB Atlas. If your password contains special characters, ensure they are URL-encoded.'
      );
    }

    const safeError = new Error(safeMessage);
    safeError.name = error.name || 'Error';
    throw safeError;
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
