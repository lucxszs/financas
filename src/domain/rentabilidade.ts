import { paraBRL } from './calculos';
import type { Aporte, Caixinha, Config, Cotacoes, Snapshot } from './types';

export interface RentabilidadeCaixinha {
  caixinha: Caixinha;
  /** Mês ("YYYY-MM") da primeira foto dos saldos com esta caixinha; null = sem foto (base 0). */
  inicio: string | null;
  /** Saldo na primeira foto, na moeda da caixinha. */
  base: number;
  /** Aportes depois da primeira foto, na moeda da caixinha. */
  aportes: number;
  investido: number;
  atual: number;
  rendimento: number;
  /** Rendimento ÷ investido × 100; null sem nada investido. */
  pct: number | null;
  /** Saldo atual em BRL; null sem cotação. */
  atualBRL: number | null;
}

/**
 * Rendimento de cada caixinha de investimento = saldo atual − (saldo na primeira foto + aportes depois dela).
 * Aproximação: saques não são registrados (reduzem o rendimento) e a primeira foto pode já incluir aportes
 * daquele mês (por isso só contam aportes de meses seguintes).
 */
export const rentabilidadeCaixinhas = (
  config: Config,
  valores: Record<string, number>,
  snapshots: Snapshot[],
  aportes: Aporte[],
  cotacoes: Cotacoes,
): RentabilidadeCaixinha[] =>
  config.caixinhas
    .filter((c) => c.tipo !== 'conta')
    .map((c) => {
      const primeira = [...snapshots]
        .filter((s) => s.valores[c.id] !== undefined)
        .sort((a, b) => a.mes.localeCompare(b.mes))[0];
      const base = primeira?.valores[c.id] ?? 0;
      const somaAportes = aportes
        .filter((a) => a.caixinha === c.id && (!primeira || a.data.slice(0, 7) > primeira.mes))
        .reduce((acc, a) => acc + a.val, 0);
      const investido = base + somaAportes;
      const atual = valores[c.id] ?? 0;
      return {
        caixinha: c,
        inicio: primeira?.mes ?? null,
        base,
        aportes: somaAportes,
        investido,
        atual,
        rendimento: atual - investido,
        pct: investido > 0 ? ((atual - investido) / investido) * 100 : null,
        atualBRL: paraBRL(atual, c.moeda, cotacoes),
      };
    });

export interface TotalRentabilidade {
  investido: number;
  atual: number;
  rendimento: number;
  pct: number | null;
  /** Primeiro mês com foto entre as caixinhas; base do período para comparar com CDI e IPCA. */
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

/**
 * Variação acumulada (%) de uma série mensal entre dois meses (inclusive), compondo mês a mês.
 * `ate` diz até onde havia dado (a série do mês corrente costuma sair só no mês seguinte).
 */
export const acumulado = (serie: { mes: string; valor: number }[], desde: string, ate: string) => {
  const meses = serie
    .filter((p) => p.mes >= desde && p.mes <= ate)
    .sort((a, b) => a.mes.localeCompare(b.mes));
  if (!meses.length) return null;
  const fator = meses.reduce((f, p) => f * (1 + p.valor / 100), 1);
  return { pct: (fator - 1) * 100, ate: meses.at(-1)!.mes, meses: meses.length };
};
