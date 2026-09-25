import { useCallback, useEffect, useState } from 'react';
import {
  buscarCotacoes,
  guardarCotacao,
  lerCotacaoGuardada,
  type ResultadoCotacao,
} from '../services/cotacao';
import type { MoedaEstrangeira } from '../domain/types';

/** `antiga` = a API falhou e a cotação exibida é a última guardada. */
export type StatusCotacao = 'loading' | 'ok' | 'antiga' | 'erro';

// USD e EUR sempre são buscadas, mesmo sem caixinha nessas moedas, para exibir o câmbio.
const MOEDAS: MoedaEstrangeira[] = ['USD', 'EUR'];
const INTERVALO_MS = 5 * 60 * 1000;
const TENTATIVAS = 3;
const ESPERA_BASE_MS = 2000;

const esperar = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new DOMException('abortado', 'AbortError'));
      },
      { once: true },
    );
  });

/** Tenta de novo com espera crescente (2s, 4s) antes de desistir. */
const buscarComTentativas = async (signal: AbortSignal) => {
  for (let i = 1; ; i++) {
    try {
      return await buscarCotacoes(MOEDAS, signal);
    } catch (e) {
      if (signal.aborted || i >= TENTATIVAS) throw e;
      await esperar(ESPERA_BASE_MS * 2 ** (i - 1), signal);
    }
  }
};

const SEM_COTACOES = {};

export const useCotacoes = () => {
  // Começa pela última cotação guardada: os totais em BRL aparecem antes da rede responder.
  const [resultado, setResultado] = useState<ResultadoCotacao | null>(lerCotacaoGuardada);
  const [status, setStatus] = useState<StatusCotacao>('loading');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const carregar = () => {
      setStatus('loading');
      buscarComTentativas(ctrl.signal)
        .then((r) => {
          guardarCotacao(r);
          setResultado(r);
          setStatus('ok');
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          console.error('Falha ao buscar cotação', e);
          const guardada = lerCotacaoGuardada();
          if (guardada) setResultado(guardada);
          setStatus(guardada ? 'antiga' : 'erro');
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

  const cotacoes = resultado?.cotacoes ?? SEM_COTACOES;
  const atualizadoEm = resultado?.atualizadoEm ?? null;

  return { cotacoes, status, atualizadoEm, recarregar };
};
