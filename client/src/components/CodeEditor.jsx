import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import EditorToolbar from './EditorToolbar';
import AnalyzeButton from './AnalyzeButton';
import OutputConsole from './OutputConsole';
import UserInputPanel from './UserInputPanel';
import './CodeEditor.css';

const DEFAULT_CODE_SAMPLES = {
  javascript: `// Paste your code here or check this sample performance issue:
function findDuplicates(arr) {
  var duplicates = [];
  for (var i = 0; i < arr.length; i++) {
    for (var j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}`,
  typescript: `// TypeScript sample with potential issues
function processItems(items: string[]): string[] {
  let results: string[] = [];
  items.forEach(item => {
    if (results.indexOf(item) === -1) {
      results.push(item);
    }
  });
  return results;
}`,
  python: `# Python loop performance issue
def find_pairs(numbers):
    pairs = []
    for i in range(len(numbers)):
        for j in range(len(numbers)):
            if numbers[i] + numbers[j] == 10:
                pairs.append((numbers[i], numbers[j]))
    return pairs`,
  java: `// Java sample nested iteration
public class Helper {
    public boolean hasCommonElement(int[] a, int[] b) {
        for (int i = 0; i < a.length; i++) {
            for (int j = 0; j < b.length; j++) {
                if (a[i] == b[j]) {
                    return true;
                }
            }
        }
        return false;
    }
}`,
  cpp: `// C++ nested iteration sample
#include <vector>
bool hasCommon(std::vector<int> a, std::vector<int> b) {
    for(int i=0; i<a.size(); ++i) {
        for(int j=0; j<b.size(); ++j) {
            if(a[i] == b[j]) return true;
        }
    }
    return false;
}`,
  go: `// Go sample snippet
package main
func hasCommon(a []int, b []int) bool {
    for _, valA := range a {
        for _, valB := range b {
            if valA == valB {
                return true;
            }
        }
    }
    return false;
}`
};

/** Detect the first function name defined in the code */
function detectFunctionName(code) {
  const jsMatch = code.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
  if (jsMatch) return jsMatch[1];
  const arrowMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/);
  if (arrowMatch) return arrowMatch[1];
  const pyMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  if (pyMatch) return pyMatch[1];
  return null;
}

export default function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  viewMode = 'editor',
  setViewMode,
  optimizedCode = null,
  executionResult = null,
  allInsights = [],
  isAnalyzing = false,
  hasError = false,
  error = null,
  userInput,
  setUserInput,
  onAnalyze
}) {
  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);

  // Detect function name for UserInputPanel label
  const detectedFunction = detectFunctionName(code);

  // ─── Set Monaco error markers whenever insights/errors change ───────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel ? editor.getModel() : null;
    if (!model) return;

    const markers = [];

    // From analysis insights (issues with line numbers)
    allInsights.forEach(issue => {
      if (!issue.lineNumber) return;
      markers.push({
        startLineNumber: issue.lineNumber,
        endLineNumber: issue.lineNumber,
        startColumn: 1,
        endColumn: model.getLineMaxColumn(issue.lineNumber),
        message: `[${issue.severity?.toUpperCase() || 'INFO'}] ${issue.title}: ${issue.description}${issue.suggestion ? '\n💡 Fix: ' + issue.suggestion : ''}`,
        severity:
          issue.severity === 'critical' ? monaco.MarkerSeverity.Error
          : issue.severity === 'warning' ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
        source: 'CodePulse AI'
      });
    });

    monaco.editor.setModelMarkers(model, 'codepulse', markers);

    // Scroll to first error line
    if (markers.length > 0) {
      editor.revealLineInCenter(markers[0].startLineNumber);
    }

    // Cleanup on unmount / code change
    return () => {
      if (editor.getModel && editor.getModel()) {
        monaco.editor.setModelMarkers(editor.getModel(), 'codepulse', []);
      }
    };
  }, [allInsights]);

  // ─── Clear markers when code changes ────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel ? editor.getModel() : null;
    if (model) {
      monaco.editor.setModelMarkers(model, 'codepulse', []);
    }
  }, [code]);

  // ─── Default sample code when language changes ───────────────────────────────
  useEffect(() => {
    const isAnyDefault = Object.values(DEFAULT_CODE_SAMPLES).some(
      val => val.trim() === code.trim()
    );
    if (!code || isAnyDefault) {
      setCode(DEFAULT_CODE_SAMPLES[language] || DEFAULT_CODE_SAMPLES.javascript);
    }
  }, [language]);

  // ─── Monaco mount handler ────────────────────────────────────────────────────
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current  = editor;
    monacoRef.current  = monaco;

    if (editor.getOriginalEditor) {
      editor.getOriginalEditor().onDidChangeModelContent(() => {
        setCode(editor.getOriginalEditor().getValue());
      });
    }

    monaco.editor.defineTheme('codepulse-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF7B72' },
        { token: 'string', foreground: 'A5D6FF' },
        { token: 'number', foreground: '79C0FF' }
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#E6EDF3',
        'editorLineNumber.foreground': '#484F58',
        'editorLineNumber.activeForeground': '#8B949E',
        'editor.lineHighlightBackground': '#161B22',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#264F7833',
        'editorError.foreground':   '#FF7B72',
        'editorWarning.foreground': '#E3B341',
        'editorInfo.foreground':    '#79C0FF',
        'editorGutter.background':  '#0D1117'
      }
    });

    monaco.editor.setTheme('codepulse-dark');
  };

  const handleClear = () => {
    setCode('');
    setViewMode('editor');
  };

  const handleCopy = () => {
    if (optimizedCode) {
      navigator.clipboard.writeText(optimizedCode);
      alert('Optimized code copied to clipboard!');
    }
  };

  return (
    <main className="code-editor-panel-container">
      <EditorToolbar
        language={language}
        setLanguage={setLanguage}
        viewMode={viewMode}
        setViewMode={setViewMode}
        hasResults={!!optimizedCode}
        onClear={handleClear}
        onCopy={handleCopy}
      />

      <div className="editor-workspace">
        {viewMode === 'diff' && optimizedCode ? (
          <DiffEditor
            original={code}
            modified={optimizedCode}
            language={language}
            onMount={handleEditorDidMount}
            options={{
              readOnly: true,
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderSideBySide: true,
              originalEditable: true
            }}
          />
        ) : (
          <MonacoEditor
            value={code}
            onChange={(val) => setCode(val ?? '')}
            language={language}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              glyphMargin: true,   // gutter icons for errors
              folding: true
            }}
          />
        )}

        {isAnalyzing && (
          <div className="analysis-overlay">
            <div className="overlay-content">
              <div className="spinner-placeholder animate-pulse"></div>
              <span>Executing code sandbox & analyzing logic correctness...</span>
            </div>
          </div>
        )}
      </div>

      {/* User Input Panel — visible only in editor mode */}
      {viewMode === 'editor' && (
        <UserInputPanel
          userInput={userInput}
          setUserInput={setUserInput}
          detectedFunction={detectedFunction}
        />
      )}

      {/* Output Console */}
      <OutputConsole executionResult={executionResult} isLoading={isAnalyzing} />

      {viewMode === 'editor' && (
        <AnalyzeButton
          onClick={onAnalyze}
          isLoading={isAnalyzing}
          hasError={hasError}
          error={error}
        />
      )}
    </main>
  );
}
