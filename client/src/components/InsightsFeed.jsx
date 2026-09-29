import React, { useState } from 'react';
import InsightCard from './InsightCard';
import './InsightsFeed.css';

export default function InsightsFeed({ insights = [], summary = null, isLoading = false }) {
  const [filter, setFilter] = useState('all');

  const filteredInsights = insights.filter(ins => {
    if (filter === 'all') return true;
    if (filter === 'critical') return ins.severity?.toLowerCase() === 'critical';
    if (filter === 'correctness') return ins.type?.toLowerCase() === 'correctness' || ins.type?.toLowerCase() === 'bug';
    if (filter === 'security') return ins.type?.toLowerCase() === 'security';
    if (filter === 'performance') return ins.type?.toLowerCase() === 'performance';
    return true;
  });

  const getCount = (type) => {
    if (type === 'all') return insights.length;
    if (type === 'critical') return insights.filter(ins => ins.severity?.toLowerCase() === 'critical').length;
    if (type === 'correctness') return insights.filter(ins => ins.type?.toLowerCase() === 'correctness' || ins.type?.toLowerCase() === 'bug').length;
    if (type === 'security') return insights.filter(ins => ins.type?.toLowerCase() === 'security').length;
    if (type === 'performance') return insights.filter(ins => ins.type?.toLowerCase() === 'performance').length;
    return 0;
  };

  if (isLoading) {
    return (
      <aside className="insights-feed-container">
        <div className="panel-header">
          <span className="panel-icon">🤖</span>
          <h3>AI Insights</h3>
        </div>
        <div className="feed-content">
          <div className="summary-card shimmer-bg" style={{ height: '80px', marginBottom: '16px' }}></div>
          <div className="shimmer-insight shimmer-bg"></div>
          <div className="shimmer-insight shimmer-bg"></div>
          <div className="shimmer-insight shimmer-bg"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="insights-feed-container">
      <div className="panel-header">
        <span className="panel-icon">🤖</span>
        <h3>AI Insights</h3>
        {insights.length > 0 && (
          <span className="count-badge font-mono">{insights.length}</span>
        )}
      </div>

      {insights.length > 0 && (
        <div className="filter-bar">
          <button
            onClick={() => setFilter('all')}
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          >
            All <span className="chip-count">{getCount('all')}</span>
          </button>
          <button
            onClick={() => setFilter('correctness')}
            className={`filter-chip ${filter === 'correctness' ? 'active' : ''}`}
          >
            Correctness <span className="chip-count">{getCount('correctness')}</span>
          </button>
          <button
            onClick={() => setFilter('security')}
            className={`filter-chip ${filter === 'security' ? 'active' : ''}`}
          >
            Security <span className="chip-count">{getCount('security')}</span>
          </button>
          <button
            onClick={() => setFilter('performance')}
            className={`filter-chip ${filter === 'performance' ? 'active' : ''}`}
          >
            Performance <span className="chip-count">{getCount('performance')}</span>
          </button>
        </div>
      )}

      <div className="feed-content">
        {summary && (
          <div className="summary-card animate-fade-in">
            <h4 className="summary-title">Summary Review</h4>
            <p className="summary-text">{summary}</p>
          </div>
        )}

        {filteredInsights.length > 0 ? (
          <div className="cards-stack">
            {filteredInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="empty-feed">
            <span className="empty-icon">✨</span>
            <p className="empty-title">Clean Slate</p>
            <p className="empty-desc">
              {insights.length > 0 
                ? 'No issues match the selected filter.'
                : 'Paste code and run analysis to scan for bugs, vulnerability patterns, and Big-O improvements.'
              }
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
