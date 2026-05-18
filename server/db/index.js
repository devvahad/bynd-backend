import mongoose from 'mongoose';
import { logger } from '../services/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected.'));

export default mongoose;