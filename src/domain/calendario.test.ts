import { describe, expect, it } from 'vitest';
import { eventosDoPeriodo, saldoPrevisto } from './calendario';
import type { Config, Recorrente, Transacao } from './types';

const rec = (p: Partial<Recorrente> & { id: string }): Recorrente =>
  ({
    tipo: 'transacao',
    desc: p.id,
    val: 100,
    dia: 5,
    ativo: true,
    inicio: '2026-01',
    tipoTransacao: 'pix',
    cat: 'moradia',
    cartao: null,
    ...p,
  }) as Recorrente;

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  taxaAnualEstimada: 0.12,
  caixinhas: [{ id: 'mp', nome: 'Mercado Pago', moeda: 'BRL', rendimento: '', cor: 'sky' }],
  objetivos: [],
  cartoes: [{ id: 'itau', nome: 'Itaú', limite: 5500, cor: 'amber', diaVencimento: 13 }],
  recorrentes: [
    rec({
      id: 'salario',
      desc: 'Salário',
      val: 9000,
      dia: 5,
      tipoTransacao: 'salario',
      lancadoAte: '2026-09',
    }),
    rec({ id: 'contas', desc: 'Contas', val: 900, dia: 8 }),
    rec({ id: 'streaming', val: 45, dia: 9, tipoTransacao: 'credito', cartao: 'itau' }),
    {
      id: 'bariloche',
      tipo: 'aporte',
      desc: 'Bariloche',
      val: 925,
      dia: 10,
      ativo: true,
      inicio: '2026-01',
      caixinha: 'mp',
    },
    rec({ id: 'pausada', ativo: false, dia: 6 }),
  ],
};

const fatura = (val: number, mesFatura: string): Transacao => ({
  id: `${val}${mesFatura}`,
  desc: 'x',
  val,
  tipo: 'credito',
  cartao: 'itau',
  cat: 'outro',
  data: '2026-09-20',
  mesFatura,
  obs: '',
  isEntrada: false,
  criadoEm: '',
});

describe('eventosDoPeriodo', () => {
  it('lista recorrências e vencimentos de fatura no período, em ordem', () => {
    const eventos = eventosDoPeriodo(
      config,
      [fatura(1850, '2026-10')],
      {},
      '2026-10-04',
      '2026-10-13',
      '2026-10-04',
    );
    expect(eventos.map((e) => [e.data, e.desc, e.tipo, e.valor, e.feito])).toEqual([
      ['2026-10-05', 'Salário', 'entrada', 9000, false],
      ['2026-10-08', 'Contas', 'saida', 900, false],
      ['2026-10-10', 'Bariloche', 'aporte', 925, false],
      ['2026-10-13', 'Fatura Itaú', 'fatura', 1850, false],
    ]);
    expect(saldoPrevisto(eventos)).toBe(5325);
  });

  it('marca como feito o que já foi lançado ou venceu', () => {
    const eventos = eventosDoPeriodo(
      config,
      [fatura(500, '2026-09')],
      {},
      '2026-09-01',
      '2026-09-30',
      '2026-09-20',
    );
    const feitos = Object.fromEntries(eventos.map((e) => [e.desc, e.feito]));
    expect(feitos).toMatchObject({ Salário: true, Contas: false, 'Fatura Itaú': true });
  });
});

describe('recorrência de valor variável no calendário', () => {
  it('usa o último valor confirmado e marca como estimado', () => {
    const cfg: Config = {
      ...config,
      recorrentes: [
        rec({
          id: 'apto',
          desc: 'Apartamento',
          val: 2973.13,
          dia: 15,
          variavel: true,
        } as Partial<Recorrente> & { id: string }),
      ],
    };
    const confirmado = {
      ...fatura(2968.4, '2026-10'),
      cartao: null,
      mesFatura: null,
      data: '2026-10-15',
      recorrenteId: 'apto',
    };
    const [e] = eventosDoPeriodo(cfg, [confirmado], {}, '2026-11-01', '2026-11-30', '2026-11-01');
    expect(e).toMatchObject({ desc: 'Apartamento', valor: 2968.4, estimado: true });
  });
});
