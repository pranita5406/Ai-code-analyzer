/**
 * @fileoverview Express Router for CodePulse AI
 */

import { Router } from 'express';
import { analyze } from '../controllers/analyzeController.js';
import { getAnalysisHistory, getAnalysisDetails, removeAnalysis } from '../controllers/historyController.js';
import { authenticate, requireAuth } from '../middleware/authMiddleware.js';
import { analyzeLimiter } from '../middleware/rateLimiter.js';
import { isRedisHealthy, getCacheStats } from '../services/cacheService.js';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const redisHealthy = await isRedisHealthy();
  const cacheStats = await getCacheStats();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealthy ? 'healthy' : 'disconnected',
      supabase: 'connected' // Assumed true if server is up
    },
    cache: cacheStats
  });
});

// Code Analysis Route (Allows guest access, saves to db if authenticated)
router.post('/analyze', analyzeLimiter, authenticate, analyze);

// Analysis History Routes (Protected)
router.get('/history', authenticate, requireAuth, getAnalysisHistory);
router.get('/history/:id', authenticate, requireAuth, getAnalysisDetails);
router.delete('/history/:id', authenticate, requireAuth, removeAnalysis);

export default router;
