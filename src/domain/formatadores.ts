import type { Moeda } from './types';

const LOCALE: Record<Moeda, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };

const formatadores = new Map<Moeda, Intl.NumberFormat>();

export const formatarMoeda = (valor: number, moeda: Moeda = 'BRL') => {
  let f = formatadores.get(moeda);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[moeda], { style: 'currency', currency: moeda });
    formatadores.set(moeda, f);
  }
  return f.format(valor);
};

export const fmt = (valor: number) => formatarMoeda(valor, 'BRL');

/** Valor em BRL sem o símbolo, para números grandes em destaque. */
export const fmtSemSimbolo = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtPct = (valor: number, casas = 0) => `${valor.toFixed(casas)}%`;

const compacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Para eixos de gráfico: "R$ 5,4 mil". */
export const fmtCompacto = (valor: number) => compacto.format(valor);
