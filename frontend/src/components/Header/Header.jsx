import React from 'react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoMark} />
        Mutual Fund Calculator
      </div>
      <nav className={styles.nav}>
        <a href="#link1">additional</a>
        <a href="#link2">features?</a>
        <a href="#link3">goals?</a>
      </nav>
    </header>
  );
}