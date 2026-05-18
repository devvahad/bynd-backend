import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './db/index.js';
import router from './routes/index.js';
import { LogServices } from './services/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: { write: (msg) => LogServices.logger.info(msg.trim()) },
}));

connectDB();

app.use('/api', router);

app.use((_req, res) => res.status(404).json({ code: 404, message: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  LogServices.logger.error(err);
  res.status(500).json({ code: 500, message: err.message || 'Internal server error.' });
});

export default app;