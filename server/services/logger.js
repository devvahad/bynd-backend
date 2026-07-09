import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MAX_LOG_SIZE_BYTES, MAX_LOG_FILES } from '../constants.js';

const LOG_DIR = process.env.LOG_DIR || './logs';

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, json, colorize, simple, errors } = format;

const fileTransports = [
  new transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    maxsize: MAX_LOG_SIZE_BYTES,
    maxFiles: MAX_LOG_FILES,
    tailable: true,
  }),
  new transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    maxsize: MAX_LOG_SIZE_BYTES,
    maxFiles: MAX_LOG_FILES,
    tailable: true,
  }),
];

const consoleTransport = new transports.Console({
  format: combine(timestamp(), colorize(), simple()),
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    ...(process.env.NODE_ENV !== 'test' ? [consoleTransport] : []),
    ...fileTransports,
  ],
  exitOnError: false,
});

export const RequestInterceptor = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  req.startTime = process.hrtime.bigint();
  res.setHeader('x-request-id', req.id);

  logger.info({
    format: 'request',
    requestId: req.id,
    path: req.path,
    method: req.method,
  });

  next();
};

export const ResponseInterceptor = (req, res, next) => {
  const { send } = res;
  res.send = function (body) {
    const durationMs = req.startTime
      ? Number(process.hrtime.bigint() - req.startTime) / 1e6
      : undefined;

    logger.info({
      format: 'response',
      requestId: req.id,
      path: req.path,
      status: res.statusCode,
      durationMs,
    });

    return send.call(this, body);
  };
  next();
};

export const ActivateExceptionLogs = () => {
  process.on('uncaughtException', (err) => {
    logger.error({ message: 'Uncaught Exception', stack: err.stack });
    setTimeout(() => process.exit(1), 250);
  });

  process.on('unhandledRejection', (reason) => {
    const isError = reason instanceof Error;
    logger.error({
      message: 'Unhandled Rejection',
      reason: isError ? reason.message : reason,
      stack: isError ? reason.stack : undefined,
    });
  });
};

const LogServices = {
  logger,
  RequestInterceptor,
  ResponseInterceptor,
  ActivateExceptionLogs,
};

export default LogServices;