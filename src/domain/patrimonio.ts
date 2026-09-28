import { somarEmBRL, totalSnapshot } from './calculos';
import { resumoCartao } from './cartoes';
import type { Config, Cotacoes, LimiteInformado, Snapshot, Transacao } from './types';

/**
 * Dívida nos cartões: o limite em uso de cada um (faturas não pagas, incluindo parcelas futuras). Usa o limite
 * informado do banco quando existe; senão, os lançamentos em aberto.
 */
export const dividasCartoes = (
  config: Config,
  transacoes: Transacao[],
  hoje: string,
  informados: Record<string, LimiteInformado> = {},
) => config.cartoes.reduce((a, c) => a + resumoCartao(c, transacoes, hoje, informados[c.id]).emAberto, 0);

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
  informados: Record<string, LimiteInformado> = {},
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
  const dividas = dividasCartoes(config, transacoes, hoje, informados);
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
