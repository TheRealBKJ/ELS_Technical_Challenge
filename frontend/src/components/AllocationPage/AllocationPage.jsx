import React, { useState, useRef, useEffect } from 'react';
import { FUNDS, RISK_FREE_RATE, MARKET_RETURN } from '../../funds';
import { calcExpectedReturn, calcFutureValue, formatCurrency, formatPercent } from '../../capm';
import styles from './AllocationPage.module.css';

const COLORS = ['var(--gold)', 'var(--green)', '#7eb8f7', '#c97ae8', '#f7a05a'];

const W = 800, H = 300;
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

function BlendedChart({ allocations, principal, years }) {
  const allPoints = allocations.map(a => {
    const invested = principal * (a.pct / 100);
    const rate = calcExpectedReturn(a.fund.beta);
    return Array.from({ length: years + 1 }, (_, yr) => ({
      year: yr,
      value: calcFutureValue(invested, rate, yr),
    }));
  });

  const blendedPoints = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr,
    value: allPoints.reduce((sum, pts) => sum + pts[yr].value, 0),
  }));

  const allValues = [...allPoints.flat(), ...blendedPoints].map(p => p.value);
  const minVal = principal * 0.95;
  const maxVal = Math.max(...allValues) * 1.05;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) =>
    minVal + (i / (tickCount - 1)) * (maxVal - minVal)
  );
  const step = Math.ceil(years / 8);
  const xTicks = [];
  for (let yr = 0; yr <= years; yr += step) xTicks.push(yr);
  if (xTicks[xTicks.length - 1] !== years) xTicks.push(years);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
      {yTicks.map((v, i) => {
        const y = toY(v, minVal, maxVal);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="var(--muted)" fontSize="11" fontFamily="var(--font-mono)">
              {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
            </text>
          </g>
        );
      })}
      {xTicks.map(yr => (
        <text key={yr} x={toX(yr, years)} y={toY(minVal, minVal, maxVal) + 18}
          textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="var(--font-mono)">
          {yr}yr
        </text>
      ))}
      {allPoints.map((pts, i) => (
        <polyline key={i}
          points={toPolyline(pts, years, minVal, maxVal)}
          fill="none"
          stroke={COLORS[i % COLORS.length]}
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeOpacity="0.6"
          strokeLinejoin="round"
        />
      ))}
      <polyline
        points={toPolyline(blendedPoints, years, minVal, maxVal)}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={toX(years, years)}
        cy={toY(blendedPoints[years].value, minVal, maxVal)}
        r="5"
        fill="var(--gold)"
      />
    </svg>
  );
}

