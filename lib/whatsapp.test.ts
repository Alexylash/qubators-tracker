import { describe, expect, it } from 'vitest';
import { toWaNumber, waLink } from './whatsapp';

describe('toWaNumber', () => {
  it('converts 0-prefixed NG numbers to 234', () => {
    expect(toWaNumber('08031234567')).toBe('2348031234567');
  });
  it('keeps 234 numbers and strips +', () => {
    expect(toWaNumber('2348031234567')).toBe('2348031234567');
    expect(toWaNumber('+2348031234567')).toBe('2348031234567');
  });
  it('strips spaces and dashes', () => {
    expect(toWaNumber('0803 123-4567')).toBe('2348031234567');
  });
  it('returns null for empty input', () => {
    expect(toWaNumber(null)).toBeNull();
    expect(toWaNumber('')).toBeNull();
    expect(toWaNumber(undefined)).toBeNull();
  });
});

describe('waLink', () => {
  it('builds a wa.me link with encoded text', () => {
    const link = waLink('08031234567', 'Hello Ada');
    expect(link).toBe('https://wa.me/2348031234567?text=Hello%20Ada');
  });
  it('returns null without a phone', () => {
    expect(waLink(null, 'hi')).toBeNull();
  });
});
