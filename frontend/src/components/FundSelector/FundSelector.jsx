import React from 'react';
import { FUNDS, RISK_FREE_RATE, MARKET_RETURN } from '../../funds';
import { calcExpectedReturn, formatPercent } from '../../capm';
import styles from './FundSelector.module.css';

export default function FundSelector({ selectedFund, onSelect }) {
  function handleChange(e) {
    const ticker = e.target.value;
    const fund   = FUNDS.find(f => f.ticker === ticker) || null;
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
          >
            <option value="">— Choose a fund —</option>
            {FUNDS.map(fund => (
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
                β {selectedFund.beta.toFixed(2)}
                &nbsp;·&nbsp;
                E(r) {formatPercent(calcExpectedReturn(selectedFund.beta))}
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
          <span className={styles.rateKey}>Risk-Free Rate (Rf)</span>
          <span className={styles.rateVal}>{formatPercent(RISK_FREE_RATE)}</span>
        </div>
        <div className={styles.rateRow}>
          <span className={styles.rateKey}>Market Return (Rm)</span>
          <span className={styles.rateVal}>{formatPercent(MARKET_RETURN)}</span>
        </div>
        <div className={styles.rateRow}>
          <span className={styles.rateKey}>Model</span>
          <span className={styles.rateFormula}>E(r) = Rf + β(Rm − Rf)</span>
        </div>
      </div>
    </div>
  );
}