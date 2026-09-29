import { mesDaFatura, paraBRL } from './calculos';
import { isEntrada } from './catalogos';
import { dataNoMes, somarMeses } from './datas';
import { valorPrevisto } from './recorrentes';
import type { Config, Cotacoes, Transacao } from './types';

export type TipoEvento = 'entrada' | 'saida' | 'aporte' | 'fatura';

export interface EventoCalendario {
  data: string;
  desc: string;
  /** Sempre positivo, em BRL; o tipo diz se entra ou sai. */
  valor: number;
  tipo: TipoEvento;
  /** Recorrência já lançada ou fatura já vencida. */
  feito: boolean;
  /** Valor estimado (recorrência de valor variável). */
  estimado?: boolean;
}

const mesesEntre = (inicio: string, fim: string) => {
  const meses: string[] = [];
  for (let m = inicio.slice(0, 7); m <= fim.slice(0, 7); m = somarMeses(m, 1)) meses.push(m);
  return meses;
};

/**
 * Entradas e saídas previstas entre duas datas (inclusive):
 * - recorrências ativas (as no cartão ficam de fora: já estão na fatura);
 * - vencimento de cada fatura de cartão com valor.
 */
export const eventosDoPeriodo = (
  config: Config,
  transacoes: Transacao[],
  cotacoes: Cotacoes,
  inicio: string,
  fim: string,
  hoje: string,
): EventoCalendario[] => {
  const eventos: EventoCalendario[] = [];
  for (const mes of mesesEntre(inicio, fim)) {
    for (const r of config.recorrentes ?? []) {
      if (!r.ativo || r.inicio > mes || (r.tipo === 'transacao' && r.cartao)) continue;
      const data = dataNoMes(mes, r.dia);
      if (data < inicio || data > fim) continue;
      const feito = Boolean(r.lancadoAte && r.lancadoAte >= mes);
      if (r.tipo === 'aporte') {
        const moeda = config.caixinhas.find((c) => c.id === r.caixinha)?.moeda ?? 'BRL';
        eventos.push({
          data,
          desc: r.desc,
          valor: paraBRL(r.val, moeda, cotacoes) ?? 0,
          tipo: 'aporte',
          feito,
        });
      } else {
        const tipo = isEntrada(r.tipoTransacao) ? 'entrada' : 'saida';
        eventos.push({
          data,
          desc: r.desc,
          valor: valorPrevisto(r, transacoes),
          tipo,
          feito,
          ...(r.variavel && { estimado: true }),
        });
      }
    }
    for (const c of config.cartoes) {
      if (!c.diaVencimento) continue;
      const data = dataNoMes(mes, c.diaVencimento);
      if (data < inicio || data > fim) continue;
      const valor = transacoes
        .filter((t) => t.cartao === c.id && !t.isEntrada && mesDaFatura(t) === mes)
        .reduce((a, t) => a + t.val, 0);
      if (valor > 0)
        eventos.push({ data, desc: `Fatura ${c.nome}`, valor, tipo: 'fatura', feito: data < hoje });
    }
  }
  return eventos.sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === 'entrada' ? -1 : 1));
};

/** Saldo previsto de uma lista de eventos: entradas − saídas, aportes e faturas. */
export const saldoPrevisto = (eventos: EventoCalendario[]) =>
  eventos.reduce((a, e) => a + (e.tipo === 'entrada' ? e.valor : -e.valor), 0);
