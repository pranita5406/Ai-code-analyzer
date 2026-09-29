import React from 'react';
import './AnalyzeButton.css';

export default function AnalyzeButton({ onClick, isLoading = false, hasError = false, error }) {
  let buttonText = 'Analyze Code ▶';
  let buttonClass = 'analyze-button';

  if (isLoading) {
    buttonText = 'Analyzing Snippet...';
    buttonClass += ' loading shimmer-bg';
  } else if (hasError) {
    buttonText = 'Analysis Failed ❌';
    buttonClass += ' error shake-it';
  }

  return (
    <div className="button-container">
      <button
        onClick={onClick}
        disabled={isLoading}
        className={buttonClass}
      >
        <span className="btn-text">{buttonText}</span>
      </button>
      <div className="shortcut-tip font-mono">Press Ctrl + Enter</div>
      {hasError && error && (
        <div className="error-message font-mono" style={{ color: '#ff7b72', marginTop: '8px', fontSize: '13px', textAlign: 'center' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}
