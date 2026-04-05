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

function riskBetaGuidance(risk) {
  if (risk === 'Low') {
    return 'Weighted-average portfolio beta must be < 0.80. Prefer holdings with individual beta < 0.80.';
  }
  if (risk === 'High') {
    return 'Weighted-average portfolio beta must be > 1.10. Include meaningful weight in funds with individual beta > 1.10.';
  }
  return 'Weighted-average portfolio beta should fall near 1.00 (use roughly 0.85–1.15).';
}

function horizonGuidance(years) {
  if (years <= 5) {
    return 'Time horizon 1–5 years: within the risk band, bias toward the lower-beta names (less recovery time).';
  }
  if (years >= 20) {
    return 'Time horizon 20+ years: within the risk band, you may allocate more to higher-beta growth names (long horizon).';
  }
  return 'Time horizon 6–19 years: meet the risk-tier beta targets without extra short/long tilt.';
}

function goalGuidance(goal) {
  switch (goal) {
    case 'Growth':
      return 'Goal Growth: maximize exposure to higher-beta funds consistent with the risk tier (e.g. PRGFX, AGTHX, FCNTX where allowed).';
    case 'Capital Preservation':
      return 'Goal Capital Preservation: overweight VWELX (beta 0.72) and funds with beta < 0.85; avoid large weights in beta > 1.10.';
    case 'Income':
      return 'Goal Income: balanced mix of moderate-beta equity and defensive sleeves; avoid a single-beta cluster.';
    case 'Balanced':
      return 'Goal Balanced: hold at least two distinct beta levels (defensive ~0.72–0.95 and core/growth ~1.00–1.15).';
    default:
      return 'Align fund weights with the stated goal and the beta rules above.';
  }
}

export default function AIFeature() {
  const [riskTolerance, setRiskTolerance] = useState('');
  const [amount, setAmount]               = useState('');
  const [years, setYears]                 = useState(10);
  const [goal, setGoal]                   = useState('');
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [notes, setNotes]                 = useState([]);

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
      f => `- ${f.ticker}: ${f.name} | β=${f.beta.toFixed(2)} | CAPM E(r)=${(calcExpectedReturn(f.beta) * 100).toFixed(2)}%`
    ).join('\n');

    const riskLine = riskBetaGuidance(riskTolerance);
    const horizonLine = horizonGuidance(years);
    const goalLine = goalGuidance(goal);

    const prompt = `You are a portfolio analyst. Output must follow CAPM-style logic using the betas below (Rf=${(RISK_FREE_RATE * 100).toFixed(2)}%, Rm=${(MARKET_RETURN * 100).toFixed(2)}%).

CLIENT (numeric targets apply):
- Risk tolerance: ${riskTolerance} → ${riskLine}
- Investment horizon: ${years} years → ${horizonLine}
- Goal: ${goal} → ${goalLine}
- Initial investment: $${amount} (for context only)

${notes ? `- Additional context from client: "${notes}"` : ''}

FUNDS (only these tickers; β = beta vs market):
${fundList}

DIVERSIFICATION (mandatory):
- Use 2–4 funds. Do not pick only similar betas (e.g. three funds all near β≈1.0) unless Low risk + preservation forces it.
- When appropriate for the risk tier and goal, include international diversification using DODFX (name contains International).
- Include international exposure (DODFX) where it makes sense for the client
- Percentages must add up to exactly 100

REASONING (mandatory style):
- In "reasoning", write 4–6 sentences. For EACH fund you allocate, name the ticker, state its β to two decimals, and one clause on why that weight fits risk/goal/horizon (tradeoff in plain English).
- For each fund you pick, mention its name, how risky it is compared to the market, and in plain English why it fits this client's situation
- Explain the tradeoff: what the client gains and what they give up with each choice
- If the client gave additional context, reference it directly so they feel heard
- No raw numbers like "beta = 1.08" in the reasoning — say "slightly more volatile 
  than the market" instead

OUTPUT: Valid JSON only, no markdown:
{
  "allocations": [ { "ticker": "TICKER", "percentage": <integer 1-99> } ],
  "reasoning": "<string as above>"
}

CONSTRAINTS:
- allocation percentages are integers summing to exactly 100
- tickers must appear exactly as listed above
- Portfolio must satisfy the weighted-average beta target for ${riskTolerance} risk together with horizon and goal above
    `;

    try {
      
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
              temperature: 0.45,
       
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

      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Empty response from Gemini');

      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);

      const enriched = parsed.allocations.map(alloc => {
        const fund = FUNDS.find(f => f.ticker === alloc.ticker);
        if (!fund) throw new Error(`Unknown ticker: ${alloc.ticker}`);

        const expectedReturn = calcExpectedReturn(fund.beta);
        const invested       = (Number(amount) * alloc.percentage) / 100;
        const futureValue    = calcFutureValue(invested, expectedReturn, years);

        return { ...alloc, ...fund, expectedReturn, invested, futureValue };
      });

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
                      <span>E(r) {(fund.expectedReturn * 100).toFixed(2)}%</span>
                      <span className={styles.green}>
                        → {formatCurrency(fund.futureValue)}
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