import { paraBRL, progressoObjetivo } from './calculos';
import { mesesAte, parseDataIso, progressoTemporal, somarMeses } from './datas';
import type { Aporte, Config, Cotacoes, Objetivo } from './types';

export interface RitmoObjetivo {
  guardado: number;
  faltam: number;
  pctFinanceiro: number;
  /** % do tempo entre o início e a data alvo; null sem as duas datas. */
  pctTemporal: number | null;
  mesesRestantes: number | null;
  /** Quanto precisa guardar por mês para chegar na data alvo; null sem data alvo. */
  necessarioMes: number | null;
  /** Média de aportes nos 3 meses anteriores; sem aportes, o aporte mensal planejado. */
  atualMes: number;
  fonteAtual: 'aportes' | 'planejado';
  /** atual − necessário: negativo = abaixo do ritmo. */
  diferenca: number | null;
  /** Mês ("YYYY-MM") em que a meta é atingida no ritmo atual; null se o ritmo é zero. */
  previsao: string | null;
  concluido: boolean;
}

const MESES_MEDIA = 3;

const mediaAportes = (
  o: Objetivo,
  config: Config,
  aportes: Aporte[],
  cotacoes: Cotacoes,
  mesAtual: string,
) => {
  const inicio = somarMeses(mesAtual, -MESES_MEDIA);
  const total = aportes
    .filter(
      (a) =>
        o.caixinhas.includes(a.caixinha) && a.data.slice(0, 7) >= inicio && a.data.slice(0, 7) < mesAtual,
    )
    .reduce((acc, a) => {
      const moeda = config.caixinhas.find((c) => c.id === a.caixinha)?.moeda ?? 'BRL';
      return acc + (paraBRL(a.val, moeda, cotacoes) ?? 0);
    }, 0);
  return total / MESES_MEDIA;
};

export const ritmoObjetivo = (
  o: Objetivo,
  config: Config,
  valores: Record<string, number>,
  cotacoes: Cotacoes,
  aportes: Aporte[],
  hoje: string,
): RitmoObjetivo => {
  const agora = parseDataIso(hoje);
  const mesAtual = hoje.slice(0, 7);
  const p = progressoObjetivo(o, config, valores, cotacoes);
  const alvo = o.dataAlvo ? parseDataIso(o.dataAlvo) : null;
  const mesesRestantes = alvo ? mesesAte(alvo, agora) : null;
  const pctTemporal =
    alvo && o.dataInicio ? progressoTemporal(parseDataIso(o.dataInicio), alvo, agora) : null;
  // No mês da data alvo (0 meses), o que falta precisa entrar de uma vez.
  const necessarioMes =
    mesesRestantes === null || p.concluido ? null : p.faltam / Math.max(1, mesesRestantes);

  const media = mediaAportes(o, config, aportes, cotacoes, mesAtual);
  const fonteAtual = media > 0 ? 'aportes' : 'planejado';
  const atualMes = media > 0 ? media : (o.aporteMensal ?? 0);
  const previsao = p.concluido
    ? mesAtual
    : atualMes > 0
      ? somarMeses(mesAtual, Math.ceil(p.faltam / atualMes))
      : null;

  return {
    guardado: p.guardado,
    faltam: p.faltam,
    pctFinanceiro: p.pct,
    pctTemporal,
    mesesRestantes,
    necessarioMes,
    atualMes,
    fonteAtual,
    diferenca: necessarioMes === null ? null : atualMes - necessarioMes,
    previsao,
    concluido: p.concluido,
  };
};
