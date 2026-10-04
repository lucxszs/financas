import { describe, expect, it } from 'vitest';
import { limiteGastos, resumoMes } from './resumo';
import { objetivosReserva, saudeFinanceira } from './saude';
import type { Aporte, Config, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  caixinhas: [
    { id: 'nubank', nome: 'Nubank', moeda: 'BRL', rendimento: '', cor: 'violet' },
    { id: 'mp', nome: 'Mercado Pago', moeda: 'BRL', rendimento: '', cor: 'sky' },
  ],
  objetivos: [
    {
      id: 'emerg1',
      nome: 'Emergência pt. 1',
      meta: 20000,
      caixinhas: ['nubank'],
      cor: 'emerald',
      aporteMensal: 266,
    },
    {
      id: 'bariloche',
      nome: 'Bariloche',
      meta: 10000,
      caixinhas: ['mp'],
      cor: 'violet',
      aporteMensal: 925,
      dataAlvo: '2027-01-01',
    },
  ],
  cartoes: [{ id: 'itau', nome: 'Itaú', limite: 5500, cor: 'amber', diaVencimento: 13 }],
};

let seq = 0;
const tx = (p: Partial<Transacao>): Transacao => ({
  id: `t${seq++}`,
  desc: 'x',
  val: 100,
  tipo: 'debito',
  cartao: null,
  cat: 'outro',
  data: '2026-09-08',
  mesFatura: null,
  obs: '',
  isEntrada: false,
  criadoEm: '',
  ...p,
});

const montar = (
  transacoes: Transacao[],
  aportes: Aporte[],
  valores: Record<string, number>,
  hoje: string,
) => {
  const resumo = resumoMes(transacoes, aportes, config, {}, hoje.slice(0, 7));
  const limite = limiteGastos(resumo, transacoes, config, {}, hoje);
  const itens = saudeFinanceira({ config, valores, cotacoes: {}, transacoes, aportes, resumo, limite, hoje });
  return Object.fromEntries(itens.map((i) => [i.id, i]));
};

const aporte = (caixinha: string, val: number, data: string): Aporte => ({
  id: `${caixinha}${data}`,
  caixinha,
  val,
  data,
  obs: '',
  criadoEm: '',
});

describe('objetivosReserva', () => {
  it('sem marcação, pega todos os objetivos com emergência/reserva no nome', () => {
    const duas = {
      ...config,
      objetivos: [...config.objetivos, { ...config.objetivos[0]!, id: 'emerg2', nome: 'Emergência pt. 2' }],
    };
    expect(objetivosReserva(duas).map((o) => o.id)).toEqual(['emerg1', 'emerg2']);
  });

  it('com marcação, usa só os marcados', () => {
    const marcado = {
      ...config,
      objetivos: [...config.objetivos, { ...config.objetivos[1]!, id: 'x', reservaEmergencia: true }],
    };
    expect(objetivosReserva(marcado).map((o) => o.id)).toEqual(['x']);
  });
});

describe('saudeFinanceira', () => {
  it('mês saudável: tudo verde', () => {
    const transacoes = [
      tx({ tipo: 'salario', val: 9000, isEntrada: true, data: '2026-09-05' }),
      tx({ val: 3000, data: '2026-08-10' }),
      tx({ val: 300 }),
      tx({ val: 1000, tipo: 'credito', cartao: 'itau', mesFatura: '2026-09' }),
    ];
    const aportes = [
      aporte('mp', 925, '2026-06-10'),
      aporte('mp', 925, '2026-07-10'),
      aporte('mp', 925, '2026-08-10'),
      aporte('mp', 925, '2026-09-10'),
      aporte('nubank', 266, '2026-09-10'),
    ];
    const s = montar(transacoes, aportes, { nubank: 20000, mp: 6300 }, '2026-09-12');
    expect(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.sinal]))).toEqual({
      gastos: 'verde',
      investimentos: 'verde',
      cartoes: 'verde',
      metas: 'verde',
      reserva: 'verde',
    });
    expect(s.reserva?.detalhe).toBe('cobre 6,7 meses de gastos');
  });

  it('sinaliza cada problema no seu indicador', () => {
    const transacoes = [
      tx({ val: 3000, data: '2026-08-10' }),
      tx({ val: 5000, tipo: 'credito', cartao: 'itau', mesFatura: '2026-10' }),
    ];
    // Média de gastos 3.000: reserva de 12.000 cobre 4 meses (amarelo).
    const s = montar(transacoes, [], { nubank: 12000, mp: 1000 }, '2026-09-20');
    expect(s.investimentos?.sinal).toBe('vermelho');
    expect(s.cartoes?.sinal).toBe('vermelho');
    expect(s.metas?.sinal).toBe('vermelho');
    expect(s.metas?.detalhe).toContain('Bariloche: faltam');
    expect(s.reserva?.sinal).toBe('amarelo');
  });

  it('até a metade do mês, não ter aportado ainda é amarelo', () => {
    const s = montar([], [], {}, '2026-09-05');
    expect(s.investimentos?.sinal).toBe('amarelo');
  });
});
