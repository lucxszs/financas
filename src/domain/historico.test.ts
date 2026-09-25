import { describe, expect, it } from 'vitest';
import { orcamentoPorCategoria, serieMensal } from './historico';
import type { Config, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  taxaAnualEstimada: 0.12,
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
      taxaPoupanca: (1000 / 9000) * 100,
      patrimonio: 6300,
    });
    expect(serie[0]?.patrimonio).toBeNull();
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
