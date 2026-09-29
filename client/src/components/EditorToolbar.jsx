import React from 'react';
import './EditorToolbar.css';

export default function EditorToolbar({
  language,
  setLanguage,
  viewMode = 'editor',
  setViewMode,
  hasResults = false,
  onClear,
  onCopy
}) {
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' }
  ];

  return (
    <div className="editor-toolbar">
      <div className="toolbar-left">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="lang-select"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {hasResults && (
        <div className="toolbar-center">
          <div className="tab-group">
            <button
              onClick={() => setViewMode('editor')}
              className={`tab-btn ${viewMode === 'editor' ? 'active' : ''}`}
            >
              Write Code
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`tab-btn ${viewMode === 'diff' ? 'active' : ''}`}
            >
              Diff Review
            </button>
          </div>
        </div>
      )}

      <div className="toolbar-right">
        {hasResults && viewMode === 'diff' && (
          <button onClick={onCopy} className="action-btn copy-btn">
            Copy Optimized
          </button>
        )}
        <button onClick={onClear} className="action-btn clear-btn">
          Clear
        </button>
      </div>
    </div>
  );
}
