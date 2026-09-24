import { describe, expect, it } from 'vitest';
import { hojeIso, mesesAte, progressoTemporal, rotuloDataHora, rotuloMesCurto, somarMeses } from './datas';

describe('hojeIso', () => {
  it('usa o fuso local mesmo à noite', () => {
    expect(hojeIso(new Date(2026, 8, 24, 23, 30))).toBe('2026-09-24');
  });
});

describe('somarMeses', () => {
  it('vira o ano', () => {
    expect(somarMeses('2026-11', 3)).toBe('2027-02');
  });
});

describe('mesesAte', () => {
  it('nunca fica negativo', () => {
    expect(mesesAte(new Date(2026, 0, 1), new Date(2026, 5, 1))).toBe(0);
    expect(mesesAte(new Date(2027, 6, 1), new Date(2026, 8, 24))).toBe(10);
  });
});

describe('progressoTemporal', () => {
  it('fica entre 0 e 100', () => {
    const ini = new Date(2026, 0, 1);
    const fim = new Date(2026, 11, 31);
    expect(progressoTemporal(ini, fim, new Date(2025, 0, 1))).toBe(0);
    expect(progressoTemporal(ini, fim, new Date(2028, 0, 1))).toBe(100);
  });
});

describe('rotuloMesCurto', () => {
  it('formata mês/ano', () => {
    expect(rotuloMesCurto('2026-07')).toBe('Jul/26');
  });
});

describe('rotuloDataHora', () => {
  it('formata a data da AwesomeAPI', () => {
    expect(rotuloDataHora('2026-09-24 13:53:12')).toBe('24/09/2026 às 13:53');
  });

  it('devolve o texto original se o formato for outro', () => {
    expect(rotuloDataHora('ontem')).toBe('ontem');
  });
});
