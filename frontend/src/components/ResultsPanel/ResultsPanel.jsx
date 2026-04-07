import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency, formatPercent, calcFutureValue } from '../../capm';
import { calculateFutureValue } from '../../api/mutualFunds';
import styles from './ResultsPanel.module.css';

const W = 800;   // viewBox width
const H = 320;   // viewBox height
const PAD = { top: 24, right: 24, bottom: 48, left: 72 };

function getProjectedRate(result) {
  return result.risk_free_rate + result.beta * (result.expected_return_rate - result.risk_free_rate);
}

// Generate an array of { year, value } data points for a fund
function generatePoints(principal, expectedReturn, totalYears) {
  return Array.from({ length: totalYears + 1 }, (_, yr) => ({
    year: yr,
    value: calcFutureValue(principal, expectedReturn, yr),
  }));
}

// Map a data value to an SVG x coordinate
function toX(year, totalYears) {
  return PAD.left + (year / totalYears) * (W - PAD.left - PAD.right);
}

// Map a dollar value to an SVG y coordinate
function toY(value, minVal, maxVal) {
  const chartH = H - PAD.top - PAD.bottom;
  return PAD.top + chartH - ((value - minVal) / (maxVal - minVal)) * chartH;
}

// Convert an array of { year, value } points into an SVG polyline points string
function toPolyline(points, totalYears, minVal, maxVal) {
  return points
    .map(p => `${toX(p.year, totalYears)},${toY(p.value, minVal, maxVal)}`)
    .join(' ');
}

// Build a closed SVG polygon path for the shaded area between two lines
function buildShadePolygon(pts1, pts2, totalYears, minVal, maxVal) {
  // Go forward along line 1, then backward along line 2 to close the shape
  const forward = pts1.map(p => `${toX(p.year, totalYears)},${toY(p.value, minVal, maxVal)}`).join(' ');
  const backward = [...pts2].reverse().map(p => `${toX(p.year, totalYears)},${toY(p.value, minVal, maxVal)}`).join(' ');
  return `${forward} ${backward}`;
}

function YAxis({ minVal, maxVal }) {
  const ticks = 5;
  return (
    <>
      {Array.from({ length: ticks }, (_, i) => {
        const value = minVal + (i / (ticks - 1)) * (maxVal - minVal);
        const y = toY(value, minVal, maxVal);
        return (
          <g key={i}>
            {/* Horizontal grid line */}
            <line
              x1={PAD.left} y1={y}
              x2={W - PAD.right} y2={y}
              stroke="var(--border)" strokeWidth="1"
            />
            {/* Dollar label */}
            <text
              x={PAD.left - 8} y={y + 4}
              textAnchor="end"
              fill="var(--muted)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}
            </text>
          </g>
        );
      })}
    </>
  );
}
function XAxis({ totalYears, minVal, maxVal }) {
  // Show at most 8 evenly spaced year labels
  const step = Math.ceil(totalYears / 8);
  const ticks = [];
  for (let yr = 0; yr <= totalYears; yr += step) ticks.push(yr);
  if (ticks[ticks.length - 1] !== totalYears) ticks.push(totalYears);

  const y = toY(minVal, minVal, maxVal) + 18;

  return (
    <>
      {ticks.map(yr => (
        <text
          key={yr}
          x={toX(yr, totalYears)} y={y}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {yr}yr
        </text>
      ))}
    </>
  );
}
function GrowthChart({ result }) {
  const { principal, years, future_value, fund_name } = result;
  const expectedReturn = getProjectedRate(result);
  const futureValue = future_value;
  const points = generatePoints(principal, expectedReturn, years);

  const minVal = principal * 0.95;
  const maxVal = futureValue * 1.05;

  const polyline = toPolyline(points, years, minVal, maxVal);

  // Baseline (flat line at principal) for the shaded area underneath
  const baseline = [
    { year: 0, value: principal },
    { year: years, value: principal },
  ];
  const shadePolygon = buildShadePolygon(points, baseline, years, minVal, maxVal);

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartLabel}>Growth Curve — {fund_name}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
        <defs>
          <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <YAxis minVal={minVal} maxVal={maxVal} />
        <XAxis totalYears={years} minVal={minVal} maxVal={maxVal} />
        <polygon points={shadePolygon} fill="url(#goldFill)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={toX(years, years)}
          cy={toY(futureValue, minVal, maxVal)}
          r="5"
          fill="var(--gold)"
        />
      </svg>
    </div>
  );
}

