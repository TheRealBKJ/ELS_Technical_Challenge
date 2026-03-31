import React, { useState } from 'react';
import FundSelector from '../FundSelector/FundSelector';
import InvestmentForm from '../InvestmentForm/InvestmentForm';
import ResultsPanel from '../ResultsPanel/ResultsPanel';
import { calcExpectedReturn, calcFutureValue } from '../../capm';
import styles from './CalculatorPage.module.css';

export default function CalculatorPage() {
  const [selectedFund, setSelectedFund] = useState(null);
  const [amount, setAmount]             = useState(10000);
  const [years, setYears]               = useState(10);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);

  function handleCalculate() {
    if (!selectedFund || !amount || amount < 100) return;

    setLoading(true);

    // Simulate async API call delay (replace with real fetch when backend is ready)
    setTimeout(() => {
      const expectedReturn = calcExpectedReturn(selectedFund.beta);
      const futureValue    = calcFutureValue(amount, expectedReturn, years);

      setResult({
        fund:           selectedFund,
        principal:      amount,
        years,
        expectedReturn,
        futureValue,
        gain:           futureValue - amount,
      });

      setLoading(false);
    }, 600);
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          Mutual Fund <span className={styles.titleAccent}>Calculator</span>
        </h1>
        <p className={styles.subtitle}>
          Project your future returns
        </p>
      </div>

      <div className={styles.grid}>
        <FundSelector
          selectedFund={selectedFund}
          onSelect={setSelectedFund}
        />

        <InvestmentForm
          amount={amount}
          years={years}
          loading={loading}
          onAmountChange={setAmount}
          onYearsChange={setYears}
          onCalculate={handleCalculate}
          canCalculate={!!selectedFund && amount >= 100}
        />

        {result && (
          <ResultsPanel result={result} />
        )}
      </div>
    </div>
  );
}