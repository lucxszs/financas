import { paraBRL, pct, progressoObjetivo, transacoesDaCompetencia, usoCartao } from './calculos';
import { isEntrada } from './catalogos';
import { dataNoMes, diasNoMes, somarMeses } from './datas';
import { fmt } from './formatadores';
import { recorrentesPendentes } from './recorrentes';
import type { Aporte, Config, Cotacoes, Transacao } from './types';

export interface ResumoMes {
  mes: string;
  /** Entradas do mês; enquanto o salário não entra, usa a renda mensal da config. */
  renda: number;
  rendaPrevista: boolean;
  gastos: number;
  investimentos: number;
  saldoLivre: number;
  /** % da renda que foi investida. */
  taxaPoupanca: number;
  /** % da renda que foi gasta. */
  gastosSobreRenda: number;
}

const soma = (valores: number[]) => valores.reduce((a, v) => a + v, 0);

/** Aportes de um mês em BRL. Aporte em moeda sem cotação fica de fora. */
export const aportesDoMesEmBRL = (aportes: Aporte[], config: Config, cotacoes: Cotacoes, mes: string) =>
  soma(
    aportes
      .filter((a) => a.data.startsWith(mes))
      .map((a) => {
        const moeda = config.caixinhas.find((c) => c.id === a.caixinha)?.moeda ?? 'BRL';
        return paraBRL(a.val, moeda, cotacoes) ?? 0;
      }),
  );

export const resumoMes = (
  transacoes: Transacao[],
  aportes: Aporte[],
  config: Config,
  cotacoes: Cotacoes,
  mes: string,
): ResumoMes => {
  const doMes = transacoesDaCompetencia(transacoes, mes);
  const entradas = doMes.filter((t) => t.isEntrada);
  const temSalario = entradas.some((t) => t.tipo === 'salario');
  // Antes do salário cair, a renda do mês é a da config (mais qualquer outra entrada que já chegou).
  const renda = soma(entradas.map((t) => t.val)) + (temSalario ? 0 : config.rendaMensal);
  const gastos = soma(doMes.filter((t) => !t.isEntrada).map((t) => t.val));
  const investimentos = aportesDoMesEmBRL(aportes, config, cotacoes, mes);
  return {
    mes,
    renda,
    rendaPrevista: !temSalario,
    gastos,
    investimentos,
    saldoLivre: renda - gastos - investimentos,
    taxaPoupanca: renda > 0 ? (investimentos / renda) * 100 : 0,
    gastosSobreRenda: renda > 0 ? (gastos / renda) * 100 : 0,
  };
};

/**
 * Média de gastos dos `n` meses anteriores que tiveram lançamentos. Sem histórico, usa o total da média
 * cadastrada na config (se houver).
 */
export const mediaGastos = (transacoes: Transacao[], config: Config, mes: string, n = 3): number | null => {
  const totais: number[] = [];
  for (let i = 1; i <= n; i++) {
    const doMes = transacoesDaCompetencia(transacoes, somarMeses(mes, -i));
    if (doMes.length) totais.push(soma(doMes.filter((t) => !t.isEntrada).map((t) => t.val)));
  }
  if (totais.length) return soma(totais) / totais.length;
  const itens = config.mediasGastos?.itens ?? [];
  return itens.length ? soma(itens.map((i) => i.valor)) : null;
};

/** Aporte mensal planejado em BRL: recorrências de aporte ativas ou, sem elas, o aporte mensal dos objetivos. */
export const aportePlanejado = (config: Config, cotacoes: Cotacoes) => {
  const recorrentes = (config.recorrentes ?? []).flatMap((r) => (r.ativo && r.tipo === 'aporte' ? [r] : []));
  if (recorrentes.length)
    return soma(
      recorrentes.map((r) => {
        const moeda = config.caixinhas.find((c) => c.id === r.caixinha)?.moeda ?? 'BRL';
        return paraBRL(r.val, moeda, cotacoes) ?? 0;
      }),
    );
  return soma(config.objetivos.map((o) => o.aporteMensal ?? 0));
};

export type Tom = 'bom' | 'alerta' | 'neutro';
export interface Insight {
  icone: string;
  texto: string;
  tom: Tom;
}

