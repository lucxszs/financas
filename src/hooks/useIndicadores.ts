import { useEffect, useMemo, useState } from 'react';
import {
  buscarSerie,
  guardarSerie,
  lerSerieGuardada,
  serieValida,
  type PontoMensal,
} from '../services/indicadores';

export type StatusIndicadores = 'loading' | 'ok' | 'antiga' | 'erro';

interface Series {
  cdi: PontoMensal[];
  ipca: PontoMensal[];
}

const VAZIO: Series = { cdi: [], ipca: [] };

/** CDI e IPCA mensais a partir de `desde` ("YYYY-MM"). Usa o cache de 24h; se a API cair, o último guardado. */
export const useIndicadores = (desde: string | null) => {
  // Cache lido no render; o efeito só grava estado quando a resposta da API chega.
  const guardadas = useMemo(() => {
    if (!desde) return null;
    const cdi = lerSerieGuardada('cdi', desde);
    const ipca = lerSerieGuardada('ipca', desde);
    return cdi && ipca
      ? { series: { cdi: cdi.pontos, ipca: ipca.pontos }, valida: serieValida(cdi) && serieValida(ipca) }
      : null;
  }, [desde]);
  const [buscado, setBuscado] = useState<{ desde: string; series: Series } | null>(null);
  const [falhou, setFalhou] = useState<string | null>(null);

  useEffect(() => {
    if (!desde || guardadas?.valida) return;
    const ctrl = new AbortController();
    Promise.all([buscarSerie('cdi', desde, ctrl.signal), buscarSerie('ipca', desde, ctrl.signal)])
      .then(([cdi, ipca]) => {
        guardarSerie('cdi', desde, cdi);
        guardarSerie('ipca', desde, ipca);
        setBuscado({ desde, series: { cdi, ipca } });
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        console.error('Falha ao buscar CDI/IPCA', e);
        setFalhou(desde);
      });
    return () => ctrl.abort();
  }, [desde, guardadas]);

  if (buscado && buscado.desde === desde) return { ...buscado.series, status: 'ok' as StatusIndicadores };
  if (guardadas?.valida) return { ...guardadas.series, status: 'ok' as StatusIndicadores };
  if (falhou === desde)
    return { ...(guardadas?.series ?? VAZIO), status: (guardadas ? 'antiga' : 'erro') as StatusIndicadores };
  return { ...(guardadas?.series ?? VAZIO), status: 'loading' as StatusIndicadores };
};
