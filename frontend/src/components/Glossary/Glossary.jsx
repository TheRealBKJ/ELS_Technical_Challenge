import React, { useState, useEffect } from 'react';
import styles from './Glossary.module.css';

const TERMS = [
  {
    term: 'Mutual Fund',
    simple: 'A pool of money from many investors used to buy a mix of stocks or bonds.',
    detail: 'Instead of picking individual stocks yourself, you invest in a fund managed by professionals. Your money is spread across many companies, which reduces risk.',
  },
  {
    term: 'Beta (β)',
    simple: 'A measure of how much a fund moves compared to the overall market.',
    detail: 'A beta of 1.0 means the fund moves exactly with the market. A beta of 1.2 means it moves 20% more — higher potential gains but also higher potential losses. A beta of 0.7 means it\'s calmer than the market.',
  },
  {
    term: 'CAPM',
    simple: 'A formula that calculates the expected return of an investment based on its risk.',
    detail: 'CAPM stands for Capital Asset Pricing Model. It says: the riskier the investment (higher beta), the higher the return should be to compensate. Formula: E(r) = Rf + β × (Rm − Rf).',
  },
  {
    term: 'Expected Return E(r)',
    simple: 'The annual return you can reasonably expect from a fund based on its risk level.',
    detail: 'Calculated using CAPM. It\'s not a guarantee — it\'s an estimate based on historical patterns. A higher expected return usually comes with higher risk.',
  },
  {
    term: 'Risk-Free Rate (Rf)',
    simple: 'The return you\'d get from the safest possible investment — US Treasury bonds.',
    detail: 'Currently set at 4.50%. This is the baseline: any investment should ideally return more than this, otherwise why take on extra risk?',
  },
  {
    term: 'Market Return (Rm)',
    simple: 'The average annual return of the overall stock market (S&P 500).',
    detail: 'Currently set at 10.50%. This is the benchmark — funds are compared against this to see if they\'re beating or underperforming the market.',
  },
  {
    term: 'Future Value (FV)',
    simple: 'How much your investment will be worth after a set number of years.',
    detail: 'Calculated as FV = P × (1 + r)^t, where P is your initial investment, r is the expected annual return, and t is the number of years. This accounts for compound growth — earning returns on your returns.',
  },
  {
    term: 'Principal',
    simple: 'The amount of money you invest at the start.',
    detail: 'This is your initial investment before any growth. For example, if you invest $10,000 today, that $10,000 is your principal.',
  },
  {
    term: 'Risk Tolerance',
    simple: 'How comfortable you are with the possibility of losing money in the short term.',
    detail: 'Low risk = you want steady, predictable growth even if it\'s slower. High risk = you\'re okay with ups and downs in exchange for potentially higher long-term returns.',
  },
  {
    term: 'Time Horizon',
    simple: 'How many years you plan to keep your money invested before needing it.',
    detail: 'Longer horizons allow more risk because you have time to recover from market downturns. Short horizons (1–5 years) call for safer investments since there\'s less time to recover losses.',
  },
  {
    term: 'Diversification',
    simple: 'Spreading your money across different investments to reduce risk.',
    detail: 'Instead of putting all your money in one fund, you split it across several. If one performs poorly, the others can offset the loss. The phrase "don\'t put all your eggs in one basket."',
  },
  {
    term: 'Portfolio',
    simple: 'The complete collection of investments you hold.',
    detail: 'Your portfolio might include multiple mutual funds with different risk levels and goals. The mix you choose determines your overall risk and expected return.',
  },
  {
    term: 'Weighted-Average Beta',
    simple: 'The overall risk level of your portfolio, accounting for how much you\'ve put in each fund.',
    detail: 'If you put 60% in a fund with beta 1.0 and 40% in a fund with beta 0.7, your weighted-average beta is 0.88. This gives you one number to describe your whole portfolio\'s risk.',
  },
];

export default function GlossaryModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Filter terms by search
  const filtered = TERMS.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.simple.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    // Clicking the dark backdrop closes the modal
    <div className={styles.backdrop} onClick={onClose}>

      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Financial Glossary</h2>
            <p className={styles.modalSubtitle}>Plain-English definitions for every term in this app</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search terms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.termsList}>
          {filtered.length === 0 && (
            <p className={styles.noResults}>No terms match "{search}"</p>
          )}
          {filtered.map(t => (
            <div key={t.term} className={styles.termItem}>
              <div className={styles.termName}>{t.term}</div>
              <div className={styles.termSimple}>{t.simple}</div>
              <div className={styles.termDetail}>{t.detail}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}