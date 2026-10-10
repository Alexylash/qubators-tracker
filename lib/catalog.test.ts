import { describe, expect, it } from 'vitest';
import { splitVariations } from './queries';

describe('splitVariations', () => {
  it('splits comma lists and trims', () => {
    expect(splitVariations('S,M,L,XL')).toEqual(['S', 'M', 'L', 'XL']);
    expect(splitVariations(' S , , M ')).toEqual(['S', 'M']);
  });
  it('handles null/empty', () => {
    expect(splitVariations(null)).toEqual([]);
    expect(splitVariations('')).toEqual([]);
    expect(splitVariations(undefined)).toEqual([]);
  });
});
