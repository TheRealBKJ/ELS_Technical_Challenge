import React, { useEffect, useState } from 'react';
import FundSelector from '../FundSelector/FundSelector';
import InvestmentForm from '../InvestmentForm/InvestmentForm';
import ResultsPanel from '../ResultsPanel/ResultsPanel';
import { calculateFutureValue, fetchMutualFunds } from '../../api/mutualFunds';
import styles from './CalculatorPage.module.css';

export default function CalculatorPage() {
  const [funds, setFunds]                 = useState([]);
  const [fundsLoading, setFundsLoading]   = useState(true);
  const [selectedFund, setSelectedFund] = useState(null);
  const [amount, setAmount]             = useState(10000);
  const [years, setYears]               = useState(10);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    let active = true;

    async function loadFunds() {
      setFundsLoading(true);
      setError('');

      try {
        const data = await fetchMutualFunds();
        if (!active) return;

        setFunds(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load mutual funds.');
      } finally {
        if (active) {
          setFundsLoading(false);
        }
      }
    }

    loadFunds();

    return () => {
      active = false;
    };
  }, []);

  async function handleCalculate() {
    if (!selectedFund || !amount || amount < 100) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await calculateFutureValue({
        ticker: selectedFund.ticker,
        principal: Number(amount),
        years,
      });

      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate future value.');
    } finally {
      setLoading(false);
    }
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
          funds={funds}
          loading={fundsLoading}
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

        {error && (
          <div className={styles.errorBanner}>
            {error}
          </div>
        )}

        {result && (
          <ResultsPanel
            result={result}
            funds={funds}
          />
        )}
      </div>
    </div>
  );
}
