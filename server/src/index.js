/**
 * @fileoverview Main Express Entrypoint for CodePulse AI
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet()); // Basic security headers
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' })); // Limit request payload size

// Global API rate limiting
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Route '${req.originalUrl}' not found.`);
  error.statusCode = 404;
  next(error);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Global unhandled error catchers to prevent process crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
});

// Listen
const server = app.listen(PORT, () => {
  console.log(`[Server] CodePulse AI server running on port ${PORT}`);
});

// Graceful Shutdown
function handleShutdown() {
  console.log('[Server] Closing active connections and stopping server...');
  server.close(() => {
    console.log('[Server] Server shut down gracefully.');
    process.exit(0);
  });
}

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
