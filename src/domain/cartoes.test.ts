import { describe, expect, it } from 'vitest';
import { mesFaturaSugerido } from './cartoes';
import type { Cartao } from './types';

const cartao = (melhorDiaCompra?: number, diaVencimento?: number): Cartao => ({
  id: 'c',
  nome: 'Cartão',
  limite: 1000,
  cor: 'amber',
  melhorDiaCompra,
  diaVencimento,
});

describe('mesFaturaSugerido', () => {
  it('melhor dia 04, vence 13: antes do melhor dia fica no mês, a partir dele vai para o seguinte', () => {
    const c = cartao(4, 13);
    expect(mesFaturaSugerido(c, '2026-10-03')).toBe('2026-10');
    expect(mesFaturaSugerido(c, '2026-10-04')).toBe('2026-11');
    expect(mesFaturaSugerido(c, '2026-10-05')).toBe('2026-11');
  });

  it('melhor dia 09, vence 15', () => {
    const c = cartao(9, 15);
    expect(mesFaturaSugerido(c, '2026-10-08')).toBe('2026-10');
    expect(mesFaturaSugerido(c, '2026-10-09')).toBe('2026-11');
  });

  it('melhor dia 12, vence 16', () => {
    const c = cartao(12, 16);
    expect(mesFaturaSugerido(c, '2026-10-11')).toBe('2026-10');
    expect(mesFaturaSugerido(c, '2026-10-12')).toBe('2026-11');
  });

  it('vencimento antes do melhor dia no calendário (fecha 28, vence 05) soma um mês', () => {
    const c = cartao(29, 5);
    expect(mesFaturaSugerido(c, '2026-10-10')).toBe('2026-11');
    expect(mesFaturaSugerido(c, '2026-10-29')).toBe('2026-12');
  });

  it('vira o ano', () => {
    expect(mesFaturaSugerido(cartao(4, 13), '2026-12-20')).toBe('2027-01');
  });

  it('sem melhor dia cadastrado não sugere', () => {
    expect(mesFaturaSugerido(cartao(), '2026-10-10')).toBeNull();
  });
});
