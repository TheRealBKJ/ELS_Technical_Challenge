// Hardcoded mutual fund data
export const FUNDS = [
  { ticker: 'VFINX', name: 'Vanguard 500 Index Fund',          beta: 1.00 },
  { ticker: 'FXAIX', name: 'Fidelity 500 Index Fund',          beta: 1.01 },
  { ticker: 'AGTHX', name: 'American Funds Growth Fund',       beta: 1.10 },
  { ticker: 'VTSMX', name: 'Vanguard Total Stock Market',      beta: 1.00 },
  { ticker: 'PRGFX', name: 'T. Rowe Price Growth Stock',       beta: 1.15 },
  { ticker: 'FCNTX', name: 'Fidelity Contrafund',              beta: 1.08 },
  { ticker: 'ANCFX', name: 'American Funds Fundamental',       beta: 0.95 },
  { ticker: 'VWELX', name: 'Vanguard Wellington Fund',         beta: 0.72 },
  { ticker: 'DODFX', name: 'Dodge & Cox International',        beta: 0.90 },
];

// CAPM constants (hardcoded).
export const RISK_FREE_RATE = 0.0408;
export const MARKET_RETURN  = 0.105;
