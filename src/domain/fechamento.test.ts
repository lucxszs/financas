import { describe, expect, it } from 'vitest';
import { mesParaFechar, montarFechamento, type DadosFechamento } from './fechamento';
import type { Config, FechamentoMes, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  taxaAnualEstimada: 0.12,
  caixinhas: [
    { id: 'nubank', nome: 'Nubank', moeda: 'BRL', rendimento: '', cor: 'violet' },
    { id: 'mp', nome: 'Mercado Pago', moeda: 'BRL', rendimento: '', cor: 'sky' },
  ],
  objetivos: [
    { id: 'emerg', nome: 'Emergência', meta: 10000, caixinhas: ['nubank'], cor: 'emerald' },
    { id: 'bariloche', nome: 'Bariloche', emoji: '✈️', meta: 10000, caixinhas: ['mp'], cor: 'violet' },
  ],
  cartoes: [],
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

const base = (extra: Partial<DadosFechamento> = {}): DadosFechamento => ({
  transacoes: [
    tx({ tipo: 'salario', val: 9000, isEntrada: true, data: '2026-09-05' }),
    tx({ desc: 'Fatura Itaú', val: 2840, cat: 'outro' }),
    tx({ desc: 'Mercado', val: 1240, cat: 'alimentacao' }),
    tx({ desc: 'Restaurante', val: 300, cat: 'alimentacao' }),
  ],
  aportes: [
    { id: 'a', caixinha: 'mp', val: 925, data: '2026-09-10', obs: '', criadoEm: '' },
    { id: 'b', caixinha: 'nubank', val: 266, data: '2026-09-10', obs: '', criadoEm: '' },
  ],
  snapshots: [{ mes: '2026-08', valores: { nubank: 5576 } }],
  fechamentos: [],
  config,
  cotacoes: {},
  patrimonioAgora: 6890,
  hoje: '2026-09-30',
  ...extra,
});

describe('montarFechamento', () => {
  it('resume o mês com maior categoria, maior gasto, aportes por meta e variação do patrimônio', () => {
    const f = montarFechamento('2026-09', base(), 'agora');
    expect(f).toEqual({
      mes: '2026-09',
      fechadoEm: 'agora',
      renda: 9000,
      rendaPrevista: false,
      gastos: 4380,
      investimentos: 1191,
      saldo: 3429,
      taxaPoupanca: (1191 / 9000) * 100,
      maiorCategoria: { cat: 'outro', valor: 2840 },
      maiorGasto: { desc: 'Fatura Itaú', valor: 2840 },
      aportesPorMeta: [
        { objetivoId: 'emerg', nome: 'Emergência', valor: 266 },
        { objetivoId: 'bariloche', nome: 'Bariloche', emoji: '✈️', valor: 925 },
      ],
      patrimonio: 6890,
      variacaoPatrimonio: 1314,
    });
  });

  it('mês passado usa a foto daquele mês; sem foto, patrimônio desconhecido', () => {
    const f = montarFechamento('2026-08', base({ hoje: '2026-09-02' }), 'agora');
    expect(f.patrimonio).toBe(5576);
    expect(f.variacaoPatrimonio).toBeNull();
  });
});

describe('mesParaFechar', () => {
  const fechado = (mes: string) => ({ mes }) as FechamentoMes;

  it('sugere o mês anterior aberto que teve movimento', () => {
    const d = { transacoes: [tx({ data: '2026-08-10' })], aportes: [], fechamentos: [] };
    expect(mesParaFechar(d, '2026-09-15')).toBe('2026-08');
  });

  it('mês atual só no último dia', () => {
    const d = { transacoes: [], aportes: [], fechamentos: [] };
    expect(mesParaFechar(d, '2026-09-29')).toBeNull();
    expect(mesParaFechar(d, '2026-09-30')).toBe('2026-09');
  });

  it('nada a fechar quando já está fechado', () => {
    const d = {
      transacoes: [tx({ data: '2026-08-10' })],
      aportes: [],
      fechamentos: [fechado('2026-08'), fechado('2026-09')],
    };
    expect(mesParaFechar(d, '2026-09-30')).toBeNull();
  });
});
