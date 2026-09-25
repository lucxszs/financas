import { describe, expect, it } from 'vitest';
import { mesCompetencia } from './calculos';
import { aportePlanejado, insightsMes, limiteGastos, mediaGastos, resumoMes } from './resumo';
import type { Aporte, Config, Recorrente, Transacao } from './types';

const recorrentes: Recorrente[] = [
  {
    id: 'aluguel',
    tipo: 'transacao',
    desc: 'Aluguel',
    val: 1500,
    dia: 5,
    ativo: true,
    inicio: '2026-09',
    lancadoAte: '2026-09',
    tipoTransacao: 'pix',
    cat: 'moradia',
    cartao: null,
  },
  {
    id: 'internet',
    tipo: 'transacao',
    desc: 'Internet',
    val: 100,
    dia: 20,
    ativo: true,
    inicio: '2026-09',
    tipoTransacao: 'pix',
    cat: 'moradia',
    cartao: null,
  },
  {
    id: 'aporte',
    tipo: 'aporte',
    desc: 'Aporte',
    val: 1191,
    dia: 10,
    ativo: true,
    inicio: '2026-09',
    lancadoAte: '2026-09',
    caixinha: 'reserva',
  },
];

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  taxaAnualEstimada: 0.12,
  caixinhas: [{ id: 'reserva', nome: 'Reserva', moeda: 'BRL', rendimento: '', cor: 'emerald' }],
  objetivos: [
    {
      id: 'viagem',
      nome: 'Bariloche',
      emoji: '✈️',
      meta: 10000,
      caixinhas: ['reserva'],
      cor: 'violet',
      dataAlvo: '2027-07-01',
    },
  ],
  cartoes: [{ id: 'itau', nome: 'Itaú', limite: 1000, cor: 'amber' }],
  recorrentes,
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

const transacoes: Transacao[] = [
  tx({ tipo: 'salario', val: 9000, data: '2026-09-05', isEntrada: true }),
  tx({ val: 1500, data: '2026-09-05', recorrenteId: 'aluguel' }),
  tx({ val: 500, cat: 'mercado' }),
  // Compra de agosto que cai na fatura de setembro: conta em setembro.
  tx({ val: 200, tipo: 'credito', cartao: 'itau', data: '2026-08-28', mesFatura: '2026-09' }),
  // Compra de setembro na fatura de outubro: não conta em setembro.
  tx({ val: 300, tipo: 'credito', cartao: 'itau', data: '2026-09-09', mesFatura: '2026-10' }),
];

const aportes: Aporte[] = [
  { id: 'a', caixinha: 'reserva', val: 1191, data: '2026-09-10', obs: '', criadoEm: '' },
];

describe('mesCompetencia', () => {
  it('cartão conta no mês da fatura; o resto no mês da data', () => {
    expect(mesCompetencia(tx({ data: '2026-09-09', mesFatura: '2026-10' }))).toBe('2026-10');
    expect(mesCompetencia(tx({ data: '2026-09-09' }))).toBe('2026-09');
  });
});

describe('resumoMes', () => {
  it('soma renda, gastos pela competência e aportes do mês', () => {
    const r = resumoMes(transacoes, aportes, config, {}, '2026-09');
    expect(r).toMatchObject({ renda: 9000, rendaPrevista: false, gastos: 2200, investimentos: 1191 });
    expect(r.saldoLivre).toBe(5609);
    expect(r.taxaPoupanca).toBeCloseTo(13.23, 2);
    expect(r.gastosSobreRenda).toBeCloseTo(24.44, 2);
  });

  it('antes do salário cair, usa a renda da config mais outras entradas', () => {
    const semSalario = [tx({ tipo: 'recebi', val: 50, isEntrada: true })];
    expect(resumoMes(semSalario, [], config, {}, '2026-09')).toMatchObject({
      renda: 9050,
      rendaPrevista: true,
    });
  });

  it('aporte em moeda estrangeira usa a cotação', () => {
    const cfg: Config = {
      ...config,
      caixinhas: [...config.caixinhas, { id: 'usd', nome: 'Wise', moeda: 'USD', rendimento: '', cor: 'sky' }],
    };
    const emDolar: Aporte[] = [
      { id: 'b', caixinha: 'usd', val: 10, data: '2026-09-02', obs: '', criadoEm: '' },
    ];
    expect(resumoMes([], emDolar, cfg, { USD: 5 }, '2026-09').investimentos).toBe(50);
  });
});

