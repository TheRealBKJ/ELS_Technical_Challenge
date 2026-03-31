import React, { useState, useMemo } from 'react';
import { FUNDS, RISK_FREE_RATE, MARKET_RETURN } from '../../funds';
import { calcFutureValue, formatCurrency, formatPercent } from '../../capm';
import styles from './WhatIfPage.module.css';

const W = 800, H = 280;
const PAD = { top: 20, right: 24, bottom: 44, left: 72 };

function toX(yr, totalYears) {
  return PAD.left + (yr / totalYears) * (W - PAD.left - PAD.right);
}
function toY(val, minVal, maxVal) {
  const h = H - PAD.top - PAD.bottom;
  return PAD.top + h - ((val - minVal) / (maxVal - minVal)) * h;
}
function toPolyline(points, totalYears, minVal, maxVal) {
  return points.map(p => `${toX(p.year, totalYears)},${toY(p.value, minVal, maxVal)}`).join(' ');
}

function SimChart({ principal, years, baseRate, whatIfRate }) {
  const basePts = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr, value: calcFutureValue(principal, baseRate, yr),
  }));
  const whatPts = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr, value: calcFutureValue(principal, whatIfRate, yr),
  }));

  const allVals = [...basePts, ...whatPts].map(p => p.value);
  const minVal = principal * 0.9;
  const maxVal = Math.max(...allVals) * 1.05;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) =>
    minVal + (i / (tickCount - 1)) * (maxVal - minVal)
  );
  const step = Math.ceil(years / 6);
  const xTicks = [];
  for (let yr = 0; yr <= years; yr += step) xTicks.push(yr);
  if (xTicks[xTicks.length - 1] !== years) xTicks.push(years);

  const baseFV  = basePts[years].value;
  const whatFV  = whatPts[years].value;
  const better  = whatFV >= baseFV;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
      <defs>
        <linearGradient id="wiFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={better ? '#4caf7d' : '#e05555'} stopOpacity="0.15" />
          <stop offset="100%" stopColor={better ? '#4caf7d' : '#e05555'} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={toY(v, minVal, maxVal)} x2={W - PAD.right} y2={toY(v, minVal, maxVal)}
            stroke="var(--border)" strokeWidth="1" />
          <text x={PAD.left - 8} y={toY(v, minVal, maxVal) + 4}
            textAnchor="end" fill="var(--muted)" fontSize="11" fontFamily="var(--font-mono)">
            {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
          </text>
        </g>
      ))}
      {xTicks.map(yr => (
        <text key={yr} x={toX(yr, years)} y={toY(minVal, minVal, maxVal) + 18}
          textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="var(--font-mono)">
          {yr}yr
        </text>
      ))}

      {/* Base line (gold, dashed) */}
      <polyline
        points={toPolyline(basePts, years, minVal, maxVal)}
        fill="none" stroke="var(--gold)" strokeWidth="2"
        strokeDasharray="6 3" strokeLinejoin="round" strokeLinecap="round"
      />

      {/* What-if line (solid, green or red) */}
      <polyline
        points={toPolyline(whatPts, years, minVal, maxVal)}
        fill="none"
        stroke={better ? 'var(--green)' : 'var(--red)'}
        strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round"
      />

      {/* End dots */}
      <circle cx={toX(years, years)} cy={toY(baseFV, minVal, maxVal)} r="4" fill="var(--gold)" />
      <circle cx={toX(years, years)} cy={toY(whatFV, minVal, maxVal)} r="5"
        fill={better ? 'var(--green)' : 'var(--red)'} />
    </svg>
  );
}

