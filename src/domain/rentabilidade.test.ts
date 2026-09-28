import { describe, expect, it } from 'vitest';
import { acumulado, rentabilidadeCaixinhas, totalRentabilidade } from './rentabilidade';
import type { Config, Snapshot } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  taxaAnualEstimada: 0.12,
  caixinhas: [
    { id: 'nubank', nome: 'Nubank', moeda: 'BRL', rendimento: '', cor: 'violet' },
    { id: 'mp', nome: 'Mercado Pago', moeda: 'BRL', rendimento: '', cor: 'sky' },
    { id: 'wise', nome: 'Wise', moeda: 'USD', rendimento: '', cor: 'amber' },
    { id: 'conta', nome: 'Conta', moeda: 'BRL', rendimento: '', cor: 'coral', tipo: 'conta' },
  ],
  objetivos: [],
  cartoes: [],
};

describe('rentabilidadeCaixinhas', () => {
  // Depósitos não lançados como aporte (ex.: MP de 0 para 1.654) não viram rendimento.
  const snapshots: Snapshot[] = [
    { mes: '2026-05', valores: { nubank: 3429 }, rendimentos: { nubank: 57 } },
    { mes: '2026-06', valores: { nubank: 5060, mp: 1637 }, rendimentos: { nubank: 63 } },
    { mes: '2026-08', valores: { nubank: 5229, mp: 1654, wise: 19.19 }, rendimentos: { nubank: 80, mp: 17 } },
    { mes: '2026-02', valores: { nubank: 2003 } },
  ];
  const itens = rentabilidadeCaixinhas(config, { nubank: 5310, mp: 1690, wise: 19.2 }, snapshots, { USD: 5 });

  it('soma só os rendimentos informados; ignora contas', () => {
    expect(itens.map((i) => i.caixinha.id)).toEqual(['nubank', 'mp', 'wise']);
    expect(itens[0]).toMatchObject({ inicio: '2026-05', meses: 3, rendimento: 200, investido: 5110 });
    expect(itens[0]!.pct).toBeCloseTo(3.91, 2);
    expect(itens[1]).toMatchObject({ inicio: '2026-08', rendimento: 17, investido: 1673 });
  });

  it('sem rendimento informado não inventa rentabilidade', () => {
    expect(itens[2]).toMatchObject({ inicio: null, meses: 0, rendimento: 0, pct: null });
  });

  it('total em BRL com alocação por caixinha', () => {
    const t = totalRentabilidade(itens, { USD: 5 });
    expect(t).toMatchObject({ atual: 7096, rendimento: 217, inicio: '2026-05' });
    expect(t.alocacao.nubank).toBeCloseTo(74.83, 2);
  });
});

describe('acumulado', () => {
  it('compõe mês a mês no intervalo e diz até onde havia dado', () => {
    const cdi = [
      { mes: '2026-06', valor: 1 },
      { mes: '2026-07', valor: 1 },
      { mes: '2026-08', valor: 1 },
    ];
    const r = acumulado(cdi, '2026-07', '2026-09');
    expect(r?.pct).toBeCloseTo(2.01, 2);
    expect(r).toMatchObject({ ate: '2026-08', meses: 2 });
    expect(acumulado(cdi, '2027-01', '2027-02')).toBeNull();
  });
});