export const insightsMes = (
  resumo: ResumoMes,
  transacoes: Transacao[],
  config: Config,
  valores: Record<string, number>,
  cotacoes: Cotacoes,
): Insight[] => {
  const itens: Insight[] = [];

  const media = mediaGastos(transacoes, config, resumo.mes);
  if (media !== null && media > 0) {
    const dif = media - resumo.gastos;
    itens.push(
      dif >= 0
        ? {
            icone: '💰',
            texto: `Até agora, ${fmt(dif)} abaixo da sua média de gastos (${fmt(media)})`,
            tom: 'bom',
          }
        : { icone: '⚠️', texto: `Já gastou ${fmt(-dif)} acima da sua média (${fmt(media)})`, tom: 'alerta' },
    );
  }

  const planejado = aportePlanejado(config, cotacoes);
  if (planejado > 0) {
    const dif = resumo.investimentos - planejado;
    itens.push(
      dif >= 0
        ? {
            icone: '📈',
            texto: dif > 0 ? `Investiu ${fmt(dif)} acima da meta` : 'Meta de investimento do mês batida',
            tom: 'bom',
          }
        : {
            icone: '📈',
            texto: `Investiu ${fmt(resumo.investimentos)} de ${fmt(planejado)} planejados`,
            tom: 'neutro',
          },
    );
  }

  const limite = soma(config.cartoes.map((c) => c.limite));
  if (limite > 0) {
    const usado = soma(config.cartoes.map((c) => usoCartao(c, transacoes, resumo.mes).utilizado));
    const p = pct(usado, limite);
    itens.push({
      icone: p > 60 ? '⚠️' : '💳',
      texto: `Cartões ${p.toFixed(0)}% comprometidos na fatura do mês`,
      tom: p > 60 ? 'alerta' : 'neutro',
    });
  }

  for (const o of config.objetivos.filter((x) => x.dataAlvo)) {
    const p = progressoObjetivo(o, config, valores, cotacoes);
    itens.push({
      icone: o.emoji ?? '🎯',
      texto: `${o.nome} está ${p.pct.toFixed(0)}% concluído`,
      tom: 'neutro',
    });
  }
  return itens;
};

export type StatusLimite = 'seguro' | 'atencao' | 'cuidado';

export interface LimiteGastos {
  /** Quanto ainda dá para gastar no mês. Negativo = o mês já está no vermelho. */
  disponivel: number;
  porDia: number;
  ate: string;
  diasRestantes: number;
  jaGasto: number;
  /** Maior entre o aporte planejado e o já feito. */
  investimentos: number;
  contasFixas: number;
  /** Projeção do disponível no fim do mês, no ritmo atual de gastos variáveis. */
  projecaoFim: number;
  status: StatusLimite;
}

/**
 * Disponível = renda − já gasto − investimentos (planejado ou feito, o maior) − contas fixas que ainda vão cair.
 *
 * - 🔴 cuidado: já está negativo ou, no ritmo atual, termina o mês negativo.
 * - 🟡 atenção: os gastos variáveis por dia estão acima do planejado (orçamento por categoria ou, sem ele, o que
 *   sobra da renda depois de fixas e investimentos).
 * - 🟢 seguro: dentro do planejado.
 */
export const limiteGastos = (
  resumo: ResumoMes,
  transacoes: Transacao[],
  config: Config,
  cotacoes: Cotacoes,
  hoje: string,
): LimiteGastos => {
  const mes = resumo.mes;
  const totalDias = diasNoMes(mes);
  const diaHoje = Number(hoje.slice(8, 10));
  const diasRestantes = totalDias - diaHoje + 1;

  const contasFixas = soma(
    recorrentesPendentes(config.recorrentes ?? [], hoje)
      .map((p) => p.recorrente)
      .flatMap((r) => (r.tipo === 'transacao' && !isEntrada(r.tipoTransacao) ? [r.val] : [])),
  );
  const investimentos = Math.max(aportePlanejado(config, cotacoes), resumo.investimentos);
  const disponivel = resumo.renda - resumo.gastos - investimentos - contasFixas;

  // Ritmo só dos gastos variáveis: contas fixas lançadas pelas recorrências distorcem a média diária.
  const saidas = transacoesDaCompetencia(transacoes, mes).filter((t) => !t.isEntrada);
  const variaveis = soma(saidas.filter((t) => !t.recorrenteId).map((t) => t.val));
  const fixasLancadas = soma(saidas.filter((t) => t.recorrenteId).map((t) => t.val));
  const ritmo = variaveis / diaHoje;
  const projecaoFim = disponivel - ritmo * (diasRestantes - 1);

  const orcado = soma(Object.values(config.orcamentos ?? {}).map((v) => v ?? 0));
  const variavelPlanejado = orcado > 0 ? orcado : resumo.renda - investimentos - fixasLancadas - contasFixas;
  const ritmoPlanejado = variavelPlanejado / totalDias;

  const status: StatusLimite =
    disponivel < 0 || projecaoFim < 0 ? 'cuidado' : ritmo > ritmoPlanejado ? 'atencao' : 'seguro';

  return {
    disponivel,
    porDia: Math.max(0, disponivel) / diasRestantes,
    ate: dataNoMes(mes, totalDias),
    diasRestantes,
    jaGasto: resumo.gastos,
    investimentos,
    contasFixas,
    projecaoFim,
    status,
  };
};
