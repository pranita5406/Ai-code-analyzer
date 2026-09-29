/**
 * @fileoverview Redis Caching Service for CodePulse AI
 * Uses Upstash Redis (TLS) to cache analysis results by code hash.
 * Falls back gracefully if Redis is unavailable.
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_TTL = 86400; // 24 hours in seconds

/** @type {Redis|null} */
let redis = null;
let isConnected = false;

// Initialize Redis connection (Upstash uses TLS)
try {
  const isPlaceholderRedis = !process.env.REDIS_URL || 
    process.env.REDIS_URL.includes('your-instance.upstash.io') || 
    process.env.REDIS_URL.includes('your_token');

  if (process.env.REDIS_URL && !isPlaceholderRedis) {
    redis = new Redis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err) => {
      isConnected = false;
      console.warn('[Redis] Connection error:', err.message);
    });

    redis.on('close', () => {
      isConnected = false;
    });

    // Connect explicitly
    redis.connect().catch(err => {
      console.warn('[Redis] Initial connection failed:', err.message);
    });
  } else {
    console.log('[Redis] No valid REDIS_URL configured. In-memory/bypass mode active.');
  }
} catch (err) {
  console.warn('[Redis] Failed to initialize:', err.message);
}

/**
 * Generates a SHA-256 hash of the code + language combination
 * Used as the cache key for deduplication
 * @param {string} code - Source code string
 * @param {string} language - Programming language
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function generateHash(code, language) {
  const content = `${language}:${code.trim()}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Retrieves cached analysis result by hash
 * @param {string} hash - SHA-256 hash key
 * @returns {Promise<Object|null>} Parsed result or null if not found/error
 */
export async function getCachedResult(hash) {
  if (!redis || !isConnected) return null;

  try {
    const data = await redis.get(`codepulse:${hash}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.warn('[Redis] Get error:', err.message);
    return null;
  }
}

/**
 * Stores analysis result in cache with TTL
 * @param {string} hash - SHA-256 hash key
 * @param {Object} result - Analysis result to cache
 * @returns {Promise<boolean>} True if stored successfully
 */
export async function setCachedResult(hash, result) {
  if (!redis || !isConnected) return false;

  try {
    await redis.setex(`codepulse:${hash}`, CACHE_TTL, JSON.stringify(result));
    return true;
  } catch (err) {
    console.warn('[Redis] Set error:', err.message);
    return false;
  }
}

/**
 * Invalidates (deletes) a specific cache entry
 * @param {string} hash - SHA-256 hash key to invalidate
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function invalidateCache(hash) {
  if (!redis || !isConnected) return false;

  try {
    await redis.del(`codepulse:${hash}`);
    return true;
  } catch (err) {
    console.warn('[Redis] Delete error:', err.message);
    return false;
  }
}

/**
 * Returns cache statistics
 * @returns {Promise<Object>} Cache stats { totalKeys, memoryUsage, connected }
 */
export async function getCacheStats() {
  if (!redis || !isConnected) {
    return { totalKeys: 0, memoryUsage: 'N/A', connected: false };
  }

  try {
    const keys = await redis.keys('codepulse:*');
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(\S+)/);

    return {
      totalKeys: keys.length,
      memoryUsage: memoryMatch ? memoryMatch[1] : 'N/A',
      connected: true
    };
  } catch (err) {
    return { totalKeys: 0, memoryUsage: 'N/A', connected: false };
  }
}

/**
 * Health check for Redis connection
 * @returns {Promise<boolean>} True if Redis is responding
 */
export async function isRedisHealthy() {
  if (!redis || !isConnected) return false;

  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
