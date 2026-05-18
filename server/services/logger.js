import { createLogger, format, transports } from 'winston';
import fs from 'fs';

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });

const { combine, timestamp, json, colorize, simple } = format;

const fileTransports = [
  new transports.File({ filename: './logs/error.log', level: 'error' }),
  new transports.File({ filename: './logs/combined.log' }),
];

const consoleTransport = new transports.Console({
  format: combine(colorize(), simple()),
});

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  format: combine(timestamp(), json()),
  transports: [
    ...(process.env.NODE_ENV !== 'test' ? [consoleTransport] : []),
    ...fileTransports,
  ],
});

export const RequestInterceptor = (req, _res, next) => {
  logger.info({ format: 'request', path: req.path, method: req.method, timestamp: new Date() });
  next();
};

export const ResponseInterceptor = (req, res, next) => {
  const { send } = res;
  res.send = function (body) {
    logger.info({ format: 'response', path: req.path, status: res.statusCode, timestamp: new Date() });
    return send.call(this, body);
  };
  next();
};

export const ActivateExceptionLogs = () => {
  process.on('uncaughtException', (err) => {
    logger.error({ message: 'Uncaught Exception', stack: err.stack });
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ message: 'Unhandled Rejection', reason });
  });
};

const LogServices = {
  logger,
  RequestInterceptor,
  ResponseInterceptor,
  ActivateExceptionLogs,
};

export default LogServices;