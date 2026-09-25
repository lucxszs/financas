import { somarMeses } from './datas';
import type { Cartao } from './types';

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
