import { describe, expect, it } from 'vitest';
import { impactoNaMeta, mesesParaJuntar } from './simulacao';

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
