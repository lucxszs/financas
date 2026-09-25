import type {
  Caixinha,
  Cartao,
  Config,
  Cotacoes,
  Fechamento,
  Moeda,
  Objetivo,
  ScoreMes,
  Snapshot,
  Transacao,
} from './types';

/** Converte para BRL. Retorna null quando falta a cotação da moeda. */
export const paraBRL = (valor: number, moeda: Moeda, cotacoes: Cotacoes): number | null => {
  if (moeda === 'BRL') return valor;
  const taxa = cotacoes[moeda];
  return taxa ? valor * taxa : null;
};

export const saldoCaixinha = (valores: Record<string, number>, id: string) => valores[id] ?? 0;

/** Soma em BRL das caixinhas informadas. Caixinhas sem cotação ficam de fora (`completo = false`). */
export const somarEmBRL = (caixinhas: Caixinha[], valores: Record<string, number>, cotacoes: Cotacoes) => {
  let total = 0;
  let completo = true;
  for (const c of caixinhas) {
    const brl = paraBRL(saldoCaixinha(valores, c.id), c.moeda, cotacoes);
    if (brl === null) completo = false;
    else total += brl;
  }
  return { total, completo };
};

export const pct = (valor: number, meta: number) => (meta > 0 ? Math.min(100, (valor / meta) * 100) : 0);

export const progressoObjetivo = (
  objetivo: Objetivo,
  config: Config,
  valores: Record<string, number>,
  cotacoes: Cotacoes,
) => {
  const caixinhas = config.caixinhas.filter((c) => objetivo.caixinhas.includes(c.id));
  const { total, completo } = somarEmBRL(caixinhas, valores, cotacoes);
  return {
    guardado: total,
    faltam: Math.max(0, objetivo.meta - total),
    pct: pct(total, objetivo.meta),
    concluido: total >= objetivo.meta,
    completo,
  };
};

/** Rendimento mensal estimado das caixinhas em BRL (juros simples mensais sobre a taxa anual). */
export const rendimentoMensalEstimado = (config: Config, valores: Record<string, number>) => {
  const emReais = config.caixinhas.filter((c) => c.moeda === 'BRL');
  const { total } = somarEmBRL(emReais, valores, {});
  return Math.round((total * config.taxaAnualEstimada) / 12);
};

export type ClasseScore = 'verde' | 'amarelo' | 'vermelho';

export const calcularScore = (score: ScoreMes = {}) => {
  let pts = 0;
  if (score.pagou === 'sim') pts += 1;
  else if (score.pagou === 'parcial') pts += 0.5;
  if (score.positivo === 'sim') pts += 1;
  if (score.aporte === 'sim') pts += 1;
  else if (score.aporte === 'parcial') pts += 0.5;

  if (pts >= 2.5) return { icon: '🟢', label: 'Mês excelente', cls: 'verde' as ClasseScore, pts };
  if (pts >= 1.5) return { icon: '🟡', label: 'Mês razoável', cls: 'amarelo' as ClasseScore, pts };
  return { icon: '🔴', label: 'Mês difícil: não desanima', cls: 'vermelho' as ClasseScore, pts };
};

/** Mês de fatura de uma transação: o informado ou o mês da própria data. */
export const mesDaFatura = (t: Transacao) => t.mesFatura ?? t.data.slice(0, 7);

export const usoCartao = (cartao: Cartao, transacoes: Transacao[], mes: string) => {
  const utilizado = transacoes
    .filter((t) => t.cartao === cartao.id && !t.isEntrada && mesDaFatura(t) === mes)
    .reduce((acc, t) => acc + t.val, 0);
  return { utilizado, disponivel: cartao.limite - utilizado, pct: pct(utilizado, cartao.limite) };
};

/**
 * Mês em que a transação pesa no orçamento: compra no cartão conta no mês da fatura (quando se paga),
 * o resto no mês da data.
 */
export const mesCompetencia = (t: Transacao) => t.mesFatura ?? t.data.slice(0, 7);

export const transacoesDaCompetencia = (transacoes: Transacao[], mes: string) =>
  transacoes.filter((t) => mesCompetencia(t) === mes);

export const resumoTransacoes = (transacoes: Transacao[]) => {
  const entradas = transacoes.filter((t) => t.isEntrada).reduce((a, t) => a + t.val, 0);
  const saidas = transacoes.filter((t) => !t.isEntrada).reduce((a, t) => a + t.val, 0);
  return { entradas, saidas, saldo: entradas - saidas };
};

export const totaisFechamento = (f: Fechamento) => {
  const entradas = f.itens.filter((i) => i.tipo === 'entrada').reduce((a, i) => a + i.valor, 0);
  const saidas = f.itens.filter((i) => i.tipo === 'saida').reduce((a, i) => a + i.valor, 0);
  const pendente = f.itens
    .filter((i) => i.tipo === 'saida' && i.pago === false)
    .reduce((a, i) => a + i.valor, 0);
  return { entradas, saidas, saldo: entradas - saidas, pendente };
};

/** Total em BRL de um snapshot, usando a cotação gravada nele (ou a atual, se não houver). */
export const totalSnapshot = (s: Snapshot, config: Config, cotacoesAtuais: Cotacoes) => {
  const cotacoes = { ...cotacoesAtuais, ...s.cotacoes };
  return somarEmBRL(config.caixinhas, s.valores, cotacoes);
};
