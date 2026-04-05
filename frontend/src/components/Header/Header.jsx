import React from 'react';
import styles from './Header.module.css';

const NAV = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'allocation', label: 'Portfolio Builder' },
  { id: 'report',     label: 'Projection Report' },
  { id: 'whatif',     label: 'Scenario Lab' },
  { id: 'ai',         label: 'AI Advisor' },
];

export default function Header({ page, onNavigate, onGlossary }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoMark} />
        Mutual Fund Calculator
      </div>
      <nav className={styles.nav}>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`${styles.navLink} ${page === n.id ? styles.active : ''}`}
            onClick={() => onNavigate(n.id)}
          >
            {n.label}
          </button>
        ))}
        <button className={styles.glossaryBtn} onClick={onGlossary} title="Glossary">?</button>
      </nav>
    </header>
  );
}