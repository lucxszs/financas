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
  /** Data/hora da cotação informada pela AwesomeAPI, ex.: "2026-09-24 13:53:12". */
  atualizadoEm: string | null;
}

export const lerAwesome = (json: unknown, moedas: MoedaEstrangeira[]): ResultadoCotacao => {
  const dados = (json ?? {}) as Record<string, ParAwesome | undefined>;
  const cotacoes: Cotacoes = {};
  let atualizadoEm: string | null = null;
  for (const m of moedas) {
    const par = dados[`${m}BRL`];
    const valor = par ? Number(par.bid) : NaN;
    if (Number.isFinite(valor) && valor > 0) {
      cotacoes[m] = valor;
      atualizadoEm = par?.create_date ?? atualizadoEm;
    }
  }
  return { cotacoes, atualizadoEm };
};

export const buscarCotacoes = async (
  moedas: MoedaEstrangeira[],
  signal?: AbortSignal,
): Promise<ResultadoCotacao> => {
  if (!moedas.length) return { cotacoes: {}, atualizadoEm: null };

  const pares = moedas.map((m) => `${m}-BRL`).join(',');
  const resp = await fetch(URL_BASE + pares, { signal });
  if (!resp.ok) throw new Error(`AwesomeAPI respondeu ${resp.status}`);

  const r = lerAwesome(await resp.json(), moedas);
  if (!Object.keys(r.cotacoes).length) throw new Error('Resposta sem cotações válidas');
  return r;
};

// Última cotação boa, para o câmbio não sumir quando a API cai.
// localStorage pode não existir ou lançar (aba anônima, dados bloqueados): tudo em try/catch.
const CHAVE_CACHE = 'financas:ultima-cotacao';

export const guardarCotacao = (r: ResultadoCotacao) => {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(r));
  } catch {
    // sem armazenamento: segue sem cache
  }
};

export const lerCotacaoGuardada = (): ResultadoCotacao | null => {
  try {
    const bruto = localStorage.getItem(CHAVE_CACHE);
    if (!bruto) return null;
    const r = JSON.parse(bruto) as Partial<ResultadoCotacao>;
    if (!r.cotacoes || !Object.keys(r.cotacoes).length) return null;
    return { cotacoes: r.cotacoes, atualizadoEm: r.atualizadoEm ?? null };
  } catch {
    return null;
  }
};
