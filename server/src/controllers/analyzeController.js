/**
 * @fileoverview Analysis Controller for CodePulse AI
 * Orchestrates the full analysis flow:
 * 1. Validate inputs
 * 2. Hash code snippet
 * 3. Check Redis cache (Cache HIT -> return)
 * 4. Run AST static analysis (Cache MISS)
 * 5. Call Gemini AI review service
 * 6. Combine results, save to database if authenticated, cache in Redis, and return
 */

import { generateHash, getCachedResult, setCachedResult } from '../services/cacheService.js';
import { analyzeCode } from '../services/astParser.js';
import { reviewCode } from '../services/geminiService.js';
import { saveAnalysis, saveInsights } from '../services/supabaseService.js';
import { executeAndVerifyCode } from '../services/executionService.js';

/**
 * Analyzes code using AST, Code Execution & Gemini AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function analyze(req, res, next) {
  const startTime = Date.now();
  try {
    const { code, language = 'javascript', userInput = '' } = req.body;

    // 1. Validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Code snippet is required and must be a non-empty string.'
      });
    }

    if (code.length > 20000) {
      return res.status(400).json({
        success: false,
        error: 'Code snippet exceeds the maximum allowed size of 20,000 characters.'
      });
    }

    const supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Language '${language}' is not supported. Supported languages: ${supportedLanguages.join(', ')}`
      });
    }

    // 2. Generate Hash
    const hash = generateHash(code, language);

    // 3. Check Cache
    const cachedData = await getCachedResult(hash);
    if (cachedData) {
      const executionTimeMs = Date.now() - startTime;

      if (req.user?.id) {
        const dbRecord = {
          code_snippet: code,
          language,
          code_hash: hash,
          health_score: cachedData.healthScore,
          time_complexity: cachedData.timeComplexity,
          space_complexity: cachedData.spaceComplexity,
          loop_depth: cachedData.loopDepth,
          optimized_code: cachedData.optimizedCode,
          ai_review: cachedData.aiReview,
          execution_time_ms: executionTimeMs,
          cache_hit: true
        };
        const saved = await saveAnalysis(req.user.id, dbRecord);
        if (saved && cachedData.allInsights) {
          await saveInsights(saved.id, cachedData.allInsights);
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          ...cachedData,
          cacheHit: true,
          executionTimeMs
        }
      });
    }

    // 4. Run AST Static Analysis
    const astResult = analyzeCode(code, language);

    // 5. Code Execution & Correctness Verification (pass userInput)
    const executionResult = executeAndVerifyCode(code, language, astResult, userInput);

    // 6. Call Gemini AI review service
    const aiResult = await reviewCode(code, language, astResult);

    // 7. Combine Results
    const combinedInsights = [
      ...astResult.issues,
      ...executionResult.correctnessIssues,
      ...aiResult.bugs,
      ...aiResult.securityIssues,
      ...aiResult.performanceTips
    ];

    const executionTimeMs = Date.now() - startTime;

    const analysisResult = {
      language,
      linesOfCode: astResult.linesOfCode,
      healthScore: astResult.healthScore,
      timeComplexity: astResult.timeComplexity,
      spaceComplexity: astResult.spaceComplexity,
      loopDepth: astResult.loopDepth,
      loops: astResult.loops,
      issues: astResult.issues,
      executionResult,
      optimizedCode: aiResult.optimizedCode,
      aiReview: {
        summary: aiResult.summary,
        bugs: aiResult.bugs,
        securityIssues: aiResult.securityIssues,
        performanceTips: aiResult.performanceTips,
        overallAssessment: aiResult.overallAssessment
      },
      allInsights: combinedInsights,
      cacheHit: false,
      executionTimeMs,
      codeHash: hash
    };

    // Cache the result in Redis
    await setCachedResult(hash, analysisResult);

    // Save to database if user is authenticated
    if (req.user?.id) {
      const dbRecord = {
        code_snippet: code,
        language,
        code_hash: hash,
        health_score: analysisResult.healthScore,
        time_complexity: analysisResult.timeComplexity,
        space_complexity: analysisResult.spaceComplexity,
        loop_depth: analysisResult.loopDepth,
        optimized_code: analysisResult.optimizedCode,
        ai_review: analysisResult.aiReview,
        execution_time_ms: executionTimeMs,
        cache_hit: false
      };
      
      const saved = await saveAnalysis(req.user.id, dbRecord);
      if (saved) {
        await saveInsights(saved.id, combinedInsights);
        analysisResult.id = saved.id;
      }
    }

    return res.status(200).json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    next(error);
  }
}
