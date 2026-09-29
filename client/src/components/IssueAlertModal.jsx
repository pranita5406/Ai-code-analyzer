import React, { useState } from 'react';
import './IssueAlertModal.css';

/**
 * IssueAlertModal — Pops up when critical issues are found in the code.
 * Shows each issue clearly and asks the user what they want to do.
 */
export default function IssueAlertModal({ issues = [], onProceed, onFix, isOpen }) {
  const [userNote, setUserNote] = useState('');

  if (!isOpen) return null;

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues  = issues.filter(i => i.severity === 'warning');
  const infoIssues     = issues.filter(i => i.severity === 'info');

  const severityIcon = (sev) => {
    if (sev === 'critical') return '🔴';
    if (sev === 'warning')  return '🟡';
    return '🔵';
  };

  return (
    <div className="issue-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="issue-modal-card">

        {/* Header */}
        <div className="issue-modal-header">
          <span className="issue-modal-icon">⚠️</span>
          <div>
            <h2 className="issue-modal-title">Issues Detected in Your Code</h2>
            <p className="issue-modal-subtitle font-mono">
              {criticalIssues.length} critical &nbsp;·&nbsp; {warningIssues.length} warnings &nbsp;·&nbsp; {infoIssues.length} info
            </p>
          </div>
        </div>

        {/* Issue List */}
        <div className="issue-modal-list">
          {issues.map((issue, idx) => (
            <div key={idx} className={`issue-modal-item severity-${issue.severity}`}>
              <div className="issue-modal-item-header">
                <span className="issue-sev-icon">{severityIcon(issue.severity)}</span>
                <span className="issue-item-title">{issue.title}</span>
                {issue.lineNumber && (
                  <span className="issue-line-badge font-mono">Line {issue.lineNumber}</span>
                )}
              </div>
              <p className="issue-item-desc">{issue.description}</p>
              {issue.suggestion && (
                <div className="issue-item-suggestion font-mono">
                  💡 Fix: {issue.suggestion}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Input Section */}
        <div className="issue-modal-input-section">
          <label className="issue-modal-label">
            📝 Aap kya chahte hain? (Optional note ya question):
          </label>
          <textarea
            className="issue-modal-textarea font-mono"
            placeholder="e.g. 'Main yeh issue samajhna chahta hoon...' ya 'Fix karo aur analysis dikhao'"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="issue-modal-actions">
          <button
            className="issue-modal-btn btn-fix"
            onClick={() => onFix(userNote)}
          >
            🔧 Fix Karo &amp; Re-analyze
          </button>
          <button
            className="issue-modal-btn btn-proceed"
            onClick={() => onProceed(userNote)}
          >
            📊 Proceed — Full Analysis Dikhao
          </button>
        </div>

      </div>
    </div>
  );
}
