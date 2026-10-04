import { paraBRL } from './calculos';
import type { Caixinha, Config, Cotacoes, Snapshot } from './types';

export interface RentabilidadeCaixinha {
  caixinha: Caixinha;
  /** Primeiro mês com rendimento informado; null = nenhum informado. */
  inicio: string | null;
  /** Meses com rendimento informado. */
  meses: number;
  /** Saldo atual menos os rendimentos: o que foi colocado (aportes e depósitos), na moeda da caixinha. */
  investido: number;
  atual: number;
  /** Soma dos rendimentos informados no "Atualizar saldos". */
  rendimento: number;
  /** Rendimento ÷ investido × 100; null sem rendimento informado. */
  pct: number | null;
  /** Saldo atual em BRL; null sem cotação. */
  atualBRL: number | null;
}

/**
 * Rendimento de cada caixinha de investimento = soma dos rendimentos informados mês a mês no "Atualizar saldos".
 * Não depende de todos os depósitos terem sido lançados como aporte (depósito não lançado não vira "rendimento").
 * Mês sem rendimento informado conta como zero.
 */
export const rentabilidadeCaixinhas = (
  config: Config,
  valores: Record<string, number>,
  snapshots: Snapshot[],
  cotacoes: Cotacoes,
): RentabilidadeCaixinha[] =>
  config.caixinhas
    .filter((c) => c.tipo !== 'conta')
    .map((c) => {
      const comRendimento = snapshots
        .filter((s) => s.rendimentos?.[c.id] !== undefined)
        .sort((a, b) => a.mes.localeCompare(b.mes));
      const rendimento = comRendimento.reduce((acc, s) => acc + (s.rendimentos?.[c.id] ?? 0), 0);
      const atual = valores[c.id] ?? 0;
      const investido = atual - rendimento;
      return {
        caixinha: c,
        inicio: comRendimento[0]?.mes ?? null,
        meses: comRendimento.length,
        investido,
        atual,
        rendimento,
        pct: comRendimento.length && investido > 0 ? (rendimento / investido) * 100 : null,
        atualBRL: paraBRL(atual, c.moeda, cotacoes),
      };
    });

export interface TotalRentabilidade {
  investido: number;
  atual: number;
  rendimento: number;
  pct: number | null;
  /** Primeiro mês com rendimento informado; início do período para comparar com CDI e IPCA. */
  inicio: string | null;
  /** Participação de cada caixinha no total (0 a 100), por id. */
  alocacao: Record<string, number>;
}

/** Soma em BRL (cotação atual). Caixinhas sem cotação ficam de fora. */
export const totalRentabilidade = (
  itens: RentabilidadeCaixinha[],
  cotacoes: Cotacoes,
): TotalRentabilidade => {
  let investido = 0;
  let atual = 0;
  for (const i of itens) {
    const inv = paraBRL(i.investido, i.caixinha.moeda, cotacoes);
    if (inv === null || i.atualBRL === null) continue;
    investido += inv;
    atual += i.atualBRL;
  }
  const inicios = itens.flatMap((i) => (i.inicio ? [i.inicio] : [])).sort();
  const alocacao = Object.fromEntries(
    itens.map((i) => [i.caixinha.id, atual > 0 && i.atualBRL !== null ? (i.atualBRL / atual) * 100 : 0]),
  );
  return {
    investido,
    atual,
    rendimento: atual - investido,
    pct: investido > 0 ? ((atual - investido) / investido) * 100 : null,
    inicio: inicios[0] ?? null,
    alocacao,
  };
};
