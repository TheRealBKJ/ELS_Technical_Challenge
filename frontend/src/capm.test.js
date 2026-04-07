import { describe, expect, it } from 'vitest';

import {
  calcExpectedReturn,
  calcFutureValue,
  formatCurrency,
  formatPercent,
} from './capm';
import { MARKET_RETURN, RISK_FREE_RATE } from './funds';

describe('capm utilities', () => {
  it('calculates expected return using CAPM', () => {
    const beta = 1.1;
    const expected = RISK_FREE_RATE + beta * (MARKET_RETURN - RISK_FREE_RATE);

    expect(calcExpectedReturn(beta)).toBeCloseTo(expected, 10);
  });

  it('calculates future value using compound growth', () => {
    expect(calcFutureValue(1000, 0.1, 2)).toBeCloseTo(1210, 10);
  });

  it('formats currency as rounded USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
  });

  it('formats rates as percentages', () => {
    expect(formatPercent(0.085)).toBe('8.50%');
    expect(formatPercent(0.085, 1)).toBe('8.5%');
  });
});
