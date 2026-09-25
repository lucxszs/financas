import { mesFaturaSugerido } from './cartoes';
import { isEntrada } from './catalogos';
import { dataNoMes, somarMeses } from './datas';
import type { Aporte, Cartao, Recorrente, Transacao } from './types';

export interface LancamentoRecorrente {
  recorrente: Recorrente;
  mes: string;
  data: string;
}

/** Não lança mais que isso de uma vez (ex.: app parado por muito tempo). */
const MAX_MESES_ATRASADOS = 12;

const primeiroMesAberto = (r: Recorrente) => {
  const aposUltimo = r.lancadoAte ? somarMeses(r.lancadoAte, 1) : r.inicio;
  return aposUltimo > r.inicio ? aposUltimo : r.inicio;
};

/**
 * O que precisa ser lançado agora: para cada recorrente ativa, os meses em aberto até o atual.
 * No mês atual, só se o dia já chegou. Meses já lançados (`lancadoAte`) nunca voltam, mesmo que o lançamento
 * tenha sido excluído à mão.
 */
export const recorrentesALancar = (recorrentes: Recorrente[], hoje: string): LancamentoRecorrente[] => {
  const mesAtual = hoje.slice(0, 7);
  const limite = somarMeses(mesAtual, -(MAX_MESES_ATRASADOS - 1));
  const itens: LancamentoRecorrente[] = [];
  for (const r of recorrentes) {
    if (!r.ativo) continue;
    let mes = primeiroMesAberto(r);
    if (mes < limite) mes = limite;
    for (; mes <= mesAtual; mes = somarMeses(mes, 1)) {
      const data = dataNoMes(mes, r.dia);
      if (data > hoje) break;
      itens.push({ recorrente: r, mes, data });
    }
  }
  return itens;
};

/** Recorrentes do mês atual que ainda vão cair (dia depois de hoje). */
export const recorrentesPendentes = (recorrentes: Recorrente[], hoje: string): LancamentoRecorrente[] => {
  const mes = hoje.slice(0, 7);
  return recorrentes
    .filter((r) => r.ativo && primeiroMesAberto(r) <= mes)
    .map((r) => ({ recorrente: r, mes, data: dataNoMes(mes, r.dia) }))
    .filter((l) => l.data > hoje);
};

/** Na importação, recorrências nunca lançam meses passados: o início vira, no mínimo, o mês atual. */
export const semRetroativo = (recorrentes: Recorrente[], mesAtual: string): Recorrente[] =>
  recorrentes.map((r) => (r.lancadoAte || r.inicio >= mesAtual ? r : { ...r, inicio: mesAtual }));

/** Id determinístico: lançar duas vezes o mesmo mês grava no mesmo documento. */
export const idLancamentoRecorrente = (recorrenteId: string, mes: string) => `rec_${recorrenteId}_${mes}`;

export const transacaoDeRecorrente = (
  r: Extract<Recorrente, { tipo: 'transacao' }>,
  data: string,
  cartoes: Cartao[],
  criadoEm: string,
): Omit<Transacao, 'id'> => {
  const cartao = r.cartao ? cartoes.find((c) => c.id === r.cartao) : undefined;
  return {
    desc: r.desc,
    val: r.val,
    tipo: r.tipoTransacao,
    cartao: r.cartao,
    cat: r.cat,
    data,
    mesFatura: cartao ? mesFaturaSugerido(cartao, data) : null,
    obs: '🔁 automático',
    isEntrada: isEntrada(r.tipoTransacao),
    criadoEm,
    recorrenteId: r.id,
  };
};

export const aporteDeRecorrente = (
  r: Extract<Recorrente, { tipo: 'aporte' }>,
  data: string,
  criadoEm: string,
): Omit<Aporte, 'id'> => ({
  caixinha: r.caixinha,
  val: r.val,
  data,
  obs: '🔁 automático',
  criadoEm,
  recorrenteId: r.id,
});

/** Recorrentes com `lancadoAte` atualizado para o último mês lançado de cada uma. */
export const marcarLancados = (recorrentes: Recorrente[], lancados: LancamentoRecorrente[]): Recorrente[] =>
  recorrentes.map((r) => {
    const meses = lancados.filter((l) => l.recorrente.id === r.id).map((l) => l.mes);
    if (!meses.length) return r;
    const ultimo = meses.reduce((a, b) => (b > a ? b : a));
    return { ...r, lancadoAte: r.lancadoAte && r.lancadoAte > ultimo ? r.lancadoAte : ultimo };
  });
