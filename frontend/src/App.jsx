import React from 'react';
import Header from './components/Header/Header';
import CalculatorPage from './components/CalculatorPage/CalculatorPage';

export default function App() {
  return (
    <>
      <Header />
      <main className="main-content">
        <CalculatorPage />
      </main>
    </>
  );
}