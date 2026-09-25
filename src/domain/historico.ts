import { transacoesDaCompetencia } from './calculos';
import { somarMeses } from './datas';
import { liquidoSnapshot } from './patrimonio';
import { resumoMes } from './resumo';
import type { Aporte, Categoria, Config, Cotacoes, Snapshot, Transacao } from './types';

export interface LinhaHistorico {
  mes: string;
  renda: number;
  rendaPrevista: boolean;
  gastos: number;
  investimentos: number;
  saldo: number;
  taxaPoupanca: number;
  /** Patrimônio líquido do mês; null se não houver foto dos saldos naquele mês. */
  patrimonio: number | null;
}

/** Últimos `n` meses até `mesFinal`, do mais antigo para o mais recente. */
export const serieMensal = (
  transacoes: Transacao[],
  aportes: Aporte[],
  snapshots: Snapshot[],
  config: Config,
  cotacoes: Cotacoes,
  mesFinal: string,
  n = 6,
): LinhaHistorico[] =>
  Array.from({ length: n }, (_, i) => somarMeses(mesFinal, i - n + 1)).map((mes) => {
    const r = resumoMes(transacoes, aportes, config, cotacoes, mes);
    const foto = snapshots.find((s) => s.mes === mes);
    return {
      mes,
      renda: r.renda,
      rendaPrevista: r.rendaPrevista,
      gastos: r.gastos,
      investimentos: r.investimentos,
      saldo: r.saldoLivre,
      taxaPoupanca: r.taxaPoupanca,
      patrimonio: foto ? liquidoSnapshot(foto, config, cotacoes) : null,
    };
  });

export type StatusOrcamento = 'ok' | 'atencao' | 'estourou';

export interface LinhaOrcamento {
  cat: Categoria;
  real: number;
  meta: number | null;
  /** Real ÷ meta × 100; null sem meta. */
  pct: number | null;
  status: StatusOrcamento | null;
}

/**
 * Gasto real × orçamento por categoria no mês. Inclui categorias com orçamento e nenhum gasto.
 * 🟢 até 100% · 🟡 até 110% · 🔴 acima.
 */
export const orcamentoPorCategoria = (
  transacoes: Transacao[],
  config: Config,
  mes: string,
): LinhaOrcamento[] => {
  const reais = new Map<Categoria, number>();
  for (const t of transacoesDaCompetencia(transacoes, mes))
    if (!t.isEntrada) reais.set(t.cat, (reais.get(t.cat) ?? 0) + t.val);
  const orcamentos = config.orcamentos ?? {};
  const cats = new Set<Categoria>([...reais.keys(), ...(Object.keys(orcamentos) as Categoria[])]);

  return [...cats]
    .map((cat) => {
      const real = reais.get(cat) ?? 0;
      const meta = orcamentos[cat] ?? null;
      const pct = meta ? (real / meta) * 100 : null;
      const status: StatusOrcamento | null =
        meta === null ? null : real <= meta ? 'ok' : real <= meta * 1.1 ? 'atencao' : 'estourou';
      return { cat, real, meta, pct, status };
    })
    .sort((a, b) => b.real - a.real || (b.meta ?? 0) - (a.meta ?? 0));
};
