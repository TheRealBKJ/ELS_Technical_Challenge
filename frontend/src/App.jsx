import React, { useState } from 'react';
import Header from './components/Header/Header';
import CalculatorPage from './components/CalculatorPage/CalculatorPage';
import AllocationPage from './components/AllocationPage/AllocationPage';
import ReportPage from './components/ReportPage/ReportPage';
import WhatIfPage from './components/WhatIfPage/WhatIfPage';
import AIFeature from './components/AIFeature/AIFeature';

export default function App() {
  const [page, setPage] = useState('calculator');

  return (
    <>
      <Header page={page} onNavigate={setPage} />
      <main className="main-content">
        {page === 'calculator' && <CalculatorPage />}
        {page === 'allocation' && <AllocationPage />}
        {page === 'report'     && <ReportPage />}
        {page === 'whatif'     && <WhatIfPage />}
        {page === 'ai'         && <AIFeature />}
      </main>
    </>
  );
}