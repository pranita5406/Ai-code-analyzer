import React from 'react';
import './InsightCard.css';

export default function InsightCard({ insight }) {
  const { type, severity, title, description, lineNumber, suggestion } = insight;

  const getSeverityClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'severity-critical';
      case 'warning': return 'severity-warning';
      default: return 'severity-info';
    }
  };

  const getTypeLabel = (t) => {
    switch (t?.toLowerCase()) {
      case 'security': return 'Security';
      case 'performance': return 'Performance';
      case 'bug': return 'Bug/Logic';
      default: return 'Best Practice';
    }
  };

  return (
    <div className={`insight-card animate-slide-right ${getSeverityClass(severity)}`}>
      <div className="card-header">
        <span className="severity-badge">
          <span className="dot"></span>
          {severity}
        </span>
        <span className="type-badge">{getTypeLabel(type)}</span>
      </div>
      
      <h4 className="insight-title">{title}</h4>
      
      <p className="insight-desc">{description}</p>
      
      {suggestion && (
        <div className="suggestion-box">
          <span className="suggestion-label">💡 Recommendation:</span>
          <pre className="suggestion-code font-mono">{suggestion}</pre>
        </div>
      )}

      {lineNumber !== undefined && lineNumber !== null && lineNumber > 0 && (
        <div className="card-footer">
          <span className="line-indicator font-mono">Line {lineNumber}</span>
        </div>
      )}
    </div>
  );
}
