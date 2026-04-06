import React, { useState } from 'react';
import { getAiPortfolioSuggestion } from '../../api/mutualFunds';
import styles from './AIFeature.module.css';

function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-US');
}

export default function AIFeature() {
  const [riskTolerance, setRiskTolerance] = useState('');
  const [amount, setAmount]               = useState('');
  const [years, setYears]                 = useState(10);
  const [goal, setGoal]                   = useState('');
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [notes, setNotes]                 = useState('');

  async function handleAnalyze() {
    if (!riskTolerance || !amount || !goal) {
      setError('Please fill in all fields before analyzing.');
      return;
    }
    if (isNaN(amount) || Number(amount) < 100) {
      setError('Please enter a valid investment amount (minimum $100).');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await getAiPortfolioSuggestion({
        risk_tolerance: riskTolerance,
        principal: Number(amount),
        years,
        goal,
        notes,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(`Something went wrong: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          AI Portfolio <span className={styles.accent}>Advisor</span>
        </h1>
        <p className={styles.subtitle}>
          Tell us your goals. We'll build your portfolio.
        </p>
      </div>

      <div className={styles.layout}>

        <div className={styles.card}>
          <div className="card-label">Your Profile</div>

          <div className={styles.field}>
            <label className={styles.label}>Risk Tolerance</label>
            <select
              className={styles.select}
              value={riskTolerance}
              onChange={e => setRiskTolerance(e.target.value)}
            >
              <option value="">Select risk tolerance</option>
              <option value="Low">Low — preserve capital, minimal volatility</option>
              <option value="Medium">Medium — balanced growth and safety</option>
              <option value="High">High — maximize returns, accept volatility</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Investment Goal</label>
            <select
              className={styles.select}
              value={goal}
              onChange={e => setGoal(e.target.value)}
            >
              <option value="">Select your goal</option>
              <option value="Growth">Growth — maximize long-term appreciation</option>
              <option value="Income">Income — generate regular returns</option>
              <option value="Balanced">Balanced — mix of growth and stability</option>
              <option value="Capital Preservation">Capital Preservation — protect what I have</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Initial Investment</label>
            <div className={styles.inputWrapper}>
              <span className={styles.prefix}>$</span>
              <input
                type="number"
                className={styles.input}
                placeholder="10000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Time Horizon — <span className={styles.accent}>{years} years</span>
            </label>
            <input
              type="range"
              className={styles.slider}
              min={1} max={40}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
            />
            <div className={styles.sliderTicks}>
              <span>1 yr</span>
              <span>10 yrs</span>
              <span>20 yrs</span>
              <span>40 yrs</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Additional Context (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. I may need early access to funds, I'm concerned about inflation, I already hold bonds elsewhere..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>                 

          {error && <p className={styles.error}>{error}</p>}


          <button
            className={styles.button}
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze My Portfolio'}
          </button>
        </div>

        <div className={styles.resultsPane}>

          {!result && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◈</div>
              <p>Fill in your profile and click<br />Analyze to see your recommendation.</p>
            </div>
          )}

          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p>AI is building your portfolio...</p>
            </div>
          )}

          {result && (
            <div className={styles.results}>

              <div className={styles.resultCard}>
                <div className="card-label">Projected Return</div>
                <div className={styles.bigNumber}>
                  {formatCurrency(result.totalFV)}
                </div>
                <div className={styles.subLine}>
                  Total gain:&nbsp;
                  <span className={styles.green}>
                    +{formatCurrency(result.totalGain)}
                  </span>
                  &nbsp;·&nbsp;{years} years
                </div>

                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(result.principal / result.totalFV) * 100}%` }}
                  />
                </div>
                <div className={styles.barLabels}>
                  <span>Initial: {formatCurrency(result.principal)}</span>
                  <span className={styles.green}>{formatCurrency(result.totalFV)}</span>
                </div>
              </div>

              <div className={styles.resultCard}>
                <div className="card-label">Allocation Breakdown</div>
                {result.allocations.map(fund => (
                  <div key={fund.ticker} className={styles.fundRow}>
                    <div className={styles.fundHeader}>
                      <span className={styles.fundName}>{fund.name}</span>
                      <span className={styles.fundPct}>{fund.percentage}%</span>
                    </div>
                    <div className={styles.allocTrack}>
                      <div
                        className={styles.allocBar}
                        style={{ width: `${fund.percentage}%` }}
                      />
                    </div>
                    <div className={styles.fundStats}>
                      <span>β {fund.beta.toFixed(2)}</span>
                      <span>E(r) {(fund.expected_return * 100).toFixed(2)}%</span>
                      <span className={styles.green}>
                        → {formatCurrency(fund.future_value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.resultCard}>
                <div className="card-label">AI Reasoning</div>
                <p className={styles.reasoning}>{result.reasoning}</p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
