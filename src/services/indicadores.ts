// Séries do Banco Central (SGS): https://dadosabertos.bcb.gov.br/dataset/sgs
// GET /dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/MM/yyyy -> [{ data: "01/09/2026", valor: "1.09" }]
const URL_SGS = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';

/** 4391 = CDI acumulado no mês (%); 433 = IPCA do mês (%). */
export const SERIES = { cdi: 4391, ipca: 433 } as const;
export type Indicador = keyof typeof SERIES;

export interface PontoMensal {
  /** "YYYY-MM" */
  mes: string;
  /** % no mês, ex.: 1.09 */
  valor: number;
}

export const lerSerieSgs = (json: unknown): PontoMensal[] =>
  (Array.isArray(json) ? json : []).flatMap((p: { data?: string; valor?: string }) => {
    const m = /^\d{2}\/(\d{2})\/(\d{4})$/.exec(p.data ?? '');
    const valor = Number(p.valor);
    return m && Number.isFinite(valor) ? [{ mes: `${m[2]}-${m[1]}`, valor }] : [];
  });

export const buscarSerie = async (indicador: Indicador, desde: string, signal?: AbortSignal) => {
  const [a, m] = desde.split('-');
  const resp = await fetch(`${URL_SGS}${SERIES[indicador]}/dados?formato=json&dataInicial=01/${m}/${a}`, {
    signal,
  });
  if (!resp.ok) throw new Error(`Banco Central respondeu ${resp.status}`);
  return lerSerieSgs(await resp.json());
};

// As séries mudam uma vez por mês: cache de 24h no navegador, e o último valor guardado serve de reserva se a API cair.
const CHAVE = (i: Indicador, desde: string) => `financas:sgs:${i}:${desde}`;
const VALIDADE_MS = 24 * 60 * 60 * 1000;

export interface SerieGuardada {
  pontos: PontoMensal[];
  buscadoEm: string;
}

export const lerSerieGuardada = (i: Indicador, desde: string): SerieGuardada | null => {
  try {
    const bruto = localStorage.getItem(CHAVE(i, desde));
    const r = bruto ? (JSON.parse(bruto) as SerieGuardada) : null;
    return r && Array.isArray(r.pontos) && typeof r.buscadoEm === 'string' ? r : null;
  } catch {
    return null;
  }
};

export const guardarSerie = (i: Indicador, desde: string, pontos: PontoMensal[]) => {
  try {
    localStorage.setItem(CHAVE(i, desde), JSON.stringify({ pontos, buscadoEm: new Date().toISOString() }));
  } catch {
    // sem armazenamento: segue sem cache
  }
};

export const serieValida = (s: SerieGuardada | null) =>
  s !== null && Date.now() - new Date(s.buscadoEm).getTime() < VALIDADE_MS;
