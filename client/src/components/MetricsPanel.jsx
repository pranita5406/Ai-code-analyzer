import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import HealthScore from './HealthScore';
import ComplexityTags from './ComplexityTags';
import CodeMetrics from './CodeMetrics';
import './MetricsPanel.css';

export default function MetricsPanel({ results = null, isLoading = false }) {
  const { language: selectedLanguage, code } = useAnalysis();

  const fallbackLoc = code ? code.split('\n').filter(l => l.trim().length > 0).length : 0;

  const metrics = {
    loopDepth: results?.loopDepth ?? 0,
    linesOfCode: results?.linesOfCode ?? fallbackLoc,
    language: results?.language || selectedLanguage || 'javascript',
    issuesCount: results?.allInsights?.length || results?.issues?.length || 0
  };

  return (
    <aside className="metrics-panel-container">
      <div className="panel-header">
        <span className="panel-icon">📊</span>
        <h3>Analysis Metrics</h3>
      </div>
      <div className="panel-content">
        <HealthScore score={results?.healthScore} isLoading={isLoading} />
        <ComplexityTags time={results?.timeComplexity} space={results?.spaceComplexity} isLoading={isLoading} />
        <CodeMetrics metrics={metrics} isLoading={isLoading} />
      </div>
    </aside>
  );
}
