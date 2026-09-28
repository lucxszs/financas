import { describe, expect, it } from 'vitest';
import { acumulado, rentabilidadeCaixinhas, totalRentabilidade } from './rentabilidade';
import type { Aporte, Config, Snapshot } from './types';

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

const aporte = (caixinha: string, val: number, data: string): Aporte => ({
  id: `${caixinha}${data}`,
  caixinha,
  val,
  data,
  obs: '',
  criadoEm: '',
});

describe('rentabilidadeCaixinhas', () => {
  const snapshots: Snapshot[] = [
    { mes: '2026-07', valores: { nubank: 4000, wise: 20 } },
    { mes: '2026-06', valores: { nubank: 3900 } },
  ];
  const aportes = [
    aporte('nubank', 500, '2026-06-10'), // antes/na primeira foto: já está na base
    aporte('nubank', 1000, '2026-07-10'),
    aporte('nubank', 266, '2026-08-10'),
    aporte('mp', 1500, '2026-08-10'),
  ];
  const itens = rentabilidadeCaixinhas(config, { nubank: 5307, mp: 1684, wise: 20 }, snapshots, aportes, {
    USD: 5,
  });

  it('base = primeira foto; soma só os aportes dos meses seguintes; ignora contas', () => {
    expect(itens.map((i) => i.caixinha.id)).toEqual(['nubank', 'mp', 'wise']);
    expect(itens[0]).toMatchObject({
      inicio: '2026-06',
      base: 3900,
      aportes: 1266,
      investido: 5166,
      rendimento: 141,
    });
    expect(itens[0]!.pct).toBeCloseTo(2.73, 2);
  });

  it('sem foto, a base é zero e contam todos os aportes', () => {
    expect(itens[1]).toMatchObject({ inicio: null, base: 0, investido: 1500, rendimento: 184 });
  });

  it('total em BRL com alocação por caixinha', () => {
    const t = totalRentabilidade(itens, { USD: 5 });
    expect(t).toMatchObject({ investido: 6766, atual: 7091, rendimento: 325, inicio: '2026-06' });
    expect(t.alocacao.nubank).toBeCloseTo(74.84, 2);
    expect(t.alocacao.wise).toBeCloseTo(1.41, 2);
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
