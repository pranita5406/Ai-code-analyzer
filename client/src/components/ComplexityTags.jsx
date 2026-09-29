import React from 'react';
import './ComplexityTags.css';

export default function ComplexityTags({ time = null, space = null, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="complexity-tags-container">
        <div className="complexity-tag-card shimmer-bg" style={{ height: '72px' }}></div>
        <div className="complexity-tag-card shimmer-bg" style={{ height: '72px' }}></div>
      </div>
    );
  }

  if (time === null && space === null) {
    return (
      <div className="complexity-tags-container empty">
        <p className="empty-text">No complexity analysis</p>
      </div>
    );
  }

  const getComplexityClass = (complexity) => {
    if (!complexity) return 'unknown';
    const clean = complexity.toUpperCase();
    if (clean.includes('O(1)') || clean.includes('O(LOG N)')) return 'complexity-low';
    if (clean.includes('O(N LOG N)') || clean.includes('O(N)')) return 'complexity-medium';
    if (clean.includes('O(N²)') || clean.includes('O(N^2)')) return 'complexity-high';
    return 'complexity-severe'; // O(2^N), O(N³), etc.
  };

  const getExplanation = (type, complexity) => {
    if (!complexity) return 'No evaluation';
    const clean = complexity.toUpperCase();
    if (type === 'time') {
      if (clean.includes('O(1)')) return 'Execution time is constant and independent of data size.';
      if (clean.includes('O(LOG N)')) return 'Logarithmic time. Excellent scale for search trees.';
      if (clean.includes('O(N)')) return 'Linear time. Scales proportionally to input elements.';
      if (clean.includes('O(N LOG N)')) return 'Log-linear. Standard for efficient sorting algorithms.';
      if (clean.includes('O(N²)')) return 'Quadratic time. Inefficient loops nested inside loops.';
      if (clean.includes('O(2^N)')) return 'Exponential time. Highly risky recursive structures.';
      return 'Complex nesting patterns. High potential for performance bottlenecks.';
    } else {
      if (clean.includes('O(1)')) return 'Fixed memory consumption, independent of collection size.';
      if (clean.includes('O(N)')) return 'Linear memory. Scales based on local structures or call stack.';
      return 'Variable memory allocation patterns.';
    }
  };

  return (
    <div className="complexity-tags-container">
      {/* Time Complexity Card */}
      <div className={`complexity-tag-card animate-slide-left ${getComplexityClass(time)}`}>
        <div className="tag-header">
          <span className="tag-icon">⏱️</span>
          <span className="tag-label">Time Complexity</span>
        </div>
        <div className="tag-value font-mono">{time || 'O(1)'}</div>
        <div className="tag-tooltip">{getExplanation('time', time)}</div>
      </div>

      {/* Space Complexity Card */}
      <div className={`complexity-tag-card animate-slide-left ${getComplexityClass(space)}`} style={{ animationDelay: '100ms' }}>
        <div className="tag-header">
          <span className="tag-icon">💾</span>
          <span className="tag-label">Space Complexity</span>
        </div>
        <div className="tag-value font-mono">{space || 'O(1)'}</div>
        <div className="tag-tooltip">{getExplanation('space', space)}</div>
      </div>
    </div>
  );
}
