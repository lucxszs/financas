import { describe, expect, it } from 'vitest';
import {
  comprometimentoFuturo,
  limiteComprometido,
  diasAteMelhorDia,
  montarParcelas,
  mesFaturaSugerido,
  primeiraFaturaAberta,
  resumoCartao,
  valoresParcelas,
} from './cartoes';
import type { Cartao, Transacao } from './types';

const cartao = (melhorDiaCompra?: number, diaVencimento?: number): Cartao => ({
  id: 'c',
  nome: 'Cartão',
  limite: 1000,
  cor: 'amber',
  melhorDiaCompra,
  diaVencimento,
});

describe('mesFaturaSugerido', () => {
  it('melhor dia 04, vence 13: antes do melhor dia fica no mês, a partir dele vai para o seguinte', () => {
    const c = cartao(4, 13);
    expect(mesFaturaSugerido(c, '2026-10-03')).toBe('2026-10');
    expect(mesFaturaSugerido(c, '2026-10-04')).toBe('2026-11');
    expect(mesFaturaSugerido(c, '2026-10-05')).toBe('2026-11');
  });

  it('melhor dia 09, vence 15', () => {
    const c = cartao(9, 15);
    expect(mesFaturaSugerido(c, '2026-10-08')).toBe('2026-10');
    expect(mesFaturaSugerido(c, '2026-10-09')).toBe('2026-11');
  });

  it('melhor dia 12, vence 16', () => {
    const c = cartao(12, 16);
    expect(mesFaturaSugerido(c, '2026-10-11')).toBe('2026-10');
    expect(mesFaturaSugerido(c, '2026-10-12')).toBe('2026-11');
  });

  it('vencimento antes do melhor dia no calendário (fecha 28, vence 05) soma um mês', () => {
    const c = cartao(29, 5);
    expect(mesFaturaSugerido(c, '2026-10-10')).toBe('2026-11');
    expect(mesFaturaSugerido(c, '2026-10-29')).toBe('2026-12');
  });

  it('vira o ano', () => {
    expect(mesFaturaSugerido(cartao(4, 13), '2026-12-20')).toBe('2027-01');
  });

  it('sem melhor dia cadastrado não sugere', () => {
    expect(mesFaturaSugerido(cartao(), '2026-10-10')).toBeNull();
  });
});

describe('valoresParcelas', () => {
  it('divide em centavos e joga o arredondamento na 1ª parcela', () => {
    expect(valoresParcelas(100, 3)).toEqual([33.34, 33.33, 33.33]);
    expect(valoresParcelas(1500, 10)).toEqual(Array(10).fill(150));
  });
});

describe('montarParcelas', () => {
  it('uma parcela por mês de fatura, com a data andando junto', () => {
    const base = {
      desc: 'Notebook',
      tipo: 'parcelado' as const,
      cartao: 'itau',
      cat: 'outro' as const,
      obs: '',
      isEntrada: false,
      criadoEm: 'agora',
    };
    const p = montarParcelas(base, 1000, 3, '2026-12-31', '2027-01', 'g1');
    expect(p.map((x) => [x.val, x.data, x.mesFatura, x.parcela])).toEqual([
      [333.34, '2026-12-31', '2027-01', { atual: 1, total: 3 }],
      [333.33, '2027-01-31', '2027-02', { atual: 2, total: 3 }],
      [333.33, '2027-02-28', '2027-03', { atual: 3, total: 3 }],
    ]);
    expect(p.every((x) => x.grupoId === 'g1' && x.desc === 'Notebook')).toBe(true);
  });
});

const itau = cartao(4, 13);
itau.id = 'itau';
itau.limite = 5500;

let seq = 0;
const compra = (val: number, mesFatura: string, extra: Partial<Transacao> = {}): Transacao => ({
  id: `t${seq++}`,
  desc: 'x',
  val,
  tipo: 'credito',
  cartao: 'itau',
  cat: 'outro',
  data: '2026-09-01',
  mesFatura,
  obs: '',
  isEntrada: false,
  criadoEm: '',
  ...extra,
});

describe('primeiraFaturaAberta', () => {
  it('depois do vencimento, a fatura do mês já foi paga', () => {
    expect(primeiraFaturaAberta(itau, '2026-09-13')).toBe('2026-09');
    expect(primeiraFaturaAberta(itau, '2026-09-14')).toBe('2026-10');
  });
});

describe('diasAteMelhorDia', () => {
  it('conta até o melhor dia deste mês ou do próximo', () => {
    expect(diasAteMelhorDia(itau, '2026-09-01')).toBe(3);
    expect(diasAteMelhorDia(itau, '2026-09-04')).toBe(0);
    expect(diasAteMelhorDia(itau, '2026-09-05')).toBe(29);
    expect(diasAteMelhorDia(cartao(), '2026-09-05')).toBeNull();
  });
});

