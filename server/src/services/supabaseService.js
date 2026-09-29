/**
 * @fileoverview Supabase Database Service for CodePulse AI
 * Handles all database operations: saving analyses, fetching history, 
 * managing user profiles.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = (process.env.SUPABASE_URL || '').trim();
const rawKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

const isPlaceholderSupabase = !rawUrl || rawUrl.includes('your-project') || !rawKey || rawKey.includes('your_service_role');

/** @type {import('@supabase/supabase-js').SupabaseClient|null} */
let supabase = null;

if (!isPlaceholderSupabase && rawUrl.startsWith('http')) {
  try {
    supabase = createClient(rawUrl, rawKey);
  } catch (err) {
    console.warn('[Supabase] Client initialization failed:', err.message);
  }
} else {
  console.log('[Supabase] No valid SUPABASE_URL configured. Database persistence disabled.');
}

/**
 * Saves a complete analysis record to the database
 * @param {string} userId - UUID of the authenticated user
 * @param {Object} analysisData - Complete analysis result
 * @returns {Promise<Object|null>} Saved analysis record or null on error
 */
export async function saveAnalysis(userId, analysisData) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        code_snippet: analysisData.code_snippet,
        language: analysisData.language,
        code_hash: analysisData.code_hash,
        health_score: analysisData.health_score,
        time_complexity: analysisData.time_complexity,
        space_complexity: analysisData.space_complexity,
        loop_depth: analysisData.loop_depth,
        optimized_code: analysisData.optimized_code,
        ai_review: analysisData.ai_review,
        execution_time_ms: analysisData.execution_time_ms,
        cache_hit: analysisData.cache_hit
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Save analysis error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Supabase] Save analysis exception:', err.message);
    return null;
  }
}

/**
 * Bulk inserts insights for a specific analysis
 * @param {string} analysisId - UUID of the parent analysis
 * @param {Array<Object>} insights - Array of insight objects
 * @returns {Promise<Array|null>} Saved insights or null on error
 */
export async function saveInsights(analysisId, insights) {
  if (!supabase || !insights || insights.length === 0) return [];

  try {
    const records = insights.map(insight => ({
      analysis_id: analysisId,
      type: insight.type || 'bug',
      severity: insight.severity || 'info',
      title: insight.title || 'Unknown issue',
      description: insight.description || '',
      line_number: insight.lineNumber || insight.line_number || null,
      suggestion: insight.suggestion || ''
    }));

    const { data, error } = await supabase
      .from('analysis_insights')
      .insert(records)
      .select();

    if (error) {
      console.error('[Supabase] Save insights error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Supabase] Save insights exception:', err.message);
    return null;
  }
}

/**
 * Fetches paginated analysis history for a user
 * @param {string} userId - UUID of the authenticated user
 * @param {number} [limit=20] - Number of results per page
 * @param {number} [offset=0] - Pagination offset
 * @returns {Promise<Object>} { data: Analysis[], total: number }
 */
export async function getHistory(userId, limit = 20, offset = 0) {
  if (!supabase) return { data: [], total: 0 };
  try {
    const { data, error, count } = await supabase
      .from('analyses')
      .select('*, analysis_insights(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Supabase] Get history error:', error.message);
      return { data: [], total: 0 };
    }

    return { data: data || [], total: count || 0 };
  } catch (err) {
    console.error('[Supabase] Get history exception:', err.message);
    return { data: [], total: 0 };
  }
}

/**
 * Fetches a single analysis by ID (with ownership check)
 * @param {string} analysisId - UUID of the analysis
 * @param {string} userId - UUID of the requesting user
 * @returns {Promise<Object|null>} Analysis record or null
 */
export async function getAnalysisById(analysisId, userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*, analysis_insights(*)')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Supabase] Get analysis error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Supabase] Get analysis exception:', err.message);
    return null;
  }
}

/**
 * Fetches user profile
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object|null>} Profile record or null
 */
export async function getUserProfile(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Supabase] Get profile error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Supabase] Get profile exception:', err.message);
    return null;
  }
}

/**
 * Deletes an analysis by ID (with ownership check)
 * @param {string} analysisId - UUID of the analysis to delete
 * @param {string} userId - UUID of the requesting user
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteAnalysis(analysisId, userId) {
  try {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Supabase] Delete analysis error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Delete analysis exception:', err.message);
    return false;
  }
}

export default supabase;
