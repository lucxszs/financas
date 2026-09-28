import { resumoCartao } from './cartoes';
import { progressoObjetivo } from './calculos';
import { fmt } from './formatadores';
import { ritmoObjetivo } from './metas';
import { aportePlanejado, mediaGastos, type LimiteGastos, type ResumoMes } from './resumo';
import type { Aporte, Config, Cotacoes, Objetivo, Transacao } from './types';

export type Sinal = 'verde' | 'amarelo' | 'vermelho';

export interface Indicador {
  id: 'gastos' | 'investimentos' | 'cartoes' | 'metas' | 'reserva';
  nome: string;
  sinal: Sinal;
  detalhe: string;
}

const pctTexto = (v: number) => `${v.toFixed(0)}%`;

/** Reserva de emergência: o objetivo marcado ou, sem marcação, o que tem "emerg"/"reserva" no nome. */
export const objetivoReserva = (config: Config): Objetivo | undefined =>
  config.objetivos.find((o) => o.reservaEmergencia) ??
  config.objetivos.find((o) => /emerg|reserva/i.test(`${o.id} ${o.nome}`));

export interface EntradaSaude {
  config: Config;
  valores: Record<string, number>;
  cotacoes: Cotacoes;
  transacoes: Transacao[];
  aportes: Aporte[];
  resumo: ResumoMes;
  limite: LimiteGastos;
  hoje: string;
}

/**
 * Cinco sinais em vez de uma nota única (uma nota esconde onde está o problema):
 *
 * - 💰 Gastos: o status do limite de gastos.
 * - 📈 Investimentos: aporte do mês × planejado. Até a metade do mês, não ter aportado ainda é amarelo, não vermelho.
 * - 💳 Cartões: quanto do limite total está comprometido (até 50% verde, até 80% amarelo).
 * - 🎯 Metas: pior ritmo entre as metas com data (no ritmo verde; até 10% abaixo amarelo).
 * - 💵 Reserva: quantos meses de gastos a reserva cobre (6+ verde, 3+ amarelo).
 */
export const saudeFinanceira = (e: EntradaSaude): Indicador[] => {
  const { config, resumo, limite, hoje } = e;
  const itens: Indicador[] = [];

  const SINAL_LIMITE = { seguro: 'verde', atencao: 'amarelo', cuidado: 'vermelho' } as const;
  itens.push({
    id: 'gastos',
    nome: 'Gastos',
    sinal: SINAL_LIMITE[limite.status],
    detalhe: `${pctTexto(resumo.gastosSobreRenda)} da renda · ${fmt(Math.max(0, limite.disponivel))} livres`,
  });

  const planejado = aportePlanejado(config, e.cotacoes);
  if (planejado > 0) {
    const p = (resumo.investimentos / planejado) * 100;
    const inicioDoMes = Number(hoje.slice(8, 10)) <= 15;
    itens.push({
      id: 'investimentos',
      nome: 'Investimentos',
      sinal: p >= 100 ? 'verde' : p > 0 || inicioDoMes ? 'amarelo' : 'vermelho',
      detalhe: `${fmt(resumo.investimentos)} de ${fmt(planejado)} (${pctTexto(p)})`,
    });
  }

  if (config.cartoes.length) {
    const resumos = config.cartoes.map((c) => resumoCartao(c, e.transacoes, hoje));
    const limiteTotal = resumos.reduce((a, r) => a + r.cartao.limite, 0);
    const p = limiteTotal > 0 ? (resumos.reduce((a, r) => a + r.emAberto, 0) / limiteTotal) * 100 : 0;
    itens.push({
      id: 'cartoes',
      nome: 'Cartões',
      sinal: p <= 50 ? 'verde' : p <= 80 ? 'amarelo' : 'vermelho',
      detalhe: `${pctTexto(p)} do limite comprometido`,
    });
  }

  const comData = config.objetivos.filter((o) => o.dataAlvo);
  if (comData.length) {
    const ritmos = comData
      .map((o) => ({ o, r: ritmoObjetivo(o, config, e.valores, e.cotacoes, e.aportes, hoje) }))
      .filter(({ r }) => r.necessarioMes !== null && r.diferenca !== null);
    const pior = ritmos.reduce<(typeof ritmos)[number] | null>(
      (a, x) => (!a || x.r.diferenca! / x.r.necessarioMes! < a.r.diferenca! / a.r.necessarioMes! ? x : a),
      null,
    );
    const razao = pior ? pior.r.diferenca! / pior.r.necessarioMes! : 0;
    itens.push({
      id: 'metas',
      nome: 'Metas',
      sinal: razao >= 0 ? 'verde' : razao >= -0.1 ? 'amarelo' : 'vermelho',
      detalhe:
        pior && razao < 0
          ? `${pior.o.nome}: faltam ${fmt(-pior.r.diferenca!)}/mês`
          : `${comData.length === 1 ? 'Meta no' : 'Todas as metas no'} ritmo`,
    });
  }

  const reserva = objetivoReserva(config);
  const media = mediaGastos(e.transacoes, config, resumo.mes) ?? resumo.gastos;
  if (reserva && media > 0) {
    const guardado = progressoObjetivo(reserva, config, e.valores, e.cotacoes).guardado;
    const meses = guardado / media;
    itens.push({
      id: 'reserva',
      nome: 'Reserva',
      sinal: meses >= 6 ? 'verde' : meses >= 3 ? 'amarelo' : 'vermelho',
      detalhe: `cobre ${meses.toFixed(1).replace('.', ',')} ${meses >= 1 && meses < 2 ? 'mês' : 'meses'} de gastos`,
    });
  }

  return itens;
};
