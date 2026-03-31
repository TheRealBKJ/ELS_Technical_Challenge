import React, { useState, useRef } from 'react';
import { FUNDS, RISK_FREE_RATE, MARKET_RETURN } from '../../funds';
import { calcExpectedReturn, calcFutureValue, formatCurrency, formatPercent } from '../../capm';
import styles from './ReportPage.module.css';

const W = 760, H = 280;
const PAD = { top: 20, right: 24, bottom: 44, left: 72 };

function toX(yr, totalYears) {
  return PAD.left + (yr / totalYears) * (W - PAD.left - PAD.right);
}
function toY(val, minVal, maxVal) {
  const h = H - PAD.top - PAD.bottom;
  return PAD.top + h - ((val - minVal) / (maxVal - minVal)) * h;
}

function ReportChart({ principal, rate, years, futureValue }) {
  const points = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr,
    value: calcFutureValue(principal, rate, yr),
  }));
  const minVal = principal * 0.95;
  const maxVal = futureValue * 1.05;

  const polylineStr = points
    .map(p => `${toX(p.year, years)},${toY(p.value, minVal, maxVal)}`)
    .join(' ');

  const areaStr = [
    ...points.map(p => `${toX(p.year, years)},${toY(p.value, minVal, maxVal)}`),
    `${toX(years, years)},${toY(minVal, minVal, maxVal)}`,
    `${toX(0, years)},${toY(minVal, minVal, maxVal)}`,
  ].join(' ');

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) =>
    minVal + (i / (tickCount - 1)) * (maxVal - minVal)
  );
  const step = Math.ceil(years / 6);
  const xTicks = [];
  for (let yr = 0; yr <= years; yr += step) xTicks.push(yr);
  if (xTicks[xTicks.length - 1] !== years) xTicks.push(years);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg}>
      <defs>
        <linearGradient id="reportGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={toY(v, minVal, maxVal)} x2={W - PAD.right} y2={toY(v, minVal, maxVal)}
            stroke="#1f2530" strokeWidth="1" />
          <text x={PAD.left - 8} y={toY(v, minVal, maxVal) + 4}
            textAnchor="end" fill="#5a6070" fontSize="11" fontFamily="'DM Mono', monospace">
            {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
          </text>
        </g>
      ))}
      {xTicks.map(yr => (
        <text key={yr} x={toX(yr, years)} y={toY(minVal, minVal, maxVal) + 18}
          textAnchor="middle" fill="#5a6070" fontSize="11" fontFamily="'DM Mono', monospace">
          {yr}yr
        </text>
      ))}
      <polygon points={areaStr} fill="url(#reportGold)" />
      <polyline points={polylineStr} fill="none" stroke="#c9a84c" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={toX(years, years)} cy={toY(futureValue, minVal, maxVal)} r="5" fill="#c9a84c" />
    </svg>
  );
}

