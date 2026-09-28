import { describe, expect, it } from 'vitest';
import { lerSerieSgs } from './indicadores';

describe('lerSerieSgs', () => {
  it('converte data dd/MM/yyyy em mês e valor em número, ignorando lixo', () => {
    const json = [
      { data: '01/08/2026', valor: '1.09' },
      { data: '01/09/2026', valor: '-0.32' },
      { data: 'x', valor: '1' },
      { data: '01/10/2026', valor: 'abc' },
    ];
    expect(lerSerieSgs(json)).toEqual([
      { mes: '2026-08', valor: 1.09 },
      { mes: '2026-09', valor: -0.32 },
    ]);
    expect(lerSerieSgs(null)).toEqual([]);
  });
});
