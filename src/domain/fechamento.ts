import { paraBRL, transacoesDaCompetencia } from './calculos';
import { diasNoMes, somarMeses } from './datas';
import { orcamentoPorCategoria } from './historico';
import { liquidoSnapshot } from './patrimonio';
import { resumoMes } from './resumo';
import type { Aporte, Config, Cotacoes, FechamentoMes, Snapshot, Transacao } from './types';

export interface DadosFechamento {
  transacoes: Transacao[];
  aportes: Aporte[];
  snapshots: Snapshot[];
  fechamentos: FechamentoMes[];
  config: Config;
  cotacoes: Cotacoes;
  /** Patrimônio líquido de agora, usado quando o mês fechado é o atual. */
  patrimonioAgora: number;
  hoje: string;
}

/** Patrimônio de um mês: o do fechamento, senão o da foto dos saldos. */
const patrimonioDoMes = (mes: string, d: DadosFechamento): number | null => {
  const fechado = d.fechamentos.find((f) => f.mes === mes);
  if (fechado) return fechado.patrimonio;
  const foto = d.snapshots.find((s) => s.mes === mes);
  return foto ? liquidoSnapshot(foto, d.config, d.cotacoes) : null;
};

export const montarFechamento = (mes: string, d: DadosFechamento, fechadoEm: string): FechamentoMes => {
  const r = resumoMes(d.transacoes, d.aportes, d.config, d.cotacoes, mes);
  const saidas = transacoesDaCompetencia(d.transacoes, mes).filter((t) => !t.isEntrada);
  const maior = saidas.reduce<Transacao | null>((a, t) => (!a || t.val > a.val ? t : a), null);
  const categoria = orcamentoPorCategoria(d.transacoes, d.config, mes).find((l) => l.real > 0);

  const aportesPorMeta = d.config.objetivos
    .map((o) => ({
      objetivoId: o.id,
      nome: o.nome,
      ...(o.emoji && { emoji: o.emoji }),
      valor: d.aportes
        .filter((a) => a.data.startsWith(mes) && o.caixinhas.includes(a.caixinha))
        .reduce((acc, a) => {
          const moeda = d.config.caixinhas.find((c) => c.id === a.caixinha)?.moeda ?? 'BRL';
          return acc + (paraBRL(a.val, moeda, d.cotacoes) ?? 0);
        }, 0),
    }))
    .filter((m) => m.valor > 0);

  const patrimonio = mes === d.hoje.slice(0, 7) ? d.patrimonioAgora : patrimonioDoMes(mes, d);
  const anterior = patrimonioDoMes(somarMeses(mes, -1), d);

  return {
    mes,
    fechadoEm,
    renda: r.renda,
    rendaPrevista: r.rendaPrevista,
    gastos: r.gastos,
    investimentos: r.investimentos,
    saldo: r.saldoLivre,
    taxaPoupanca: r.taxaPoupanca,
    maiorCategoria: categoria ? { cat: categoria.cat, valor: categoria.real } : null,
    maiorGasto: maior ? { desc: maior.desc, valor: maior.val } : null,
    aportesPorMeta,
    patrimonio,
    variacaoPatrimonio: patrimonio !== null && anterior !== null ? patrimonio - anterior : null,
  };
};

/** Até quantos meses para trás o app oferece fechar (o histórico carregado é de 12 meses). */
const MESES_PARA_TRAS = 12;

/**
 * Meses que dá para fechar, do mais antigo ao mais recente: os meses passados com movimento e ainda abertos
 * (até 12 para trás) e, no último dia dele, o mês atual.
 */
export const mesesParaFechar = (
  d: Pick<DadosFechamento, 'transacoes' | 'aportes' | 'fechamentos'>,
  hoje: string,
): string[] => {
  const atual = hoje.slice(0, 7);
  const fechado = (m: string) => d.fechamentos.some((f) => f.mes === m);
  const teveMovimento = (m: string) =>
    transacoesDaCompetencia(d.transacoes, m).length > 0 || d.aportes.some((a) => a.data.startsWith(m));
  const meses = Array.from({ length: MESES_PARA_TRAS }, (_, i) =>
    somarMeses(atual, i - MESES_PARA_TRAS),
  ).filter((m) => !fechado(m) && teveMovimento(m));
  const ultimoDia = Number(hoje.slice(8, 10)) === diasNoMes(atual);
  return ultimoDia && !fechado(atual) ? [...meses, atual] : meses;
};