describe('mediaGastos', () => {
  it('média dos meses anteriores com lançamentos', () => {
    const hist = [tx({ val: 5000, data: '2026-08-10' }), tx({ val: 6000, data: '2026-07-10' })];
    expect(mediaGastos(hist, config, '2026-09')).toBe(5500);
  });

  it('sem histórico, usa a média da config; sem nada, null', () => {
    const cfg: Config = {
      ...config,
      mediasGastos: { periodo: 'x', itens: [{ nome: 'a', valor: 3000, cor: 'sky' }] },
    };
    expect(mediaGastos([], cfg, '2026-09')).toBe(3000);
    expect(mediaGastos([], config, '2026-09')).toBeNull();
  });
});

describe('aportePlanejado', () => {
  it('usa as recorrências de aporte ativas; sem elas, o aporte mensal dos objetivos', () => {
    expect(aportePlanejado(config, {})).toBe(1191);
    const semRec: Config = {
      ...config,
      recorrentes: [],
      objetivos: [{ ...config.objetivos[0]!, aporteMensal: 925 }],
    };
    expect(aportePlanejado(semRec, {})).toBe(925);
  });
});

describe('limiteGastos', () => {
  const resumo = resumoMes(transacoes, aportes, config, {}, '2026-09');

  it('desconta gastos, investimentos e contas fixas que ainda vão cair', () => {
    const l = limiteGastos(resumo, transacoes, config, {}, '2026-09-10');
    expect(l).toMatchObject({ contasFixas: 100, investimentos: 1191, jaGasto: 2200, diasRestantes: 21 });
    expect(l.disponivel).toBe(5509);
    expect(l.porDia).toBeCloseTo(262.33, 2);
    expect(l.ate).toBe('2026-09-30');
    expect(l.status).toBe('seguro');
  });

  it('atenção quando o ritmo passa do orçamento planejado', () => {
    const cfg: Config = { ...config, orcamentos: { mercado: 600 } };
    expect(limiteGastos(resumo, transacoes, cfg, {}, '2026-09-10').status).toBe('atencao');
  });

  it('cuidado quando o mês fica negativo', () => {
    const gastao = [...transacoes, tx({ val: 6000 })];
    const r = resumoMes(gastao, aportes, config, {}, '2026-09');
    const l = limiteGastos(r, gastao, config, {}, '2026-09-10');
    expect(l.disponivel).toBeLessThan(0);
    expect(l.porDia).toBe(0);
    expect(l.status).toBe('cuidado');
  });

  it('cuidado quando o ritmo atual leva a fechar negativo', () => {
    // 3.000 variáveis em 10 dias = 300/dia; faltam 20 dias -> 6.000 > disponível.
    const ritmoAlto = [...transacoes, tx({ val: 2300 })];
    const r = resumoMes(ritmoAlto, aportes, config, {}, '2026-09');
    const l = limiteGastos(r, ritmoAlto, config, {}, '2026-09-10');
    expect(l.disponivel).toBeGreaterThan(0);
    expect(l.projecaoFim).toBeLessThan(0);
    expect(l.status).toBe('cuidado');
  });
});

describe('insightsMes', () => {
  it('compara com a média, a meta de aporte, os cartões e as metas com data', () => {
    const hist = [...transacoes, tx({ val: 2620, data: '2026-08-10' })];
    const resumo = resumoMes(hist, aportes, config, {}, '2026-09');
    // O Intl usa espaço não separável depois do "R$".
    const textos = insightsMes(resumo, hist, config, { reserva: 1800 }, {}).map((i) =>
      `${i.icone} ${i.texto}`.replace(/\u00a0/g, ' '),
    );
    expect(textos).toEqual([
      '💰 Até agora, R$ 420,00 abaixo da sua média de gastos (R$ 2.620,00)',
      '📈 Meta de investimento do mês batida',
      '💳 Cartões 20% comprometidos na fatura do mês',
      '✈️ Bariloche está 18% concluído',
    ]);
  });
});