export default function ReportPage() {
  const [fund, setFund] = useState(null);
  const [principal, setPrincipal] = useState(10000);
  const [years, setYears] = useState(10);
  const [report, setReport] = useState(null);
  const reportRef = useRef(null);

  const pct = ((years - 1) / (40 - 1)) * 100;

  function handleGenerate() {
    if (!fund || principal < 100) return;
    const rate = calcExpectedReturn(fund.beta);
    const futureValue = calcFutureValue(principal, rate, years);
    const gain = futureValue - principal;
    const returnPct = gain / principal;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    setReport({ fund, principal, years, rate, futureValue, gain, returnPct, date });
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          Investment <span className={styles.accent}>Report</span>
        </h1>
        <p className={styles.subtitle}>Turn your projection into a shareable one-pager. Everything a financial analyst would want to see, formatted and ready to present.</p>
      </div>

      {/* Config form */}
      <div className={styles.configCard}>
        <div className="card-label">Configure Report</div>
        <div className={styles.configGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Mutual Fund</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={fund?.ticker || ''}
                onChange={e => setFund(FUNDS.find(f => f.ticker === e.target.value) || null)}
              >
                <option value="">— Choose a fund —</option>
                {FUNDS.map(f => (
                  <option key={f.ticker} value={f.ticker}>{f.name} ({f.ticker})</option>
                ))}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Initial Investment</label>
            <div className={styles.inputWrapper}>
              <span className={styles.prefix}>$</span>
              <input
                type="number"
                className={styles.input}
                min={100} step={100}
                value={principal}
                onChange={e => setPrincipal(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Time Horizon — <span style={{ color: 'var(--gold)' }}>{years} years</span>
            </label>
            <input
              type="range"
              className={styles.range}
              min={1} max={40} step={1}
              value={years}
              style={{ '--pct': `${pct}%` }}
              onChange={e => setYears(Number(e.target.value))}
            />
            <div className={styles.rangeLabels}>
              <span>1 yr</span><span>10 yrs</span><span>20 yrs</span><span>40 yrs</span>
            </div>
          </div>
        </div>

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={!fund || principal < 100}
        >
          Generate Report
        </button>
      </div>

      {/* Report card */}
      {report && (
        <div className={styles.reportWrap} ref={reportRef}>
          <div className={styles.printActions}>
            <button className={styles.printBtn} onClick={handlePrint}>
              ↓ Save / Print
            </button>
          </div>

          <div className={styles.reportCard} id="report-card">
            {/* Header */}
            <div className={styles.reportHeader}>
              <div className={styles.reportBrand}>
                <div className={styles.reportLogoMark} />
                <span>Mutual Fund Calculator</span>
              </div>
              <div className={styles.reportMeta}>
                <span>Investment Projection Report</span>
                <span className={styles.reportDate}>{report.date}</span>
              </div>
            </div>

            <div className={styles.reportDivider} />

            {/* Fund title */}
            <div className={styles.reportFundBlock}>
              <div className={styles.reportTicker}>{report.fund.ticker}</div>
              <div className={styles.reportFundName}>{report.fund.name}</div>
            </div>

            {/* Key stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Initial Investment</div>
                <div className={styles.statValue}>{formatCurrency(report.principal)}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Time Horizon</div>
                <div className={styles.statValue}>{report.years} yrs</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Beta (β)</div>
                <div className={styles.statValue}>{report.fund.beta.toFixed(2)}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>CAPM Rate E(r)</div>
                <div className={styles.statValue}>{formatPercent(report.rate)}</div>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxAccent}`}>
                <div className={styles.statLabel}>Projected Value</div>
                <div className={`${styles.statValue} ${styles.statValueGreen}`}>{formatCurrency(report.futureValue)}</div>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxAccent}`}>
                <div className={styles.statLabel}>Total Gain</div>
                <div className={`${styles.statValue} ${styles.statValueGreen}`}>+{formatCurrency(report.gain)}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className={styles.reportProgress}>
              <div className={styles.reportProgressBar}>
                <div
                  className={styles.reportProgressFill}
                  style={{ width: `${Math.min((report.principal / report.futureValue) * 100, 85)}%` }}
                />
                <div className={styles.reportProgressGain}
                  style={{ width: `${Math.min((report.gain / report.futureValue) * 100, 85)}%` }}
                />
              </div>
              <div className={styles.reportProgressLabels}>
                <span>Principal: {formatCurrency(report.principal)}</span>
                <span style={{ color: '#4caf7d' }}>
                  +{formatPercent(report.returnPct, 1)} total return → {formatCurrency(report.futureValue)}
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className={styles.reportChartWrap}>
              <div className={styles.reportChartLabel}>Growth Curve</div>
              <ReportChart
                principal={report.principal}
                rate={report.rate}
                years={report.years}
                futureValue={report.futureValue}
              />
            </div>

            {/* Assumptions */}
            <div className={styles.reportFooter}>
              <div className={styles.assumptionsRow}>
                <span>Risk-Free Rate (Rf): {formatPercent(RISK_FREE_RATE)}</span>
                <span>Market Return (Rm): {formatPercent(MARKET_RETURN)}</span>
                <span>Model: FV = P × (1 + r)^t</span>
                <span>r = Rf + β(Rm − Rf)</span>
              </div>
              <p className={styles.disclaimer}>
                For illustrative purposes only. Past performance does not guarantee future results.
                This projection uses the CAPM model with hardcoded assumptions and does not constitute financial advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}