function ComparisonChart({ result, compareFund }) {
  const { principal, years, future_value, fund_name } = result;
  const baseReturn = getProjectedRate(result);
  const compareReturn = getProjectedRate(compareFund);
  const compareFV = compareFund.future_value;

  const pts1 = generatePoints(principal, baseReturn, years);
  const pts2 = generatePoints(principal, compareReturn, years);

  const allValues = [...pts1, ...pts2].map(p => p.value);
  const minVal = principal * 0.95;
  const maxVal = Math.max(...allValues) * 1.05;

  const poly1 = toPolyline(pts1, years, minVal, maxVal);
  const poly2 = toPolyline(pts2, years, minVal, maxVal);

  // Shade the area between the two lines
  const shadePoly = buildShadePolygon(pts1, pts2, years, minVal, maxVal);

  // Determine which fund performs better at end
  const fund1Better = future_value >= compareFV;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartLabel}>Fund Comparison</div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--gold)' }} />
          <span>{fund_name}</span>
          <span className={styles.legendValue}>{formatCurrency(future_value)}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--green)' }} />
          <span>{compareFund.fund_name}</span>
          <span className={styles.legendValue}>{formatCurrency(compareFV)}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
        <defs>
          <linearGradient id="shadeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <YAxis minVal={minVal} maxVal={maxVal} />
        <XAxis totalYears={years} minVal={minVal} maxVal={maxVal} />
        <polygon points={shadePoly} fill="url(#shadeFill)" />
        <polyline
          points={poly1}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={poly2}
          fill="none"
          stroke="var(--green)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="6 3"
        />
        <circle cx={toX(years, years)} cy={toY(future_value, minVal, maxVal)} r="5" fill="var(--gold)" />
        <circle cx={toX(years, years)} cy={toY(compareFV, minVal, maxVal)} r="5" fill="var(--green)" />
      </svg>
      <div className={styles.diffCallout}>
        <span className={styles.diffLabel}>Difference at {years} years</span>
        <span className={`${styles.diffValue} ${fund1Better ? styles.positive : styles.negative}`}>
          {fund1Better ? '+' : '-'}{formatCurrency(Math.abs(future_value - compareFV))}
          {' '}in favor of {fund1Better ? fund_name : compareFund.fund_name}
        </span>
      </div>
    </div>
  );
}
export default function ResultsPanel({ result, funds }) {
  const {
    ticker,
    fund_name,
    principal,
    years,
    beta,
    risk_free_rate,
    expected_return_rate,
    future_value,
  } = result;
  const gain = future_value - principal;

  const fillRef  = useRef(null);
  const panelRef = useRef(null);

  // State for the comparison feature
  const [comparing, setComparing]     = useState(false);
  const [compareFund, setCompareFund] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');
  useEffect(() => {
    setTimeout(() => {
      setComparing(false);
      setCompareFund(null);
      setCompareError('');
    }, 0);
  }, [result]);

  // Animate progress bar and scroll into view
  useEffect(() => {
    const gainPct = Math.min((gain / future_value) * 100, 88);
    setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${gainPct}%`;
    }, 100);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [result]);

  const gainPositive = gain >= 0;

  // Funds available for comparison — exclude the currently selected fund
  const comparisonFunds = funds.filter(f => f.ticker !== ticker);

  async function handleCompareChange(event) {
    const nextTicker = event.target.value;

    if (!nextTicker) {
      setCompareFund(null);
      setCompareError('');
      return;
    }

    setCompareLoading(true);
    setCompareError('');

    try {
      const comparison = await calculateFutureValue({
        ticker: nextTicker,
        principal,
        years,
      });
      setCompareFund(comparison);
    } catch (err) {
      setCompareFund(null);
      setCompareError(err.message || 'Failed to compare funds.');
    } finally {
      setCompareLoading(false);
    }
  }

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className="card-label">Projected Return</div>

      <div className={styles.topRow}>
        <div>
          <p className={styles.resultLabel}>Future Portfolio Value</p>
          <p className={`${styles.resultAmount} ${gainPositive ? styles.positive : styles.negative}`}>
            {formatCurrency(future_value)}
          </p>
          <p className={styles.fundName}>{fund_name} · {years} yr{years !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Beta (β)</span>
          <span className={styles.metaValue}>{beta.toFixed(2)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Risk-Free Rate</span>
          <span className={styles.metaValue}>{formatPercent(risk_free_rate)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Expected Return</span>
          <span className={`${styles.metaValue} ${styles.positive}`}>
            {formatPercent(expected_return_rate)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total Gain</span>
          <span className={`${styles.metaValue} ${gainPositive ? styles.positive : styles.negative}`}>
            {formatCurrency(gain)}
          </span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabels}>
          <span>Initial Investment</span>
          <span>Projected Growth</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} ref={fillRef} style={{ width: '0%' }} />
        </div>
        <div className={styles.progressAmounts}>
          <span>{formatCurrency(principal)}</span>
          <span className={styles.positive}>{formatCurrency(future_value)}</span>
        </div>
      </div>
      <GrowthChart result={result} />
      {!comparing ? (
        <button className={styles.compareBtn} onClick={() => setComparing(true)}>
          Compare with another fund
        </button>
      ) : (
        <div className={styles.compareSection}>
          <div className={styles.compareHeader}>
            <span className="card-label" style={{ margin: 0 }}>Compare Fund</span>
            <button className={styles.closeBtn} onClick={() => { setComparing(false); setCompareFund(null); }}>
              ✕
            </button>
          </div>
          <select
            className={styles.compareSelect}
            value={compareFund?.ticker || ''}
            onChange={handleCompareChange}
          >
            <option value="">Select a fund to compare...</option>
            {comparisonFunds.map(f => (
              <option key={f.ticker} value={f.ticker}>{f.name} ({f.ticker})</option>
            ))}
          </select>
          {compareLoading && (
            <p className={styles.compareStatus}>Loading comparison...</p>
          )}
          {compareError && (
            <p className={styles.compareError}>{compareError}</p>
          )}
          {compareFund && (
            <ComparisonChart result={result} compareFund={compareFund} />
          )}
        </div>
      )}
    </div>
  );
}
