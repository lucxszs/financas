import { mesDaFatura, pct } from './calculos';
import { dataNoMes, parseDataIso, somarMeses } from './datas';
import type { Cartao, LimiteInformado, Transacao } from './types';

/**
 * Mês ("YYYY-MM") do vencimento da fatura em que uma compra cai. `null` se o cartão não tem o melhor dia cadastrado.
 *
 * Compra antes do melhor dia entra na fatura que fecha neste mês; no melhor dia ou depois, na que fecha no mês
 * seguinte. Se o vencimento é antes do melhor dia no calendário (ex.: fecha 28, vence 05), a fatura vence no mês
 * depois do fechamento.
 */
export const mesFaturaSugerido = (cartao: Cartao, dataCompra: string): string | null => {
  const melhor = cartao.melhorDiaCompra;
  if (!melhor) return null;
  const dia = Number(dataCompra.slice(8, 10));
  const mesCompra = dataCompra.slice(0, 7);
  const mesFechamento = dia >= melhor ? somarMeses(mesCompra, 1) : mesCompra;
  const vencimento = cartao.diaVencimento ?? melhor;
  return vencimento >= melhor ? mesFechamento : somarMeses(mesFechamento, 1);
};

export const MAX_PARCELAS = 48;

/** Divide em centavos; a diferença do arredondamento fica na 1ª parcela (como fazem os bancos). */
export const valoresParcelas = (total: number, n: number) => {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / n);
  return Array.from({ length: n }, (_, i) => (i === 0 ? centavos - base * (n - 1) : base) / 100);
};

/**
 * Uma transação por parcela, cada uma no seu mês de fatura. A data de cada parcela anda junto (data da compra + k
 * meses), para parcelas futuras de compras antigas continuarem dentro do histórico carregado.
 */
export const montarParcelas = (
  base: Omit<Transacao, 'id' | 'val' | 'data' | 'mesFatura' | 'grupoId' | 'parcela'>,
  total: number,
  n: number,
  dataCompra: string,
  primeiroMesFatura: string,
  grupoId: string,
): Omit<Transacao, 'id'>[] => {
  const dia = Number(dataCompra.slice(8, 10));
  return valoresParcelas(total, n).map((val, i) => ({
    ...base,
    val,
    data: dataNoMes(somarMeses(dataCompra.slice(0, 7), i), dia),
    mesFatura: somarMeses(primeiroMesFatura, i),
    grupoId,
    parcela: { atual: i + 1, total: n },
  }));
};

/** Primeira fatura ainda não paga do cartão: depois do dia do vencimento, a do mês já passou. */
export const primeiraFaturaAberta = (cartao: Cartao, hoje: string) => {
  const mes = hoje.slice(0, 7);
  const venceu = cartao.diaVencimento !== undefined && Number(hoje.slice(8, 10)) > cartao.diaVencimento;
  return venceu ? somarMeses(mes, 1) : mes;
};

/** Dias até o próximo melhor dia de compra (0 = hoje). null sem o dia cadastrado. */
export const diasAteMelhorDia = (cartao: Cartao, hoje: string) => {
  if (!cartao.melhorDiaCompra) return null;
  const mes = hoje.slice(0, 7);
  const alvoEsteMes = dataNoMes(mes, cartao.melhorDiaCompra);
  const alvo = alvoEsteMes >= hoje ? alvoEsteMes : dataNoMes(somarMeses(mes, 1), cartao.melhorDiaCompra);
  return Math.round((parseDataIso(alvo).getTime() - parseDataIso(hoje).getTime()) / 86_400_000);
};

