import React, { useEffect } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import './HistoryPanel.css';

export default function HistoryPanel({ isOpen, onClose }) {
  const { history, historyLoading, loadHistory, loadAnalysisItem } = useAnalysis();

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    loadAnalysisItem(item);
    onClose();
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel animate-slide-left" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>🕒 Analysis History</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="panel-content">
          {historyLoading ? (
            <div className="history-shimmers">
              <div className="shimmer-item shimmer-bg"></div>
              <div className="shimmer-item shimmer-bg"></div>
              <div className="shimmer-item shimmer-bg"></div>
            </div>
          ) : history.length > 0 ? (
            <div className="history-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="history-item"
                >
                  <div className="item-header">
                    <span className="item-lang font-mono">{item.language}</span>
                    <span className="item-time">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <pre className="item-preview font-mono">
                    {item.code_snippet?.slice(0, 70)}...
                  </pre>
                  <div className="item-meta">
                    <span className="meta-badge score" style={{
                      color: item.health_score >= 80 ? 'var(--accent-green)' : item.health_score >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)',
                      backgroundColor: item.health_score >= 80 ? 'var(--accent-green-glow)' : item.health_score >= 60 ? 'var(--accent-yellow-glow)' : 'var(--accent-red-glow)'
                    }}>
                      Score: {item.health_score}
                    </span>
                    <span className="meta-badge complexity font-mono">
                      {item.time_complexity || 'O(1)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-history">
              <span>📭</span>
              <p>No History Found</p>
              <p className="subtitle">Sign in and run analyses to store and view your history logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
