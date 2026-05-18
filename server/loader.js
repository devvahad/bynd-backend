import 'dotenv/config';
import app from './server.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully.`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));