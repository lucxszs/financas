import { mesDaFatura, somarEmBRL, totalSnapshot } from './calculos';
import { somarMeses } from './datas';
import type { Config, Cotacoes, Snapshot, Transacao } from './types';

/**
 * Faturas de cartão ainda não pagas: a do mês (até o dia do vencimento) e as futuras.
 * Cartão sem dia de vencimento cadastrado: a fatura do mês conta como aberta até o fim do mês.
 */
export const dividasCartoes = (config: Config, transacoes: Transacao[], hoje: string) => {
  const mes = hoje.slice(0, 7);
  const diaHoje = Number(hoje.slice(8, 10));
  let total = 0;
  for (const c of config.cartoes) {
    const venceu = c.diaVencimento !== undefined && diaHoje > c.diaVencimento;
    const primeiroAberto = venceu ? somarMeses(mes, 1) : mes;
    total += transacoes
      .filter((t) => t.cartao === c.id && !t.isEntrada && mesDaFatura(t) >= primeiroAberto)
      .reduce((a, t) => a + t.val, 0);
  }
  return total;
};

export interface Patrimonio {
  investimentos: number;
  contas: number;
  ativos: number;
  dividas: number;
  liquido: number;
  /** false quando alguma caixinha em moeda estrangeira ficou fora por falta de cotação. */
  completo: boolean;
}

export const patrimonioAtual = (
  config: Config,
  valores: Record<string, number>,
  cotacoes: Cotacoes,
  transacoes: Transacao[],
  hoje: string,
): Patrimonio => {
  const inv = somarEmBRL(
    config.caixinhas.filter((c) => c.tipo !== 'conta'),
    valores,
    cotacoes,
  );
  const contas = somarEmBRL(
    config.caixinhas.filter((c) => c.tipo === 'conta'),
    valores,
    cotacoes,
  );
  const dividas = dividasCartoes(config, transacoes, hoje);
  const ativos = inv.total + contas.total;
  return {
    investimentos: inv.total,
    contas: contas.total,
    ativos,
    dividas,
    liquido: ativos - dividas,
    completo: inv.completo && contas.completo,
  };
};

/** Patrimônio líquido de um mês fechado: ativos da foto (com a cotação dela) menos as dívidas gravadas. */
export const liquidoSnapshot = (s: Snapshot, config: Config, cotacoesAtuais: Cotacoes) =>
  totalSnapshot(s, config, cotacoesAtuais).total - (s.dividas ?? 0);
