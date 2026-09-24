import type { Cotacoes, MoedaEstrangeira } from '../domain/types';

// https://docs.awesomeapi.com.br/api-de-moedas
// GET /json/last/USD-BRL,EUR-BRL -> { USDBRL: { bid: "5.18", ... }, EURBRL: { ... } }
const URL_BASE = 'https://economia.awesomeapi.com.br/json/last/';

interface ParAwesome {
  bid: string;
  create_date: string;
}

export interface ResultadoCotacao {
  cotacoes: Cotacoes;
  atualizadoEm: string | null;
}

export const buscarCotacoes = async (
  moedas: MoedaEstrangeira[],
  signal?: AbortSignal,
): Promise<ResultadoCotacao> => {
  if (!moedas.length) return { cotacoes: {}, atualizadoEm: null };

  const pares = moedas.map((m) => `${m}-BRL`).join(',');
  const resp = await fetch(URL_BASE + pares, { signal });
  if (!resp.ok) throw new Error(`AwesomeAPI respondeu ${resp.status}`);

  const json = (await resp.json()) as Record<string, ParAwesome | undefined>;
  const cotacoes: Cotacoes = {};
  let atualizadoEm: string | null = null;

  for (const m of moedas) {
    const par = json[`${m}BRL`];
    const valor = par ? Number(par.bid) : NaN;
    if (Number.isFinite(valor) && valor > 0) {
      cotacoes[m] = valor;
      atualizadoEm = par?.create_date ?? atualizadoEm;
    }
  }

  if (!Object.keys(cotacoes).length) throw new Error('Resposta sem cotações válidas');
  return { cotacoes, atualizadoEm };
};
