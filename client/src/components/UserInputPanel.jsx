import React, { useState } from 'react';
import './UserInputPanel.css';

/**
 * UserInputPanel — User apna sample input de sakta hai
 * jo function ko argument ki tarah pass hoga.
 */
export default function UserInputPanel({ userInput, setUserInput, detectedFunction }) {
  const [showExamples, setShowExamples] = useState(false);

  const examples = [
    { label: 'Number Array', value: '[1, 2, 3, 4, 5, 2, 3]' },
    { label: 'String Array', value: '["apple", "banana", "apple", "cherry"]' },
    { label: 'Two Arrays', value: '[1, 2, 3], [3, 4, 5]' },
    { label: 'Single Number', value: '42' },
    { label: 'Nested Array', value: '[[1,2],[3,4],[1,2]]' },
  ];

  return (
    <div className="user-input-panel">
      <div className="uip-header">
        <div className="uip-title-group">
          <span className="uip-icon">▶</span>
          <span className="uip-title">Test Input</span>
          {detectedFunction && (
            <span className="uip-fn font-mono">{detectedFunction}( <em>aapka input</em> )</span>
          )}
        </div>
        <button
          className="uip-example-toggle"
          onClick={() => setShowExamples(v => !v)}
        >
          {showExamples ? '✕ Close' : '💡 Examples'}
        </button>
      </div>

      {showExamples && (
        <div className="uip-examples animate-fade-in">
          {examples.map(ex => (
            <button
              key={ex.label}
              className="uip-example-chip font-mono"
              onClick={() => { setUserInput(ex.value); setShowExamples(false); }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      <div className="uip-input-row">
        <input
          type="text"
          className="uip-input font-mono"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder='e.g.  [1, 2, 3, 4, 5]   ya   "hello world"   ya   42'
        />
      </div>
      <p className="uip-hint">
        💡 Yeh value function ko pehle argument ki tarah pass hogi. JSON format mein likhen.
      </p>
    </div>
  );
}
