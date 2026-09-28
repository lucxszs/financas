import { describe, expect, it } from 'vitest';
import { impactoNaMeta, mesesParaJuntar, valorFuturo } from './simulacao';

describe('valorFuturo', () => {
  it('sem rendimento é só a soma', () => {
    expect(valorFuturo(500, 12, 0)).toBe(6000);
  });

  it('com rendimento, rende mais que a soma', () => {
    const v = valorFuturo(500, 36, 0.12);
    expect(v).toBeGreaterThan(18000);
    expect(v).toBeCloseTo(21_337.17, 2);
  });
});

describe('mesesParaJuntar', () => {
  it('arredonda para cima; sem aporte não há prazo', () => {
    expect(mesesParaJuntar(8217, 925)).toBe(9);
    expect(mesesParaJuntar(0, 0)).toBe(0);
    expect(mesesParaJuntar(100, 0)).toBeNull();
  });
});

describe('impactoNaMeta', () => {
  it('mostra quantos meses o extra adianta', () => {
    expect(impactoNaMeta(9250, 925, 1000, '2026-09')).toEqual({
      mesesAntes: 10,
      mesesDepois: 5,
      antes: '2027-07',
      depois: '2027-02',
      ganho: 5,
    });
  });
});
