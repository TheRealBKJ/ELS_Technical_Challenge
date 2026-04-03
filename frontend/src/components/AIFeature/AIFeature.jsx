import React, { useState } from 'react';
import { FUNDS, RISK_FREE_RATE, MARKET_RETURN } from '../../funds';
import styles from './AIFeature.module.css';

// ─── Math helpers (same as capm.js) ──────────────────────────────────────────
// CAPM: E(r) = Rf + β × (Rm − Rf)
function calcExpectedReturn(beta) {
  return RISK_FREE_RATE + beta * (MARKET_RETURN - RISK_FREE_RATE);
}

// FV = P × (1 + r)^t
function calcFutureValue(principal, rate, years) {
  return principal * Math.pow(1 + rate, years);
}

function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-US');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AIFeature() {
  const [riskTolerance, setRiskTolerance] = useState('');
  const [amount, setAmount]               = useState('');
  const [years, setYears]                 = useState(10);
  const [goal, setGoal]                   = useState('');
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  async function handleAnalyze() {
    // Validate inputs
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

    // ── Build the prompt ──────────────────────────────────────────────────────
    // We give Gemini the full fund list with their beta values so it can make
    // an informed recommendation. We tell it to respond ONLY in JSON so we can
    // parse it reliably without any extra text.
    //
    // TODO: When backend is connected, replace FUNDS below with funds fetched
    // from GET /api/mutual-funds so beta values are real and up to date.
    // Example:
    //   const res = await fetch('http://localhost:8000/api/mutual-funds');
    //   const liveFunds = await res.json();
    // Then use liveFunds instead of FUNDS in the prompt below.

    const fundList = FUNDS.map(
      f => `- ${f.name} (${f.ticker}): Beta ${f.beta}, Expected Return ${(calcExpectedReturn(f.beta) * 100).toFixed(2)}%`
    ).join('\n');

    const prompt = `
You are a professional portfolio analyst at Goldman Sachs.

A client has the following profile:
- Risk Tolerance: ${riskTolerance}
- Initial Investment: $${amount}
- Time Horizon: ${years} years
- Investment Goal: ${goal}

Available mutual funds:
${fundList}

Based on this profile, recommend a portfolio using 2-4 of these funds.

Respond ONLY with a valid JSON object in exactly this format, no other text, no markdown:
{
  "allocations": [
    { "ticker": "FXAIX", "percentage": 60 },
    { "ticker": "VWELX", "percentage": 40 }
  ],
  "reasoning": "2-3 sentences explaining why this portfolio suits the client."
}

Rules:
- Percentages must add up to exactly 100
- Only use tickers from the list above
- Match risk tolerance: Low = low beta funds, High = high beta funds
    `;

    try {
      // ── Call Gemini API ───────────────────────────────────────────────────
      // Key: frontend/.env or .env.local as VITE_GEMINI_API_KEY (Vite exposes via import.meta.env)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Missing VITE_GEMINI_API_KEY. Add it to frontend/.env.local and restart the dev server.'
        );
      }

      // Model IDs: https://ai.google.dev/gemini-api/docs/models
      // Use v1beta here: v1 REST rejects generationConfig.responseMimeType (JSON mode).
      const geminiModel = 'gemini-2.5-flash';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              // Ask Gemini to respond in JSON mode for cleaner output
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${errData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Extract text from Gemini response
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Empty response from Gemini');

      // Strip any accidental markdown fences just in case
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);

      // ── Enrich allocations with fund data and math ────────────────────────
      // TODO: When backend is connected, replace calcExpectedReturn(fund.beta)
      // with the expectedReturn value returned from GET /api/mutual-funds
      // so we use real market beta instead of hardcoded values.

      const enriched = parsed.allocations.map(alloc => {
        const fund = FUNDS.find(f => f.ticker === alloc.ticker);
        if (!fund) throw new Error(`Unknown ticker: ${alloc.ticker}`);

        const expectedReturn = calcExpectedReturn(fund.beta);
        const invested       = (Number(amount) * alloc.percentage) / 100;
        const futureValue    = calcFutureValue(invested, expectedReturn, years);

        return { ...alloc, ...fund, expectedReturn, invested, futureValue };
      });

      // Verify percentages add up to 100
      const totalPct = enriched.reduce((sum, f) => sum + f.percentage, 0);
      if (Math.abs(totalPct - 100) > 1) throw new Error('Allocations do not add up to 100%');

      const totalFV   = enriched.reduce((sum, f) => sum + f.futureValue, 0);
      const totalGain = totalFV - Number(amount);

      setResult({
        allocations: enriched,
        reasoning:   parsed.reasoning,
        totalFV,
        totalGain,
        principal:   Number(amount),
      });

    } catch (err) {
      console.error(err);
      setError(`Something went wrong: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Page title ── */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          AI Portfolio <span className={styles.accent}>Advisor</span>
        </h1>
        <p className={styles.subtitle}>
          Tell us your goals. We'll build your portfolio.
        </p>
      </div>

      <div className={styles.layout}>

        {/* ── Left: input form ── */}
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

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.button}
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze My Portfolio'}
          </button>
        </div>

        {/* ── Right: results ── */}
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

              {/* Total projected value */}
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

                {/* Progress bar */}
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

              {/* Fund allocation breakdown */}
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
                      <span>E(r) {(fund.expectedReturn * 100).toFixed(2)}%</span>
                      <span className={styles.green}>
                        → {formatCurrency(fund.futureValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI reasoning */}
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