export interface ResumoCartao {
  cartao: Cartao;
  mesAtual: string;
  /** Faturas pelos lançamentos do app. */
  faturaAtual: number;
  proximaFatura: number;
  /** Tudo que cai depois da próxima fatura (na prática, parcelas). */
  futuras: number;
  /** Limite em uso: pelo banco (se informado) ou pelos lançamentos. */
  emAberto: number;
  disponivel: number;
  pct: number;
  diasMelhorDia: number | null;
  /** Limite informado no "Atualizar saldos"; null = calculado só pelos lançamentos. */
  informado: LimiteInformado | null;
  /** Uso no banco que não está lançado no app (compras e parcelas não lançadas). */
  naoLancado: number;
}

const gastosDoCartao = (cartao: Cartao, transacoes: Transacao[]) =>
  transacoes.filter((t) => t.cartao === cartao.id && !t.isEntrada);

/**
 * Faturas e limite de um cartão.
 *
 * Sem limite informado, o limite em uso é a soma dos lançamentos em aberto (fatura atual, próxima e futuras).
 * Com limite informado (o que o app do banco mostra), ele vale como verdade naquele momento, e as compras lançadas
 * depois dele são descontadas. A diferença entre o uso no banco e o que estava lançado vira "não lançado".
 */
export const resumoCartao = (
  cartao: Cartao,
  transacoes: Transacao[],
  hoje: string,
  informado?: LimiteInformado,
): ResumoCartao => {
  const mesAtual = primeiraFaturaAberta(cartao, hoje);
  const proximo = somarMeses(mesAtual, 1);
  let faturaAtual = 0;
  let proximaFatura = 0;
  let futuras = 0;
  let lancadoAntes = 0;
  let lancadoDepois = 0;
  for (const t of gastosDoCartao(cartao, transacoes)) {
    const m = mesDaFatura(t);
    if (m < mesAtual) continue;
    if (m === mesAtual) faturaAtual += t.val;
    else if (m === proximo) proximaFatura += t.val;
    else futuras += t.val;
    if (informado && t.criadoEm > informado.em) lancadoDepois += t.val;
    else lancadoAntes += t.val;
  }
  const lancado = faturaAtual + proximaFatura + futuras;
  // O banco bloqueia no limite o valor total das compras em aberto, inclusive parcelas futuras.
  const emAberto = informado ? cartao.limite - informado.disponivel + lancadoDepois : lancado;
  return {
    cartao,
    mesAtual,
    faturaAtual,
    proximaFatura,
    futuras,
    emAberto,
    disponivel: cartao.limite - emAberto,
    pct: pct(emAberto, cartao.limite),
    diasMelhorDia: diasAteMelhorDia(cartao, hoje),
    informado: informado ?? null,
    naoLancado: informado ? Math.max(0, cartao.limite - informado.disponivel - lancadoAntes) : 0,
  };
};

/**
 * % do limite total dos cartões em uso: pelo limite informado do banco ou, sem ele, pelas faturas em aberto
 * lançadas (fatura já vencida conta como paga). null sem cartões com limite.
 */
export const limiteComprometido = (
  cartoes: Cartao[],
  transacoes: Transacao[],
  hoje: string,
  informados: Record<string, LimiteInformado> = {},
) => {
  const limite = cartoes.reduce((a, c) => a + c.limite, 0);
  if (limite <= 0) return null;
  const emAberto = cartoes.reduce(
    (a, c) => a + resumoCartao(c, transacoes, hoje, informados[c.id]).emAberto,
    0,
  );
  return (emAberto / limite) * 100;
};

/** Soma das faturas de todos os cartões nos próximos `n` meses, a partir do mês atual (só faturas em aberto). */
export const comprometimentoFuturo = (cartoes: Cartao[], transacoes: Transacao[], hoje: string, n = 6) => {
  const meses = Array.from({ length: n }, (_, i) => somarMeses(hoje.slice(0, 7), i));
  return meses.map((mes) => ({
    mes,
    valor: cartoes.reduce(
      (acc, c) =>
        mes < primeiraFaturaAberta(c, hoje)
          ? acc
          : acc + gastosDoCartao(c, transacoes).reduce((a, t) => (mesDaFatura(t) === mes ? a + t.val : a), 0),
      0,
    ),
  }));
};