export default function WhatIfPage() {
  const [fund, setFund]           = useState(FUNDS[0]);
  const [principal, setPrincipal] = useState(10000);
  const [years, setYears]         = useState(10);

  // What-if sliders
  const [beta, setBeta]                     = useState(fund.beta);
  const [expectedReturn, setExpectedReturn] = useState(MARKET_RETURN);

  // When fund changes, reset sliders to fund defaults
  function handleFundChange(ticker) {
    const f = FUNDS.find(f => f.ticker === ticker);
    setFund(f);
    setBeta(f.beta);
    setExpectedReturn(MARKET_RETURN);
  }

  // CAPM rates
  const baseRate   = RISK_FREE_RATE + fund.beta * (MARKET_RETURN - RISK_FREE_RATE);
  const whatIfRate = RISK_FREE_RATE + beta * (expectedReturn - RISK_FREE_RATE);

  const baseFV   = calcFutureValue(principal, baseRate, years);
  const whatIfFV = calcFutureValue(principal, whatIfRate, years);
  const diff     = whatIfFV - baseFV;
  const better   = diff >= 0;

  const yearsPct = ((years - 1) / 39) * 100;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          What-If <span className={styles.accent}>Simulator</span>
        </h1>
        <p className={styles.subtitle}>Most calculators hide their assumptions. This one lets you break them. Adjust beta and expected return and see the difference play out on the chart.</p>
      </div>

      <div className={styles.layout}>
        {/* ── Left: controls ── */}
        <div className={styles.leftCol}>

          {/* Fund + params */}
          <div className={styles.card}>
            <div className="card-label">Base Investment</div>

            <div className={styles.field}>
              <label className={styles.label}>Mutual Fund</label>
              <div className={styles.selectWrapper}>
                <select className={styles.select} value={fund.ticker} onChange={e => handleFundChange(e.target.value)}>
                  {FUNDS.map(f => (
                    <option key={f.ticker} value={f.ticker}>{f.name} ({f.ticker})</option>
                  ))}
                </select>
                <span className={styles.arrow}>▾</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Initial Investment</label>
              <div className={styles.inputWrapper}>
                <span className={styles.prefix}>$</span>
                <input type="number" className={styles.input}
                  min={100} step={100} value={principal}
                  onChange={e => setPrincipal(Number(e.target.value))} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Time Horizon — <span style={{ color: 'var(--gold)' }}>{years} years</span>
              </label>
              <input type="range" className={styles.range}
                min={1} max={40} step={1} value={years}
                style={{ '--pct': `${yearsPct}%` }}
                onChange={e => setYears(Number(e.target.value))} />
              <div className={styles.rangeLabels}>
                <span>1 yr</span><span>10 yrs</span><span>20 yrs</span><span>40 yrs</span>
              </div>
            </div>
          </div>

          {/* What-if sliders */}
          <div className={styles.card}>
            <div className="card-label">Adjust Assumptions</div>

            {/* Beta slider */}
            <div className={styles.field}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Beta (β)</label>
                <div className={styles.sliderBadge}>
                  <span className={styles.sliderBase}>Base: {fund.beta.toFixed(2)}</span>
                  <span className={styles.sliderCurrent} style={{ color: beta > fund.beta ? 'var(--red)' : beta < fund.beta ? 'var(--green)' : 'var(--muted)' }}>
                    Now: {beta.toFixed(2)}
                  </span>
                </div>
              </div>
              <input type="range" className={styles.range}
                min={0} max={2.5} step={0.01} value={beta}
                style={{ '--pct': `${(beta / 2.5) * 100}%` }}
                onChange={e => setBeta(Number(e.target.value))} />
              <div className={styles.rangeLabels}>
                <span>0 (no risk)</span><span>1.0 (market)</span><span>2.5 (high)</span>
              </div>
              <p className={styles.hint}>
                Higher β = more volatile than the market. S&P 500 β = 1.0.
              </p>
            </div>

            {/* Expected return slider */}
            <div className={styles.field}>
              <div className={styles.sliderHeader}>
                <label className={styles.label}>Expected Market Return (Rm)</label>
                <div className={styles.sliderBadge}>
                  <span className={styles.sliderBase}>Base: {formatPercent(MARKET_RETURN)}</span>
                  <span className={styles.sliderCurrent} style={{ color: expectedReturn > MARKET_RETURN ? 'var(--green)' : expectedReturn < MARKET_RETURN ? 'var(--red)' : 'var(--muted)' }}>
                    Now: {formatPercent(expectedReturn)}
                  </span>
                </div>
              </div>
              <input type="range" className={styles.range}
                min={0} max={0.25} step={0.001} value={expectedReturn}
                style={{ '--pct': `${(expectedReturn / 0.25) * 100}%` }}
                onChange={e => setExpectedReturn(Number(e.target.value))} />
              <div className={styles.rangeLabels}>
                <span>0%</span><span>12.5%</span><span>25%</span>
              </div>
              <p className={styles.hint}>
                Historical S&P 500 avg ~10%. Drag to model bull or bear scenarios.
              </p>
            </div>

            <button className={styles.resetBtn} onClick={() => { setBeta(fund.beta); setExpectedReturn(MARKET_RETURN); }}>
              ↺ Reset to Defaults
            </button>
          </div>
        </div>

        {/* ── Right: live results ── */}
        <div className={styles.rightCol}>

          {/* Live diff callout */}
          <div className={`${styles.diffCard} ${better ? styles.diffCardGreen : styles.diffCardRed}`}>
            <div className={styles.diffLabel}>
              {better ? '▲ What-if outperforms base by' : '▼ What-if underperforms base by'}
            </div>
            <div className={`${styles.diffAmount} ${better ? styles.green : styles.red}`}>
              {better ? '+' : '-'}{formatCurrency(Math.abs(diff))}
            </div>
            <div className={styles.diffSub}>after {years} years on {formatCurrency(principal)}</div>
          </div>

          {/* Side-by-side stats */}
          <div className={styles.compareGrid}>
            <div className={styles.compareCard}>
              <div className={styles.compareTag}>Base</div>
              <div className={styles.compareFund}>{fund.ticker}</div>
              <div className={styles.compareRow}>
                <span>β</span><span>{fund.beta.toFixed(2)}</span>
              </div>
              <div className={styles.compareRow}>
                <span>Rm</span><span>{formatPercent(MARKET_RETURN)}</span>
              </div>
              <div className={styles.compareRow}>
                <span>E(r)</span><span>{formatPercent(baseRate)}</span>
              </div>
              <div className={styles.compareFV}>{formatCurrency(baseFV)}</div>
            </div>

            <div className={`${styles.compareCard} ${better ? styles.compareCardGreen : styles.compareCardRed}`}>
              <div className={styles.compareTag} style={{ color: better ? 'var(--green)' : 'var(--red)' }}>What-If</div>
              <div className={styles.compareFund}>{fund.ticker}</div>
              <div className={styles.compareRow}>
                <span>β</span>
                <span style={{ color: beta !== fund.beta ? (beta > fund.beta ? 'var(--red)' : 'var(--green)') : 'inherit' }}>
                  {beta.toFixed(2)}
                </span>
              </div>
              <div className={styles.compareRow}>
                <span>Rm</span>
                <span style={{ color: expectedReturn !== MARKET_RETURN ? (expectedReturn > MARKET_RETURN ? 'var(--green)' : 'var(--red)') : 'inherit' }}>
                  {formatPercent(expectedReturn)}
                </span>
              </div>
              <div className={styles.compareRow}>
                <span>E(r)</span><span>{formatPercent(whatIfRate)}</span>
              </div>
              <div className={`${styles.compareFV} ${better ? styles.green : styles.red}`}>
                {formatCurrency(whatIfFV)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className={styles.chartCard}>
            <div className="card-label">Growth Comparison</div>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={styles.legendLine} style={{ borderTopColor: 'var(--gold)', borderTopStyle: 'dashed' }} />
                <span>Base</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendLine} style={{ borderTopColor: better ? 'var(--green)' : 'var(--red)' }} />
                <span>What-If</span>
              </div>
            </div>
            <SimChart
              principal={principal}
              years={years}
              baseRate={baseRate}
              whatIfRate={whatIfRate}
            />
          </div>

        </div>
      </div>
    </div>
  );
}