import { describe, expect, it } from 'vitest';
import { codigoBandeira } from './bandeiras';

describe('codigoBandeira', () => {
  it('reconhece bandeiras emoji e ignora o resto', () => {
    expect(codigoBandeira('🇦🇷')).toBe('AR');
    expect(codigoBandeira(' 🇺🇸 ')).toBe('US');
    expect(codigoBandeira('🎯')).toBeNull();
    expect(codigoBandeira('')).toBeNull();
    expect(codigoBandeira(undefined)).toBeNull();
  });
});
