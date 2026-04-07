import React, { useState } from 'react';
import styles from './InvestmentForm.module.css';

export default function InvestmentForm({
  amount,
  years,
  loading,
  onAmountChange,
  onYearsChange,
  onCalculate,
  canCalculate,
}) {
  const [amountError, setAmountError] = useState('');

  function handleAmountChange(e) {
    const rawValue = e.target.value;

    if (rawValue === '') {
      onAmountChange('');
      setAmountError('Minimum investment is $100');
      return;
    }

    const val = parseFloat(rawValue);
    onAmountChange(Number.isNaN(val) ? '' : val);

    if (Number.isNaN(val) || val < 100) {
      setAmountError('Minimum investment is $100');
    } else {
      setAmountError('');
    }
  }

  function handleYearsChange(e) {
    onYearsChange(parseInt(e.target.value));
  }

  // Dynamic range track fill
  const pct = ((years - 1) / (40 - 1)) * 100;

  return (
    <div className={styles.card}>
      <div className="card-label">Parameters</div>

      {/* Amount input */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="amountInput">
          Initial Investment Amount
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.inputPrefix}>$</span>
          <input
            id="amountInput"
            type="number"
            className={`${styles.input} ${amountError ? styles.inputError : ''}`}
            min="100"
            max="10000000"
            step="100"
            value={amount === '' ? '' : amount}
            onChange={handleAmountChange}
          />
        </div>
        {amountError && (
          <p className={styles.errorMsg}>{amountError}</p>
        )}
      </div>

      {/* Years slider */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="horizonSlider">
          Time Horizon
        </label>
        <div className={styles.rangeValue}>
          {years}
          <span className={styles.rangeUnit}>
            {years === 1 ? 'year' : 'years'}
          </span>
        </div>
        <div className={styles.rangeWrapper}>
          <input
            id="horizonSlider"
            type="range"
            className={styles.range}
            min="1"
            max="40"
            step="1"
            value={years}
            style={{ '--pct': `${pct}%` }}
            onChange={handleYearsChange}
          />
        </div>
        <div className={styles.rangeLabels}>
          <span>1 yr</span>
          <span>10 yrs</span>
          <span>20 yrs</span>
          <span>40 yrs</span>
        </div>
      </div>

      {/* Submit */}
      <button
        className={styles.calcButton}
        onClick={onCalculate}
        disabled={!canCalculate || loading}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Calculating…
          </>
        ) : (
          'Calculate Future Value'
        )}
      </button>
    </div>
  );
}
