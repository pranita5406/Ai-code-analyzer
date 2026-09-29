import React, { useState } from 'react';
import { useAnalysis } from './context/AnalysisContext';
import { useAuth } from './context/AuthContext';
import MetricsPanel from './components/MetricsPanel';
import CodeEditor from './components/CodeEditor';
import InsightsFeed from './components/InsightsFeed';
import StatusBar from './components/StatusBar';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import './styles/global.css';
import './App.css';

export default function App() {
  const {
    code,
    setCode,
    language,
    setLanguage,
    userInput,
    setUserInput,
    isAnalyzing,
    results,
    error,
    analyze,
    viewMode,
    setViewMode
  } = useAnalysis();

  const { user, signOut } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const getStatus = () => {
    if (isAnalyzing) return 'loading';
    if (error) return 'error';
    if (results) return 'success';
    return 'idle';
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">⚡</span>
          <h2>CodePulse AI</h2>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <button onClick={() => setHistoryOpen(true)} className="nav-btn">
                🕒 History
              </button>
              <div className="user-profile">
                <span className="user-email font-mono">{user.email}</span>
                <button onClick={signOut} className="nav-btn logout">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="nav-btn login-btn">
              🔑 Sign In
            </button>
          )}
        </div>
      </nav>

      {/* 3-Column Workspace */}
      <div className="workspace-container">
        <MetricsPanel results={results} isLoading={isAnalyzing} />

        <CodeEditor
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={setLanguage}
          viewMode={viewMode}
          setViewMode={setViewMode}
          optimizedCode={results?.optimizedCode}
          executionResult={results?.executionResult}
          allInsights={results?.allInsights || []}
          isAnalyzing={isAnalyzing}
          hasError={!!error}
          error={error}
          userInput={userInput}
          setUserInput={setUserInput}
          onAnalyze={analyze}
        />

        <InsightsFeed
          insights={results?.allInsights}
          summary={results?.aiReview?.summary}
          isLoading={isAnalyzing}
        />
      </div>

      {/* Status Bar */}
      <StatusBar
        status={getStatus()}
        cacheHit={results?.cacheHit}
        executionTime={results?.executionTimeMs}
      />

      {/* Overlays */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
