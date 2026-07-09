import 'dotenv/config';
import app from './server.js';
import { LogServices } from './services/index.js';
import {
  DEFAULT_PORT,
  SHUTDOWN_TIMEOUT_MS,
} from './constants.js';

const parsePort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port >= 0 && port <= 65_535 ? port : DEFAULT_PORT;
};

const PORT = parsePort(process.env.PORT);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const log = (message) => {
  LogServices.logger.info(message);
};

const logError = (message, error) => {
  LogServices.logger.error(message, error);
};

let isShuttingDown = false;

const server = app.listen(PORT, () => {
  log(`Server running on port ${PORT} (${NODE_ENV})`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logError(`Port ${PORT} is already in use`, error);
  } else {
    logError('Server failed to start', error);
  }
  process.exit(1);
});

const shutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log(`${signal} received — shutting down gracefully.`);

  const forceExitTimer = setTimeout(() => {
    logError('Graceful shutdown timed out, forcing exit.', new Error('SHUTDOWN_TIMEOUT'));
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  server.close((error) => {
    clearTimeout(forceExitTimer);
    if (error) {
      logError('Error while closing HTTP server', error);
      process.exit(1);
      return;
    }
    log('HTTP server closed.');
    process.exit(exitCode);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logError('Unhandled promise rejection', reason);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
  shutdown('uncaughtException', 1);
});