/**
 * @fileoverview Auth Middleware for CodePulse AI
 * Verifies Supabase authentication JWT token in Authorization header.
 * Allows requests to proceed without authentication if the endpoint doesn't strictly require it (like /analyze).
 */

import supabase from '../services/supabaseService.js';

/**
 * Extracts and verifies JWT authorization header
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!supabase || !authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided or Supabase unconfigured — request continues as unauthenticated guest
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token using Supabase client
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalids or expired token
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication session.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    req.user = null;
    next();
  }
}

/**
 * Requires authentication for protected endpoints
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to perform this action.'
    });
  }
  next();
}
