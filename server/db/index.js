import mongoose from 'mongoose';
import { logger } from '../services/logger.js';
import {
  DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
  DEFAULT_MAX_POOL_SIZE,
  DEFAULT_SOCKET_TIMEOUT_MS,
  DEFAULT_MIN_POOL_SIZE,
  IPV4
} from '../constants.js';

mongoose.set('strictQuery', true);

const connectionOptions = {
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || DEFAULT_SOCKET_TIMEOUT_MS,
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || DEFAULT_MAX_POOL_SIZE,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || DEFAULT_MIN_POOL_SIZE,
  family: IPV4,
};

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose.connection;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
    return;
  }
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');
};

mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected.'));

export default mongoose;