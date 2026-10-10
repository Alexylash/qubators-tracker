import { describe, expect, it } from 'vitest';
import { koboBalance, koboToNaira, nairaToKobo } from './format';

describe('nairaToKobo', () => {
  it('parses plain naira strings', () => {
    expect(nairaToKobo('45000')).toBe(4500000);
  });
  it('strips ₦, commas and spaces', () => {
    expect(nairaToKobo('₦45,000')).toBe(4500000);
    expect(nairaToKobo(' 12,500 ')).toBe(1250000);
  });
  it('handles decimals by rounding to kobo', () => {
    expect(nairaToKobo('99.99')).toBe(9999);
  });
  it('accepts numbers as naira', () => {
    expect(nairaToKobo(15000)).toBe(1500000);
  });
  it('rejects invalid and negative amounts', () => {
    expect(() => nairaToKobo('abc')).toThrow();
    expect(() => nairaToKobo('-500')).toThrow();
    expect(() => nairaToKobo('')).toThrow();
  });
});

describe('koboToNaira', () => {
  it('formats with ₦ and thousands separators', () => {
    expect(koboToNaira(4500000)).toBe('₦45,000');
    expect(koboToNaira(0)).toBe('₦0');
  });
  it('treats null/undefined as zero', () => {
    expect(koboToNaira(null)).toBe('₦0');
    expect(koboToNaira(undefined)).toBe('₦0');
  });
});

describe('koboBalance', () => {
  it('computes total minus paid', () => {
    expect(koboBalance(4500000, 2000000)).toBe(2500000);
    expect(koboBalance(1500000, 1500000)).toBe(0);
  });
});
