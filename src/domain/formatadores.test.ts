import { describe, expect, it } from 'vitest';
import { fmt, formatarMoeda } from './formatadores';

// Intl usa espaço não separável entre símbolo e número.
const normalizar = (s: string) => s.replace(/\s/g, ' ');

describe('fmt', () => {
  it('usa 2 casas decimais com vírgula (inclusive cotações)', () => {
    expect(normalizar(fmt(5.1877))).toBe('R$ 5,19');
    expect(normalizar(fmt(5.3))).toBe('R$ 5,30');
    expect(normalizar(fmt(12345.6))).toBe('R$ 12.345,60');
  });
});

describe('formatarMoeda', () => {
  it('formata moedas estrangeiras', () => {
    expect(normalizar(formatarMoeda(19.19, 'USD'))).toBe('$19.19');
    expect(normalizar(formatarMoeda(10, 'EUR'))).toContain('10,00');
  });
});