export default function AllocationPage() {
  const [slots, setSlots] = useState([
    { fundTicker: '', pct: 50 },
    { fundTicker: '', pct: 50 },
  ]);
  const [principal, setPrincipal] = useState(10000);
  const [years, setYears] = useState(10);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const totalPct = slots.reduce((s, r) => s + r.pct, 0);
  const isValid = totalPct === 100 && slots.every(r => r.fundTicker) && principal >= 100;

  function setSlot(i, key, val) {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
    setResult(null);
  }

  function addSlot() {
    if (slots.length >= 5) return;
    setSlots(prev => [...prev, { fundTicker: '', pct: 0 }]);
    setResult(null);
  }

  function removeSlot(i) {
    if (slots.length <= 2) return;
    setSlots(prev => prev.filter((_, idx) => idx !== i));
    setResult(null);
  }

  function handleCalculate() {
    if (!isValid) return;
    const allocations = slots.map(s => ({
      fund: FUNDS.find(f => f.ticker === s.fundTicker),
      pct: s.pct,
    }));
    setResult({ allocations, principal, years });
  }

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [result]);

  const availableFor = (i) =>
    FUNDS.filter(f => !slots.some((s, idx) => idx !== i && s.fundTicker === f.ticker));

  const pctColor = totalPct === 100 ? 'var(--green)' : totalPct > 100 ? 'var(--red)' : 'var(--gold)';

  let computedAllocations = [];
  let blendedFV = 0;
  if (result) {
    computedAllocations = result.allocations.map(a => {
      const invested = result.principal * (a.pct / 100);
      const rate = calcExpectedReturn(a.fund.beta);
      const fv = calcFutureValue(invested, rate, result.years);
      return { ...a, invested, rate, fv };
    });
    blendedFV = computedAllocations.reduce((s, a) => s + a.fv, 0);
  }

  const pct = ((years - 1) / (40 - 1)) * 100;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          Custom <span className={styles.accent}>Allocation</span>
        </h1>
        <p className={styles.subtitle}>Build a diversified portfolio from scratch. Assign percentages, pick your funds, and visualize the combined return over time.</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className="card-label">Fund Allocation</div>
            {slots.map((slot, i) => (
              <div key={i} className={styles.slotRow}>
                <div className={styles.slotColor} style={{ background: COLORS[i % COLORS.length] }} />
                <select
                  className={styles.select}
                  value={slot.fundTicker}
                  onChange={e => setSlot(i, 'fundTicker', e.target.value)}
                >
                  <option value="">— Choose fund —</option>
                  {availableFor(i).map(f => (
                    <option key={f.ticker} value={f.ticker}>{f.name} ({f.ticker})</option>
                  ))}
                </select>
                <div className={styles.pctWrapper}>
                  <input
                    type="number"
                    className={styles.pctInput}
                    min={0} max={100} step={5}
                    value={slot.pct}
                    onChange={e => setSlot(i, 'pct', Math.max(0, Math.min(100, Number(e.target.value))))}
                  />
                  <span className={styles.pctSymbol}>%</span>
                </div>
                {slots.length > 2 && (
                  <button className={styles.removeBtn} onClick={() => removeSlot(i)}>✕</button>
                )}
              </div>
            ))}
            <div className={styles.totalRow}>
              <div className={styles.totalBar}>
                {slots.map((s, i) => (
                  <div key={i} className={styles.totalSegment} style={{
                    width: `${s.pct}%`,
                    background: COLORS[i % COLORS.length],
                  }} />
                ))}
              </div>
              <span className={styles.totalLabel} style={{ color: pctColor }}>
                {totalPct}% {totalPct === 100 ? '✓' : totalPct > 100 ? '— over 100%' : `— ${100 - totalPct}% remaining`}
              </span>
            </div>
            {slots.length < 5 && (
              <button className={styles.addBtn} onClick={addSlot}>+ Add Fund</button>
            )}
          </div>

          <div className={styles.card}>
            <div className="card-label">Parameters</div>
            <div className={styles.field}>
              <label className={styles.label}>Initial Investment</label>
              <div className={styles.inputWrapper}>
                <span className={styles.prefix}>$</span>
                <input
                  type="number"
                  className={styles.input}
                  min={100} step={100}
                  value={principal}
                  onChange={e => { setPrincipal(Number(e.target.value)); setResult(null); }}
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
                onChange={e => { setYears(Number(e.target.value)); setResult(null); }}
              />
              <div className={styles.rangeLabels}>
                <span>1 yr</span><span>10 yrs</span><span>20 yrs</span><span>40 yrs</span>
              </div>
            </div>
            <button className={styles.calcBtn} onClick={handleCalculate} disabled={!isValid}>
              Project Blended Return
            </button>
            {!isValid && totalPct !== 100 && slots.every(s => s.fundTicker) && (
              <p className={styles.hint}>Allocations must sum to exactly 100%</p>
            )}
          </div>
        </div>

        <div className={styles.rightCol} ref={resultRef}>
          {!result ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◈</div>
              <p>Configure your allocation and click<br />Project Blended Return to see results.</p>
            </div>
          ) : (
            <div className={styles.results}>
              <div className={styles.resultCard}>
                <div className="card-label">Blended Portfolio Value</div>
                <div className={styles.bigNumber}>{formatCurrency(blendedFV)}</div>
                <div className={styles.subLine}>
                  Total gain:&nbsp;
                  <span style={{ color: 'var(--green)' }}>+{formatCurrency(blendedFV - result.principal)}</span>
                  &nbsp;·&nbsp;{result.years} years
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${Math.min((result.principal / blendedFV) * 100, 88)}%` }} />
                </div>
                <div className={styles.progressLabels}>
                  <span>{formatCurrency(result.principal)}</span>
                  <span style={{ color: 'var(--green)' }}>{formatCurrency(blendedFV)}</span>
                </div>
              </div>

              <div className={styles.resultCard}>
                <div className="card-label">Fund Breakdown</div>
                {computedAllocations.map((a, i) => (
                  <div key={a.fund.ticker} className={styles.fundRow}>
                    <div className={styles.fundHeader}>
                      <div className={styles.fundDot} style={{ background: COLORS[i % COLORS.length] }} />
                      <span className={styles.fundName}>{a.fund.name}</span>
                      <span className={styles.fundPct}>{a.pct}%</span>
                    </div>
                    <div className={styles.allocTrack}>
                      <div className={styles.allocBar} style={{ width: `${a.pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <div className={styles.fundMeta}>
                      <span>Invested: {formatCurrency(a.invested)}</span>
                      <span>β {a.fund.beta.toFixed(2)}</span>
                      <span>E(r) {formatPercent(a.rate)}</span>
                      <span style={{ color: 'var(--green)' }}>→ {formatCurrency(a.fv)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.resultCard}>
                <div className="card-label">Growth Projection</div>
                <div className={styles.legend}>
                  {computedAllocations.map((a, i) => (
                    <div key={a.fund.ticker} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{a.fund.ticker}</span>
                    </div>
                  ))}
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: 'var(--gold)', width: 24, borderRadius: 2, height: 3 }} />
                    <span>Blended</span>
                  </div>
                </div>
                <BlendedChart allocations={computedAllocations} principal={result.principal} years={result.years} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}