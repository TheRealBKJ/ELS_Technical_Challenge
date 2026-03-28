import React, { useState } from 'react';
import styles from './AIFeature.module.css';

// The funds the app already knows about - AI will pick from these
const AVAILABLE_FUNDS = [
  { name: 'Fidelity 500 Index Fund', ticker: 'FXAIX', beta: 1.01, expectedReturn: 10.56 },
  { name: 'Vanguard Total Stock Market', ticker: 'VTSAX', beta: 1.00, expectedReturn: 10.20 },
  { name: 'Vanguard Growth Index Fund', ticker: 'VIGAX', beta: 1.12, expectedReturn: 11.80 },
  { name: 'Vanguard Bond Index Fund', ticker: 'VBTLX', beta: 0.10, expectedReturn: 4.80 },
  { name: 'Fidelity Contrafund', ticker: 'FCNTX', beta: 1.05, expectedReturn: 11.20 },
  { name: 'Vanguard Balanced Index', ticker: 'VBIAX', beta: 0.60, expectedReturn: 7.50 },
];

const RISK_FREE_RATE = 4.50;
const MARKET_RETURN = 10.50;

// CAPM formula: E(r) = Rf + Beta * (Rm - Rf)
// Future Value formula: FV = P * e^(r*t)  [continuous compounding]
function calculateFutureValue(principal, expectedReturn, years) {
  const r = expectedReturn / 100;
  return principal * Math.exp(r * years);
}

export default function AIFeature() {

  const [riskTolerance, setRiskTolerance] = useState('');
  const [amount, setAmount] = useState('');
  const [years, setYears] = useState(10);
  const [goal, setGoal] = useState('');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!riskTolerance || !amount || !goal) {
      setError('Please fill in all fields before analyzing.');
      return;
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid investment amount.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const prompt = `
You are a professional portfolio analyst at Goldman Sachs.

A client has the following profile:
- Risk Tolerance: ${riskTolerance}
- Initial Investment: $${amount}
- Time Horizon: ${years} years
- Investment Goal: ${goal}

Available mutual funds to choose from:
${AVAILABLE_FUNDS.map(f => `- ${f.name} (${f.ticker}): Beta ${f.beta}, Expected Return ${f.expectedReturn}%`).join('\n')}

Based on this profile, recommend a portfolio allocation using 2-4 of these funds.

Respond ONLY with a valid JSON object in exactly this format, no other text:
{
  "allocations": [
    { "ticker": "FXAIX", "percentage": 60 },
    { "ticker": "VBTLX", "percentage": 40 }
  ],
  "reasoning": "A short 2-3 sentence explanation of why this portfolio suits the client."
}

Make sure percentages add up to exactly 100.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            }),
        });

      if (!response.ok) {
       throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates[0].content.parts[0].text;
      const text = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);

      const enriched = parsed.allocations.map(alloc => {
        const fund = AVAILABLE_FUNDS.find(f => f.ticker === alloc.ticker);
        const investedAmount = (Number(amount) * alloc.percentage) / 100;
        const futureValue = calculateFutureValue(investedAmount, fund.expectedReturn, years);
        return {
          ...alloc,
          ...fund,
          investedAmount,
          futureValue,
        };
      });

      const totalFutureValue = enriched.reduce((sum, f) => sum + f.futureValue, 0);
      const totalGain = totalFutureValue - Number(amount);

      setResult({
        allocations: enriched,
        reasoning: parsed.reasoning,
        totalFutureValue,
        totalGain,
        principal: Number(amount),
      });

    } catch (err) {
      console.error(err);
      setError('Something went wrong. Check your API key in the .env file and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          AI Portfolio <span className={styles.gold}>Advisor</span>
        </h1>
        <p className={styles.subtitle}>Tell us your goals. We'll build your portfolio.</p>
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
              Time Horizon — <span className={styles.gold}>{years} years</span>
            </label>
            <input
              type="range"
              className={styles.slider}
              min={1}
              max={40}
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

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.button}
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.loadingDot}>Analyzing<span>...</span></span>
            ) : (
              'Analyze My Portfolio'
            )}
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
              {/* Total future value */}
              <div className={styles.resultCard}>
                <div className="card-label">Projected Return</div>
                <div className={styles.bigNumber}>
                  ${Math.round(result.totalFutureValue).toLocaleString()}
                </div>
                <div className={styles.subLine}>
                  Total gain: <span className={styles.green}>+${Math.round(result.totalGain).toLocaleString()}</span>
                  &nbsp;·&nbsp;{years} years
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barInitial} style={{ width: `${(result.principal / result.totalFutureValue) * 100}%` }} />
                </div>
                <div className={styles.barLabels}>
                  <span>Initial: ${Number(result.principal).toLocaleString()}</span>
                  <span className={styles.green}>${Math.round(result.totalFutureValue).toLocaleString()}</span>
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
                      <span>β {fund.beta}</span>
                      <span>E(r) {fund.expectedReturn}%</span>
                      <span className={styles.green}>
                        → ${Math.round(fund.futureValue).toLocaleString()}
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