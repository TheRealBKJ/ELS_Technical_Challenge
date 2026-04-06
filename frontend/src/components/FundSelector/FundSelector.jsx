import React from 'react';
import styles from './FundSelector.module.css';

export default function FundSelector({ funds, loading, selectedFund, onSelect }) {
  function handleChange(e) {
    const ticker = e.target.value;
    const fund   = funds.find(f => f.ticker === ticker) || null;
    onSelect(fund);
  }

  return (
    <div className={styles.card}>
      <div className="card-label">Select Fund</div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="fundSelect">
          Mutual Fund
        </label>

        <div className={styles.selectWrapper}>
          <select
            id="fundSelect"
            className={styles.select}
            value={selectedFund?.ticker || ''}
            onChange={handleChange}
            disabled={loading || funds.length === 0}
          >
            <option value="">
              {loading ? 'Loading funds...' : '— Choose a fund —'}
            </option>
            {funds.map(fund => (
              <option key={fund.ticker} value={fund.ticker}>
                {fund.name} ({fund.ticker})
              </option>
            ))}
          </select>
          <span className={styles.selectArrow}>▾</span>
        </div>

        <div className={`${styles.badge} ${selectedFund ? styles.badgeActive : ''}`}>
          <span className={styles.badgeDot} />
          {selectedFund ? (
            <>
              <span className={styles.badgeName}>{selectedFund.name}</span>
              <span className={styles.badgeMeta}>
                {selectedFund.ticker}
              </span>
            </>
          ) : (
            <span className={styles.badgePlaceholder}>
              Select a fund to view details
            </span>
          )}
        </div>
      </div>

      <div className={styles.rateInfo}>
        <div className={styles.rateRow}>
          <span className={styles.rateKey}>Fund Source</span>
          <span className={styles.rateVal}>FastAPI backend</span>
        </div>
        <div className={styles.rateRow}>
          <span className={styles.rateKey}>Funds Available</span>
          <span className={styles.rateVal}>{funds.length}</span>
        </div>
        <div className={styles.rateRow}>
          <span className={styles.rateKey}>Calculation Source</span>
          <span className={styles.rateFormula}>Beta + return rate come from backend APIs</span>
        </div>
      </div>
    </div>
  );
}
