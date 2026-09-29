/**
 * @fileoverview Express Rate Limiter for CodePulse AI
 * Prevents API abuse and saves cost on Gemini calls by limiting execution requests.
 */

import rateLimit from 'express-rate-limit';

export const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many analysis requests from this IP. Please try again after a minute.'
  }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 API hits total per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Please slow down.'
  }
});
