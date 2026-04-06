import React, { useState } from 'react';
import Header from './components/Header/Header';
import CalculatorPage from './components/CalculatorPage/CalculatorPage';
import AllocationPage from './components/AllocationPage/AllocationPage';
import ReportPage from './components/ReportPage/ReportPage';
import WhatIfPage from './components/WhatIfPage/WhatIfPage';
import AIFeature from './components/AIFeature/AIFeature';
import Glossary from './components/Glossary/Glossary';

export default function App() {
  const [page, setPage] = useState('calculator');
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <>
      <Header page={page} onNavigate={setPage} onGlossary={() => setGlossaryOpen(true)}/>

      <Glossary isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)}/>

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