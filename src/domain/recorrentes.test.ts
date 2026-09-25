import { describe, expect, it } from 'vitest';
import {
  marcarLancados,
  recorrentesALancar,
  recorrentesPendentes,
  semRetroativo,
  transacaoDeRecorrente,
} from './recorrentes';
import type { Recorrente } from './types';

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

describe('semRetroativo', () => {
  it('leva o início para o mês atual só quando nada foi lançado ainda', () => {
    const [nova, lancada, futura] = semRetroativo(
      [
        aluguel({ inicio: '2026-01' }),
        aluguel({ inicio: '2026-01', lancadoAte: '2026-08' }),
        aluguel({ inicio: '2026-12' }),
      ],
      '2026-09',
    );
    expect(nova?.inicio).toBe('2026-09');
    expect(lancada?.inicio).toBe('2026-01');
    expect(futura?.inicio).toBe('2026-12');
  });
});
