import React from 'react';
import './CodeMetrics.css';

export default function CodeMetrics({ metrics = null, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="metrics-grid">
        <div className="metric-mini-card shimmer-bg" style={{ height: '58px' }}></div>
        <div className="metric-mini-card shimmer-bg" style={{ height: '58px' }}></div>
        <div className="metric-mini-card shimmer-bg" style={{ height: '58px' }}></div>
        <div className="metric-mini-card shimmer-bg" style={{ height: '58px' }}></div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="metrics-grid animate-fade-in">
      <div className="metric-mini-card">
        <span className="metric-icon">🔄</span>
        <div className="metric-content">
          <span className="metric-mini-label">Loop Depth</span>
          <span className="metric-mini-value font-mono">{metrics.loopDepth ?? 0}</span>
        </div>
      </div>

      <div className="metric-mini-card">
        <span className="metric-icon">📝</span>
        <div className="metric-content">
          <span className="metric-mini-label">Lines of Code</span>
          <span className="metric-mini-value font-mono">{metrics.linesOfCode ?? 0}</span>
        </div>
      </div>

      <div className="metric-mini-card">
        <span className="metric-icon">🌐</span>
        <div className="metric-content">
          <span className="metric-mini-label">Language</span>
          <span className="metric-mini-value capitalize font-mono">{metrics.language ?? 'JS'}</span>
        </div>
      </div>

      <div className="metric-mini-card">
        <span className="metric-icon">⚠️</span>
        <div className="metric-content">
          <span className="metric-mini-label">Issues</span>
          <span className="metric-mini-value font-mono" style={{ color: metrics.issuesCount > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
            {metrics.issuesCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
