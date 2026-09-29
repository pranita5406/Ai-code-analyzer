/**
 * @fileoverview History Controller for CodePulse AI
 * Handles retrieving past analysis logs and deleting them.
 */

import { getHistory, getAnalysisById, deleteAnalysis } from '../services/supabaseService.js';

/**
 * Gets paginated analysis history for the current authenticated user
 */
export async function getAnalysisHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized. User context missing.' });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const { data, total } = await getHistory(userId, limit, offset);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a single analysis detail by UUID for the current authenticated user
 */
export async function getAnalysisDetails(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    if (!id) {
      return res.status(400).json({ success: false, error: 'Analysis ID is required.' });
    }

    const data = await getAnalysisById(id, userId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Analysis not found or access denied.' });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes an analysis entry
 */
export async function removeAnalysis(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const success = await deleteAnalysis(id, userId);
    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to delete analysis or access denied.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
