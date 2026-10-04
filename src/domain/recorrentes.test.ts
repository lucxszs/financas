import { describe, expect, it } from 'vitest';
import {
  marcarLancados,
  recorrentesALancar,
  recorrentesPendentes,
  transacaoDeRecorrente,
  valorPrevisto,
} from './recorrentes';
import type { Recorrente, Transacao } from './types';

const aluguel = (extra: Partial<Recorrente> = {}): Recorrente =>
  ({
    id: 'aluguel',
    tipo: 'transacao',
    desc: 'Aluguel',
    val: 1500,
    dia: 5,
    ativo: true,
    inicio: '2026-09',
    tipoTransacao: 'pix',
    cat: 'moradia',
    cartao: null,
    ...extra,
  }) as Recorrente;

const meses = (itens: { mes: string }[]) => itens.map((i) => i.mes);

describe('recorrentesALancar', () => {
  it('lança o mês atual quando o dia já chegou', () => {
    expect(recorrentesALancar([aluguel()], '2026-09-05')).toEqual([
      { recorrente: aluguel(), mes: '2026-09', data: '2026-09-05' },
    ]);
  });

  it('não lança antes do dia', () => {
    expect(recorrentesALancar([aluguel()], '2026-09-04')).toEqual([]);
  });

  it('não relança meses já lançados, mesmo que o lançamento tenha sido excluído', () => {
    expect(recorrentesALancar([aluguel({ lancadoAte: '2026-09' })], '2026-09-30')).toEqual([]);
  });

  it('recupera meses atrasados', () => {
    const r = aluguel({ lancadoAte: '2026-09' });
    expect(meses(recorrentesALancar([r], '2026-12-10'))).toEqual(['2026-10', '2026-11', '2026-12']);
  });

  it('respeita o mês de início e ignora inativas', () => {
    expect(recorrentesALancar([aluguel({ inicio: '2026-10' })], '2026-09-30')).toEqual([]);
    expect(recorrentesALancar([aluguel({ ativo: false })], '2026-09-30')).toEqual([]);
  });

  it('dia 31 em mês curto cai no último dia', () => {
    const r = aluguel({ dia: 31, inicio: '2027-02' });
    expect(recorrentesALancar([r], '2027-02-28')[0]?.data).toBe('2027-02-28');
  });

  it('não volta mais que 12 meses', () => {
    const r = aluguel({ inicio: '2024-01' });
    expect(recorrentesALancar([r], '2026-09-30')).toHaveLength(12);
  });
});

describe('recorrentesPendentes', () => {
  it('lista o que ainda vai cair no mês', () => {
    const internet = aluguel({ id: 'internet', dia: 20 });
    expect(recorrentesPendentes([aluguel(), internet], '2026-09-10').map((p) => p.recorrente.id)).toEqual([
      'internet',
    ]);
  });

  it('ignora o que já foi lançado no mês', () => {
    expect(recorrentesPendentes([aluguel({ dia: 20, lancadoAte: '2026-09' })], '2026-09-10')).toEqual([]);
  });
});

describe('marcarLancados', () => {
  it('guarda o último mês lançado', () => {
    const r = aluguel();
    const lancados = recorrentesALancar([r], '2026-11-10');
    expect(marcarLancados([r], lancados)[0]?.lancadoAte).toBe('2026-11');
  });
});

describe('transacaoDeRecorrente', () => {
  it('usa o melhor dia do cartão para o mês da fatura', () => {
    const r = aluguel({ tipoTransacao: 'credito', cartao: 'itau' }) as Extract<
      Recorrente,
      { tipo: 'transacao' }
    >;
    const cartoes = [{ id: 'itau', nome: 'Itaú', limite: 5000, cor: 'amber' as const, melhorDiaCompra: 4 }];
    const t = transacaoDeRecorrente(r, '2026-10-05', cartoes, 'agora');
    expect(t.mesFatura).toBe('2026-11');
    expect(t.recorrenteId).toBe('aluguel');
    expect(t.isEntrada).toBe(false);
  });
});

describe('recorrente de valor variável', () => {
  const apto = aluguel({ id: 'apto', val: 2973.13, variavel: true }) as Extract<
    Recorrente,
    { tipo: 'transacao' }
  >;
  const lanc = (val: number, data: string, aConfirmar?: boolean) =>
    ({
      id: data,
      desc: 'Apartamento',
      val,
      tipo: 'pix',
      cartao: null,
      cat: 'moradia',
      data,
      mesFatura: null,
      obs: '',
      isEntrada: false,
      criadoEm: '',
      recorrenteId: 'apto',
      ...(aConfirmar && { aConfirmar }),
    }) as Transacao;

  it('prevê com o último valor confirmado; ignora os ainda a confirmar', () => {
    expect(valorPrevisto(apto, [])).toBe(2973.13);
    expect(valorPrevisto(apto, [lanc(2968.4, '2026-10-15'), lanc(2968.4, '2026-11-15', true)])).toBe(2968.4);
  });

  it('valor fixo ignora o histórico', () => {
    expect(valorPrevisto(aluguel(), [lanc(1, '2026-10-15')])).toBe(1500);
  });

  it('o lançamento automático de uma variável sai marcado "a confirmar"', () => {
    expect(transacaoDeRecorrente(apto, '2026-10-15', [], 'agora', 2968.4)).toMatchObject({
      val: 2968.4,
      aConfirmar: true,
    });
    expect(
      transacaoDeRecorrente(aluguel() as typeof apto, '2026-10-05', [], 'agora').aConfirmar,
    ).toBeUndefined();
  });
});
