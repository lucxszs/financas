import { describe, expect, it } from 'vitest';
import { orcamentoPorCategoria, orcamentoSugerido, serieMensal } from './historico';
import type { Config, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  caixinhas: [{ id: 'reserva', nome: 'Reserva', moeda: 'BRL', rendimento: '', cor: 'emerald' }],
  objetivos: [],
  cartoes: [],
  orcamentos: { alimentacao: 900, lazer: 500, transporte: 500, vestuario: 300 },
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

describe('serieMensal', () => {
  it('um item por mês, do mais antigo ao atual, com patrimônio só onde há foto', () => {
    const transacoes = [
      tx({ tipo: 'salario', val: 9000, isEntrada: true, data: '2026-08-05' }),
      tx({ val: 5400, data: '2026-08-10' }),
    ];
    const aportes = [{ id: 'a', caixinha: 'reserva', val: 1000, data: '2026-08-10', obs: '', criadoEm: '' }];
    const snapshots = [{ mes: '2026-08', valores: { reserva: 6300 } }];
    const serie = serieMensal(transacoes, aportes, snapshots, config, {}, '2026-09', 3);

    expect(serie.map((l) => l.mes)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(serie[1]).toEqual({
      mes: '2026-08',
      renda: 9000,
      rendaPrevista: false,
      gastos: 5400,
      investimentos: 1000,
      saldo: 2600,
      patrimonio: 6300,
      fechado: false,
    });
    expect(serie[0]?.patrimonio).toBeNull();
  });
});

describe('serieMensal com fechamento', () => {
  it('mês fechado usa a foto imutável, mesmo que os lançamentos mudem depois', () => {
    const fechamento = {
      mes: '2026-08',
      fechadoEm: '',
      renda: 9000,
      rendaPrevista: false,
      gastos: 5000,
      investimentos: 1191,
      saldo: 2809,
      maiorCategoria: null,
      maiorGasto: null,
      aportesPorMeta: [],
      patrimonio: 6890,
      variacaoPatrimonio: null,
    };
    const depois = [tx({ val: 999, data: '2026-08-20' })];
    const [ago] = serieMensal(depois, [], [], config, {}, '2026-08', 1, [fechamento]);
    expect(ago).toMatchObject({ gastos: 5000, patrimonio: 6890, fechado: true });
  });
});

describe('orcamentoPorCategoria', () => {
  it('real × meta com status, incluindo categoria orçada sem gasto', () => {
    const transacoes = [
      tx({ cat: 'alimentacao', val: 1020 }),
      tx({ cat: 'lazer', val: 380 }),
      tx({ cat: 'transporte', val: 540 }),
      tx({ cat: 'mercado', val: 200 }),
      tx({ cat: 'lazer', val: 50, data: '2026-08-30' }), // outro mês
    ];
    const linhas = orcamentoPorCategoria(transacoes, config, '2026-09');
    expect(linhas.map((l) => [l.cat, l.real, l.meta, l.status])).toEqual([
      ['alimentacao', 1020, 900, 'estourou'],
      ['transporte', 540, 500, 'atencao'],
      ['lazer', 380, 500, 'ok'],
      ['mercado', 200, null, null],
      ['vestuario', 0, 300, 'ok'],
    ]);
  });
});

describe('orcamentoSugerido', () => {
  it('média por categoria dos meses anteriores com lançamentos, arredondada para cima de 10 em 10', () => {
    const transacoes = [
      tx({ cat: 'mercado', val: 396, data: '2026-07-20' }),
      tx({ cat: 'mercado', val: 646, data: '2026-08-20' }),
      tx({ cat: 'lazer', val: 45, data: '2026-08-20' }),
      tx({ cat: 'mercado', val: 999, data: '2026-09-20' }), // mês de referência: fora
      tx({ tipo: 'salario', val: 12000, isEntrada: true, data: '2026-08-15' }),
    ];
    const r = orcamentoSugerido(transacoes, '2026-09');
    expect(r.meses).toEqual(['2026-08', '2026-07']);
    expect(r.sugestao).toEqual({ mercado: 530, lazer: 30 });
  });

  it('sem histórico, sem sugestão', () => {
    expect(orcamentoSugerido([], '2026-09')).toEqual({ sugestao: {}, meses: [] });
  });
});
