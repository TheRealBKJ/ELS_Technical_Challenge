import React, { useEffect, useRef } from 'react';
import { formatCurrency, formatPercent } from '../../capm';
import { RISK_FREE_RATE } from '../../funds';
import styles from './ResultsPanel.module.css';

export default function ResultsPanel({ result }) {
  const { fund, principal, years, expectedReturn, futureValue, gain } = result;
  const fillRef = useRef(null);
  const panelRef = useRef(null);

  // Animate progress bar and scroll into view on mount
  useEffect(() => {
    const gainPct = Math.min(((futureValue - principal) / futureValue) * 100, 88);
    setTimeout(() => {
      if (fillRef.current) {
        fillRef.current.style.width = `${gainPct}%`;
      }
    }, 100);

    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [result]);

  const gainPositive = gain >= 0;

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className="card-label">Projected Return</div>

      <div className={styles.topRow}>
        <div>
          <p className={styles.resultLabel}>Future Portfolio Value</p>
          <p className={`${styles.resultAmount} ${gainPositive ? styles.positive : styles.negative}`}>
            {formatCurrency(futureValue)}
          </p>
          <p className={styles.fundName}>{fund.name} · {years} yr{years !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Beta (β)</span>
          <span className={styles.metaValue}>{fund.beta.toFixed(2)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Risk-Free Rate</span>
          <span className={styles.metaValue}>{formatPercent(RISK_FREE_RATE)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Expected Return</span>
          <span className={`${styles.metaValue} ${styles.positive}`}>
            {formatPercent(expectedReturn)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total Gain</span>
          <span className={`${styles.metaValue} ${gainPositive ? styles.positive : styles.negative}`}>
            {formatCurrency(gain)}
          </span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabels}>
          <span>Initial Investment</span>
          <span>Projected Growth</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            ref={fillRef}
            style={{ width: '0%' }}
          />
        </div>
        <div className={styles.progressAmounts}>
          <span>{formatCurrency(principal)}</span>
          <span className={styles.positive}>{formatCurrency(futureValue)}</span>
        </div>
      </div>
    </div>
  );
}