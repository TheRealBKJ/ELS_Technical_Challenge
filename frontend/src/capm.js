import { RISK_FREE_RATE, MARKET_RETURN } from './funds';

/**
 * Calculate the expected return using the Capital Asset Pricing Model.
 * E(r) = Rf + β × (Rm − Rf)
 *
 * @param {number} beta - Fund beta coefficient
 * @returns {number} Expected annual return as a decimal (e.g. 0.085 = 8.5%)
 */
export function calcExpectedReturn(beta) {
  return RISK_FREE_RATE + beta * (MARKET_RETURN - RISK_FREE_RATE);
}

/**
 * Calculate the future value of an investment using compound interest.
 * FV = PV × (1 + r)^t
 *
 * @param {number} principal - Initial investment amount in USD
 * @param {number} annualRate - Annual return rate as a decimal
 * @param {number} years - Investment time horizon in years
 * @returns {number} Future value in USD
 */
export function calcFutureValue(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate, years);
}

/**
 * Format a number as a USD currency string.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-US');
}

/**
 * Format a decimal rate as a percentage string.
 * @param {number} rate - e.g. 0.085
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(rate, decimals = 2) {
  return (rate * 100).toFixed(decimals) + '%';
}