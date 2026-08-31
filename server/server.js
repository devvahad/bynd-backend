import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './db/index.js';
import router from './routes/index.js';
import { LogServices } from './services/index.js';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(compression());

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (IS_PRODUCTION && ALLOWED_ORIGINS.length === 0) {
  throw new Error(
    'ALLOWED_ORIGINS must be set in production. ' +
    'Refusing to start with an open CORS policy.'
  );
}

const ALLOW_NO_ORIGIN = process.env.ALLOW_NO_ORIGIN === 'true' || !IS_PRODUCTION;

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const isAllowed =
    (!origin && ALLOW_NO_ORIGIN) ||
    (!!origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)));

  callback(null, {
    origin: isAllowed,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'Accept',
    ],
    credentials: true,
    maxAge: 600,
  });
};
app.use(cors(corsOptionsDelegate));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use(LogServices.RequestInterceptor);

app.use(LogServices.ResponseInterceptor);

// if (process.env.NODE_ENV !== 'production') {
//   app.use(LogServices.ResponseInterceptor);
// }

app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev', {
  stream: { write: (msg) => LogServices.logger.info(msg.trim()) },
}));

app.use(
  express.static(path.resolve(__dirname, 'dist'), {
    maxAge: IS_PRODUCTION ? '1d' : 0,
    index: false,
  })
);

const initializeDatabase = async () => {
  try {
    await connectDB();
  } catch (error) {
    LogServices.logger.error('Database connection failed, exiting.', error);
    process.exit(1);
  }
};
await initializeDatabase();

app.get('/', (_req, res) => {
  res.send(`<h1>Backend running in ${NODE_ENV} environment</h1>`);
});

app.use('/api', apiLimiter, router);

app.use((_req, res) => res.status(404).json({ code: 404, message: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;

  LogServices.logger.error(err);

  res.status(status).json({
    code: status,
    message:
      IS_PRODUCTION && status === 500
        ? 'Internal server error.'
        : err.message,
  });
});

if (!IS_PRODUCTION && process.env.NGROK_AUTHTOKEN) {
  try {
    const { default: ngrok } = await import('@ngrok/ngrok');

    const tunnel = await ngrok.connect({
      authtoken: process.env.NGROK_AUTHTOKEN,
      addr: PORT,
    });

    LogServices.logger.info(`ngrok tunnel: ${tunnel.url()}`);
  } catch (error) {
    LogServices.logger.error(`ngrok error: ${error.message}`);
  }
}

export default app;
