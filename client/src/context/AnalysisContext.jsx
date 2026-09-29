import React, { createContext, useReducer, useContext } from 'react';
import * as api from '../services/api';

const AnalysisContext = createContext();

const initialState = {
  code: '',
  language: 'javascript',
  userInput: '',         // sample input user provides
  isAnalyzing: false,
  results: null,
  error: null,
  viewMode: 'editor',   // 'editor' | 'diff'
  history: [],
  historyLoading: false,
};

function analysisReducer(state, action) {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_USER_INPUT':
      return { ...state, userInput: action.payload };
    case 'START_ANALYSIS':
      return { ...state, isAnalyzing: true, error: null, results: null };
    case 'ANALYSIS_SUCCESS':
      return {
        ...state,
        isAnalyzing: false,
        results: action.payload,
        error: null,
        viewMode: action.payload?.hasErrors ? 'editor' : 'diff'
      };
    case 'ANALYSIS_ERROR':
      return { ...state, isAnalyzing: false, error: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'CLEAR_RESULTS':
      return { ...state, results: null, error: null, viewMode: 'editor' };
    case 'LOAD_HISTORY_START':
      return { ...state, historyLoading: true };
    case 'LOAD_HISTORY_SUCCESS':
      return { ...state, historyLoading: false, history: action.payload };
    case 'LOAD_HISTORY_ERROR':
      return { ...state, historyLoading: false };
    default:
      return state;
  }
}

export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  const analyze = async () => {
    if (!state.code || state.code.trim().length === 0) return;

    dispatch({ type: 'START_ANALYSIS' });
    try {
      const response = await api.analyzeCode(state.code, state.language, state.userInput);
      if (response.success && response.data) {
        const data = response.data;

        // Mark if there are critical issues (so we stay in editor view for highlighting)
        const hasCriticalErrors = (data.allInsights || []).some(
          i => i.severity === 'critical'
        );
        dispatch({
          type: 'ANALYSIS_SUCCESS',
          payload: { ...data, hasErrors: hasCriticalErrors }
        });
      } else {
        dispatch({ type: 'ANALYSIS_ERROR', payload: 'Failed to retrieve analysis payload.' });
      }
    } catch (err) {
      dispatch({ type: 'ANALYSIS_ERROR', payload: err.message });
    }
  };

  const loadHistory = async () => {
    dispatch({ type: 'LOAD_HISTORY_START' });
    try {
      const response = await api.getHistory();
      if (response.success) {
        dispatch({ type: 'LOAD_HISTORY_SUCCESS', payload: response.data });
      }
    } catch {
      dispatch({ type: 'LOAD_HISTORY_ERROR' });
    }
  };

  const loadAnalysisItem = (item) => {
    dispatch({
      type: 'ANALYSIS_SUCCESS',
      payload: {
        healthScore: item.health_score,
        timeComplexity: item.time_complexity,
        spaceComplexity: item.space_complexity,
        loopDepth: item.loop_depth,
        optimizedCode: item.optimized_code,
        aiReview: item.ai_review,
        allInsights: item.analysis_insights || [],
        cacheHit: item.cache_hit,
        executionTimeMs: item.execution_time_ms,
        codeHash: item.code_hash,
        hasErrors: false
      }
    });
    dispatch({ type: 'SET_CODE', payload: item.code_snippet });
    dispatch({ type: 'SET_LANGUAGE', payload: item.language });
  };

  return (
    <AnalysisContext.Provider value={{
      ...state,
      setCode: (code) => dispatch({ type: 'SET_CODE', payload: code }),
      setLanguage: (lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang }),
      setUserInput: (input) => dispatch({ type: 'SET_USER_INPUT', payload: input }),
      setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
      clearResults: () => dispatch({ type: 'CLEAR_RESULTS' }),
      analyze,
      loadHistory,
      loadAnalysisItem
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
