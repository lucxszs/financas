import { useCallback, useEffect, useState } from 'react';
import { buscarCotacoes } from '../services/cotacao';
import type { Cotacoes, MoedaEstrangeira } from '../domain/types';

export type StatusCotacao = 'loading' | 'ok' | 'erro';

// USD e EUR sempre são buscadas, mesmo sem caixinha nessas moedas, para exibir o câmbio.
const MOEDAS: MoedaEstrangeira[] = ['USD', 'EUR'];
const INTERVALO_MS = 5 * 60 * 1000;

export const useCotacoes = () => {
  const [cotacoes, setCotacoes] = useState<Cotacoes>({});
  const [status, setStatus] = useState<StatusCotacao>('loading');
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const carregar = () => {
      setStatus('loading');
      buscarCotacoes(MOEDAS, ctrl.signal)
        .then((r) => {
          setCotacoes(r.cotacoes);
          setAtualizadoEm(r.atualizadoEm);
          setStatus('ok');
        })
        .catch((e: unknown) => {
          if (!ctrl.signal.aborted) {
            console.error('Falha ao buscar cotação', e);
            setStatus('erro');
          }
        });
    };
    carregar();
    const timer = setInterval(carregar, INTERVALO_MS);
    return () => {
      ctrl.abort();
      clearInterval(timer);
    };
  }, [tentativa]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  return { cotacoes, status, atualizadoEm, recarregar };
};