describe('resumoCartao', () => {
  const transacoes = [
    compra(999, '2026-08'), // paga
    compra(2840, '2026-09'),
    compra(1230, '2026-10'),
    compra(420, '2026-11', { grupoId: 'g' }),
    compra(420, '2026-12', { grupoId: 'g' }),
    compra(50, '2026-09', { cartao: 'outro' }),
  ];

  it('separa fatura atual, próxima e futuras; o limite desconta tudo em aberto', () => {
    const r = resumoCartao(itau, transacoes, '2026-09-10');
    expect(r).toMatchObject({
      mesAtual: '2026-09',
      faturaAtual: 2840,
      proximaFatura: 1230,
      futuras: 840,
      emAberto: 4910,
      disponivel: 590,
      diasMelhorDia: 24,
    });
  });

  it('depois do vencimento, a fatura atual passa a ser a do mês seguinte', () => {
    const r = resumoCartao(itau, transacoes, '2026-09-20');
    expect(r).toMatchObject({ mesAtual: '2026-10', faturaAtual: 1230, proximaFatura: 420, futuras: 420 });
  });
});

describe('comprometimentoFuturo', () => {
  it('soma as faturas em aberto de todos os cartões mês a mês', () => {
    const inter: Cartao = { ...cartao(9, 15), id: 'inter' };
    const transacoes = [
      compra(2840, '2026-09'),
      compra(420, '2026-10'),
      compra(1420, '2026-09', { cartao: 'inter' }),
      compra(380, '2026-11', { cartao: 'inter' }),
    ];
    expect(comprometimentoFuturo([itau, inter], transacoes, '2026-09-14', 3)).toEqual([
      // Itaú venceu dia 13 (fatura de setembro paga); Inter vence dia 15 (ainda em aberto).
      { mes: '2026-09', valor: 1420 },
      { mes: '2026-10', valor: 420 },
      { mes: '2026-11', valor: 380 },
    ]);
  });
});

describe('limiteComprometido', () => {
  it('faturas vencidas contam como pagas; soma o limite de todos os cartões', () => {
    const inter: Cartao = { ...cartao(9, 15), id: 'inter', limite: 4500 };
    const transacoes = [
      compra(3000, '2026-09'),
      compra(1000, '2026-10'),
      compra(2000, '2026-09', { cartao: 'inter' }),
    ];
    // 14/09: Itaú (vence 13) já pagou setembro; Inter (vence 15) ainda não.
    expect(limiteComprometido([itau, inter], transacoes, '2026-09-14')).toBe(30);
    // 16/09: as duas faturas de setembro pagas, sobra só outubro do Itaú.
    expect(limiteComprometido([itau, inter], transacoes, '2026-09-16')).toBe(10);
  });

  it('sem cartões não há percentual', () => {
    expect(limiteComprometido([], [], '2026-09-10')).toBeNull();
  });
});

describe('resumoCartao com limite informado', () => {
  // Itaú: limite 5.500, vence dia 13. No app só há 1.000 lançados em aberto.
  const antes = compra(1000, '2026-10', { criadoEm: '2026-09-20T10:00:00.000Z' });
  const informado = { disponivel: 800, em: '2026-09-28T12:00:00.000Z' };

  it('o limite do banco vale como verdade e mostra o que não está lançado', () => {
    const r = resumoCartao(itau, [antes], '2026-09-28', informado);
    expect(r).toMatchObject({ emAberto: 4700, disponivel: 800, naoLancado: 3700, faturaAtual: 1000 });
    expect(r.pct).toBeCloseTo(85.45, 2);
  });

  it('compras lançadas depois da informação descontam do disponível', () => {
    const depois = compra(150, '2026-10', { criadoEm: '2026-09-29T09:00:00.000Z' });
    const r = resumoCartao(itau, [antes, depois], '2026-09-29', informado);
    expect(r).toMatchObject({ emAberto: 4850, disponivel: 650, naoLancado: 3700 });
  });

  it('sem informação, continua pelos lançamentos', () => {
    expect(resumoCartao(itau, [antes], '2026-09-28')).toMatchObject({
      emAberto: 1000,
      disponivel: 4500,
      naoLancado: 0,
      informado: null,
    });
  });

  it('limiteComprometido usa o limite informado de cada cartão', () => {
    expect(limiteComprometido([itau], [antes], '2026-09-28', { itau: informado })).toBeCloseTo(85.45, 2);
  });
});
