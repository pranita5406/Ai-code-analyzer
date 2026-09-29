import React, { useEffect, useState } from 'react';
import './HealthScore.css';

export default function HealthScore({ score = null, isLoading = false }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (score === null || score === undefined) {
      setDisplayScore(0);
      return;
    }

    let start = 0;
    const targetScore = Math.min(100, Math.max(0, Number(score)));
    const duration = 600; // ms
    const increment = targetScore / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  if (isLoading) {
    return (
      <div className="health-score-card shimmer-bg">
        <div className="circle-placeholder"></div>
        <div className="text-placeholder"></div>
      </div>
    );
  }

  // Exact 270-degree Arc Path
  // Center: (75, 65), Radius: 48
  // Sweeps from bottom-left (34.3, 99) over top (75, 17) to bottom-right (115.7, 99)
  const pathD = "M 34.3 99 A 48 48 0 1 1 115.7 99";
  const pathLength = 237.4;

  const scoreVal = score !== null && score !== undefined ? displayScore : 0;
  const strokeDashoffset = pathLength - (scoreVal / 100) * pathLength;

  let scoreColor = 'var(--accent-red)';
  let scoreGlow = 'var(--accent-red-glow)';
  let scoreLabel = 'Critical';

  if (scoreVal >= 80) {
    scoreColor = 'var(--accent-green)';
    scoreGlow = 'var(--accent-green-glow)';
    scoreLabel = 'Excellent';
  } else if (scoreVal >= 60) {
    scoreColor = 'var(--accent-yellow)';
    scoreGlow = 'var(--accent-yellow-glow)';
    scoreLabel = 'Needs Work';
  }

  return (
    <div className="health-score-card animate-fade-in" style={{ '--glow-color': scoreGlow }}>
      <div className="gauge-container">
        <svg width="150" height="115" viewBox="0 0 150 115" className="gauge-svg">
          {/* Track Arc */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Active Color Arc */}
          <path
            d={pathD}
            fill="none"
            stroke={score === null ? 'var(--bg-tertiary)' : scoreColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease' }}
          />
        </svg>

        {/* Centered Score Inside Arc */}
        <div className="gauge-center-content">
          {score !== null ? (
            <>
              <span className="gauge-score font-mono" style={{ color: scoreColor }}>
                {displayScore}
              </span>
              <span className="gauge-max font-mono">/ 100</span>
            </>
          ) : (
            <span className="gauge-empty-dash font-mono">—</span>
          )}
        </div>
      </div>

      <div className="health-info">
        <h4 className="health-label">Health Score</h4>
        <span
          className="health-badge"
          style={{
            color: score !== null ? scoreColor : 'var(--text-secondary)',
            backgroundColor: score !== null ? scoreGlow : 'var(--bg-tertiary)'
          }}
        >
          {score !== null ? scoreLabel : 'Awaiting Analysis'}
        </span>
      </div>
    </div>
  );
}
