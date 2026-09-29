import React from 'react';
import './StatusBar.css';

export default function StatusBar({ status, cacheHit = false, executionTime = null }) {
  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'var(--accent-yellow)';
      case 'error': return 'var(--accent-red)';
      case 'success': return 'var(--accent-green)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading': return 'Analyzing...';
      case 'error': return 'Error';
      case 'success': return 'Ready';
      default: return 'Idle';
    }
  };

  return (
    <footer className="status-bar font-mono">
      <div className="status-item">
        <span className="status-dot" style={{ backgroundColor: getStatusColor() }}></span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {executionTime !== null && (
        <div className="status-item">
          <span className="status-label">Time:</span>
          <span>{executionTime}ms</span>
        </div>
      )}

      {status === 'success' && (
        <div className="status-item">
          <span className="status-label">Cache:</span>
          <span style={{ color: cacheHit ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
            {cacheHit ? 'HIT ⚡' : 'MISS'}
          </span>
        </div>
      )}

      <div className="status-item footer-logo">
        <span>STEP Portfolio v1.0.0</span>
      </div>
    </footer>
  );
}
