import React, { useState } from 'react';
import './OutputConsole.css';

export default function OutputConsole({ executionResult = null, isLoading = false }) {
  const [activeTab, setActiveTab] = useState('stdout');

  if (isLoading) {
    return (
      <div className="output-console-container shimmer-bg">
        <div className="console-header">
          <span className="console-title">⚡ Executing & Analyzing...</span>
        </div>
      </div>
    );
  }

  if (!executionResult) {
    return (
      <div className="output-console-container empty">
        <div className="console-header">
          <div className="console-title-group">
            <span className="console-icon">🖥️</span>
            <span className="console-title">Execution Console</span>
          </div>
          <span className="console-status-badge idle">Idle — Run Analysis</span>
        </div>
        <div className="console-body empty-body font-mono">
          <span>Click "Analyze Code ▶" to execute, capture output, and verify correctness.</span>
        </div>
      </div>
    );
  }

  const {
    status = 'PASSED',
    stdout = [],
    returnValue = null,
    runtimeError = null,
    durationMs = 0,
    correctnessIssues = [],
    testCases = [],
    isSyntaxError = false,
    syntaxError = null
  } = executionResult;

  const isSuccess = status === 'PASSED' || status === 'PASSED_WITH_WARNINGS';
  const isSyntax  = status === 'SYNTAX_ERROR' || isSyntaxError;

  // ── If syntax error, show a dedicated full-width error panel ─────────────
  if (isSyntax && syntaxError) {
    return (
      <div className="output-console-container animate-fade-in syntax-error-mode">
        <div className="console-header">
          <div className="console-title-group">
            <span className="console-icon">🖥️</span>
            <span className="console-title">Execution Console</span>
            <span className="console-duration font-mono">{durationMs}ms</span>
          </div>
          <span className="console-status-badge" style={{
            color: 'var(--accent-red)',
            backgroundColor: 'var(--accent-red-glow)',
            borderColor: 'var(--accent-red)'
          }}>
            ✖ SYNTAX ERROR
          </span>
        </div>

        <div className="console-body font-mono">
          {/* Big syntax error card */}
          <div className="syntax-error-card">
            <div className="syntax-error-header">
              <span className="syntax-error-icon">🚨</span>
              <span className="syntax-error-title">Syntax Error Detected</span>
              {syntaxError.lineNumber && (
                <span className="syntax-line-badge font-mono">Line {syntaxError.lineNumber}</span>
              )}
            </div>

            {/* Exact error message */}
            <div className="syntax-error-msg font-mono">
              {syntaxError.message}
            </div>

            {/* Offending code line */}
            {syntaxError.offendingLine && (
              <div className="syntax-offending-line">
                <span className="offending-label">Problematic code:</span>
                <code className="offending-code font-mono">{syntaxError.offendingLine}</code>
              </div>
            )}

            {/* Fix suggestion */}
            <div className="syntax-suggestion">
              <span className="suggestion-icon">💡</span>
              <span>{syntaxError.suggestion}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal result ─────────────────────────────────────────────────────────
  return (
    <div className="output-console-container animate-fade-in">
      {/* Header */}
      <div className="console-header">
        <div className="console-title-group">
          <span className="console-icon">🖥️</span>
          <span className="console-title">Execution Console</span>
          <span className="console-duration font-mono">{durationMs}ms</span>
        </div>

        {/* Tabs */}
        <div className="console-tabs">
          <button
            onClick={() => setActiveTab('stdout')}
            className={`console-tab ${activeTab === 'stdout' ? 'active' : ''}`}
          >
            Output ({stdout.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`console-tab ${activeTab === 'tests' ? 'active' : ''}`}
          >
            Tests ({testCases.length})
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`console-tab ${activeTab === 'bugs' ? 'active' : ''}`}
          >
            Issues ({correctnessIssues.length})
          </button>
        </div>

        {/* Status badge */}
        <div className="console-status-group">
          <span
            className="console-status-badge"
            style={{
              color: isSuccess ? 'var(--accent-green)' : 'var(--accent-red)',
              backgroundColor: isSuccess ? 'var(--accent-green-glow)' : 'var(--accent-red-glow)',
              borderColor: isSuccess ? 'var(--accent-green)' : 'var(--accent-red)'
            }}
          >
            {isSuccess ? '✓ PASSED' : '✖ FAILED'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="console-body font-mono">

        {/* Tab 1: Output / stdout */}
        {activeTab === 'stdout' && (
          <div className="stdout-pane">
            {runtimeError && (
              <div className="runtime-error-box">
                <div className="runtime-error-header">
                  <span className="error-icon">❌ Runtime Error</span>
                </div>
                <span className="error-msg">{runtimeError}</span>
                <div className="runtime-suggestion">
                  💡 Check your logic — the function may have an unhandled case or undefined variable.
                </div>
              </div>
            )}

            {stdout.map((line, idx) => {
              const isInput  = line.startsWith('▶');
              const isOutput = line.startsWith('◀');
              const isWarn   = line.startsWith('[WARN]') || line.startsWith('⚠️');
              const isErr    = line.startsWith('[ERROR]');

              return (
                <div
                  key={idx}
                  className={`stdout-line ${isInput ? 'line-input' : ''} ${isOutput ? 'line-output' : ''} ${isWarn ? 'line-warn' : ''} ${isErr ? 'line-err' : ''}`}
                >
                  <span className="line-prefix">&gt;</span>
                  <span className="line-text">{line}</span>
                </div>
              );
            })}

            {returnValue && (
              <div className="return-value-line">
                <span className="return-label">Returned:</span>
                <span className="return-val">{returnValue}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Test Suite */}
        {activeTab === 'tests' && (
          <div className="tests-pane">
            {testCases.map((tc) => (
              <div key={tc.id} className="test-card">
                <div className="test-card-header">
                  <div className="test-title-group">
                    <span className="test-badge-status" data-status={tc.status}>
                      {tc.status}
                    </span>
                    <span className="test-name">{tc.name}</span>
                  </div>
                </div>
                <div className="test-card-details">
                  <div className="test-detail-row">
                    <span className="detail-key">Input:</span>
                    <span className="detail-val">{tc.input}</span>
                  </div>
                  <div className="test-detail-row">
                    <span className="detail-key">Expected:</span>
                    <span className="detail-val">{tc.expectedOutput}</span>
                  </div>
                  <div className="test-detail-row">
                    <span className="detail-key">Actual:</span>
                    <span className="detail-val text-green">{tc.actualOutput}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Issues */}
        {activeTab === 'bugs' && (
          <div className="bugs-pane">
            {correctnessIssues.length > 0 ? (
              correctnessIssues.map((issue, idx) => (
                <div key={idx} className="correctness-issue-card">
                  <div className="issue-header">
                    <span className="issue-severity" data-severity={issue.severity}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="issue-title">{issue.title}</span>
                    {issue.lineNumber && (
                      <span className="issue-line">Line {issue.lineNumber}</span>
                    )}
                  </div>
                  <p className="issue-desc">{issue.description}</p>
                  {issue.suggestion && (
                    <div className="issue-fix font-mono">
                      💡 Fix: {issue.suggestion}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-bugs-box">
                <span>✨ No structural logic errors detected!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
