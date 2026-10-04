import { transacoesDaCompetencia } from './calculos';
import { somarMeses } from './datas';
import { liquidoSnapshot } from './patrimonio';
import { resumoMes } from './resumo';
import type { Aporte, Categoria, Config, Cotacoes, FechamentoMes, Snapshot, Transacao } from './types';

export interface LinhaHistorico {
  mes: string;
  renda: number;
  rendaPrevista: boolean;
  gastos: number;
  investimentos: number;
  saldo: number;
  /** Patrimônio líquido do mês; null se não houver foto dos saldos naquele mês. */
  patrimonio: number | null;
  /** true = veio do fechamento imutável do mês, não do cálculo ao vivo. */
  fechado: boolean;
}

/**
 * Últimos `n` meses até `mesFinal`, do mais antigo para o mais recente. Mês fechado usa a foto do fechamento;
 * os demais são calculados a partir dos lançamentos.
 */
export const serieMensal = (
  transacoes: Transacao[],
  aportes: Aporte[],
  snapshots: Snapshot[],
  config: Config,
  cotacoes: Cotacoes,
  mesFinal: string,
  n = 6,
  fechamentos: FechamentoMes[] = [],
): LinhaHistorico[] =>
  Array.from({ length: n }, (_, i) => somarMeses(mesFinal, i - n + 1)).map((mes) => {
    const f = fechamentos.find((x) => x.mes === mes);
    if (f)
      return {
        mes,
        renda: f.renda,
        rendaPrevista: f.rendaPrevista,
        gastos: f.gastos,
        investimentos: f.investimentos,
        saldo: f.saldo,
        patrimonio: f.patrimonio,
        fechado: true,
      };
    const r = resumoMes(transacoes, aportes, config, cotacoes, mes);
    const foto = snapshots.find((s) => s.mes === mes);
    return {
      mes,
      renda: r.renda,
      rendaPrevista: r.rendaPrevista,
      gastos: r.gastos,
      investimentos: r.investimentos,
      saldo: r.saldoLivre,
      patrimonio: foto ? liquidoSnapshot(foto, config, cotacoes) : null,
      fechado: false,
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

/**
 * Orçamento sugerido por categoria: média dos gastos nos `n` meses anteriores a `mes` que tiveram lançamentos,
 * arredondada para cima de 10 em 10. Categorias sem gasto ficam de fora.
 */
export const orcamentoSugerido = (transacoes: Transacao[], mes: string, n = 3) => {
  const meses = Array.from({ length: n }, (_, i) => somarMeses(mes, -(i + 1))).filter(
    (m) => transacoesDaCompetencia(transacoes, m).length > 0,
  );
  const sugestao: Partial<Record<Categoria, number>> = {};
  if (!meses.length) return { sugestao, meses };
  const totais = new Map<Categoria, number>();
  for (const m of meses)
    for (const t of transacoesDaCompetencia(transacoes, m))
      if (!t.isEntrada) totais.set(t.cat, (totais.get(t.cat) ?? 0) + t.val);
  for (const [cat, total] of totais) sugestao[cat] = Math.ceil(total / meses.length / 10) * 10;
  return { sugestao, meses };
};
