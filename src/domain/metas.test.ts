import { describe, expect, it } from 'vitest';
import { ritmoObjetivo } from './metas';
import type { Aporte, Config, Objetivo } from './types';

const bariloche: Objetivo = {
  id: 'bariloche',
  nome: 'Bariloche',
  meta: 10000,
  caixinhas: ['mp'],
  cor: 'violet',
  aporteMensal: 925,
  dataInicio: '2026-01-01',
  dataAlvo: '2027-01-01',
};

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  caixinhas: [{ id: 'mp', nome: 'Mercado Pago', moeda: 'BRL', rendimento: '', cor: 'sky' }],
  objetivos: [bariloche],
  cartoes: [],
};

const aporte = (data: string, val = 900): Aporte => ({
  id: data,
  caixinha: 'mp',
  val,
  data,
  obs: '',
  criadoEm: '',
});

describe('ritmoObjetivo', () => {
  it('necessário × atual (média dos 3 meses anteriores) e a diferença', () => {
    const aportes = [
      aporte('2026-06-10'),
      aporte('2026-07-10'),
      aporte('2026-08-10'),
      aporte('2026-09-10', 5000),
    ];
    const r = ritmoObjetivo(bariloche, config, { mp: 6400 }, {}, aportes, '2026-09-15');
    expect(r).toMatchObject({
      guardado: 6400,
      faltam: 3600,
      mesesRestantes: 4,
      necessarioMes: 900,
      atualMes: 900,
      fonteAtual: 'aportes',
      diferenca: 0,
      previsao: '2027-01',
    });
    expect(r.pctTemporal).toBeGreaterThan(70);
  });

  it('abaixo do ritmo dá diferença negativa', () => {
    const aportes = [aporte('2026-07-10', 2700)]; // média 900 nos 3 meses
    const r = ritmoObjetivo(bariloche, config, { mp: 6300 }, {}, aportes, '2026-09-15');
    expect(r.necessarioMes).toBe(925);
    expect(r.diferenca).toBe(-25);
  });

  it('sem aportes recentes usa o aporte planejado', () => {
    const r = ritmoObjetivo(bariloche, config, { mp: 1000 }, {}, [], '2026-09-15');
    expect(r).toMatchObject({ atualMes: 925, fonteAtual: 'planejado', previsao: '2027-07' });
  });

  it('sem data alvo não há necessário; sem ritmo não há previsão', () => {
    const semData: Objetivo = {
      ...bariloche,
      dataAlvo: undefined,
      dataInicio: undefined,
      aporteMensal: undefined,
    };
    const r = ritmoObjetivo(semData, config, { mp: 1000 }, {}, [], '2026-09-15');
    expect(r).toMatchObject({ necessarioMes: null, diferenca: null, previsao: null, pctTemporal: null });
  });

  it('meta concluída', () => {
    const r = ritmoObjetivo(bariloche, config, { mp: 10000 }, {}, [], '2026-09-15');
    expect(r).toMatchObject({ concluido: true, necessarioMes: null, previsao: '2026-09' });
  });
});
