import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCotacoes } from '../../hooks/useCotacoes';
import {
  observarAportes,
  observarConfig,
  observarFechamentos,
  observarSaldos,
  observarSnapshots,
  observarTransacoes,
} from '../../services/repositorio';
import type { Aporte, Config, Fechamento, Saldos, Snapshot, Transacao } from '../../domain/types';
import { DadosContext, type Dados } from './contexto';

const SALDOS_VAZIOS: Saldos = { valores: {}, updatedAt: null };

export const DadosProvider = ({ uid, children }: { uid: string; children: ReactNode }) => {
  const [config, setConfig] = useState<Config | null | undefined>(undefined);
  const [saldos, setSaldos] = useState<Saldos>(SALDOS_VAZIOS);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const { cotacoes, status, atualizadoEm, recarregar } = useCotacoes();

  useEffect(() => {
    const onErro = (e: Error) => {
      console.error(e);
      setErro(e.message);
    };
    const subs = [
      observarConfig(uid, setConfig, onErro),
      observarSaldos(uid, (s) => setSaldos(s ?? SALDOS_VAZIOS), onErro),
      observarTransacoes(uid, setTransacoes, onErro),
      observarAportes(uid, setAportes, onErro),
      observarSnapshots(uid, setSnapshots, onErro),
      observarFechamentos(uid, setFechamentos, onErro),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [uid]);

  const valor = useMemo<Dados>(
    () => ({
      uid,
      config,
      saldos,
      transacoes,
      aportes,
      snapshots,
      fechamentos,
      cotacoes,
      statusCotacao: status,
      cotacaoAtualizadaEm: atualizadoEm,
      recarregarCotacao: recarregar,
      erro,
    }),
    [
      uid,
      config,
      saldos,
      transacoes,
      aportes,
      snapshots,
      fechamentos,
      cotacoes,
      status,
      atualizadoEm,
      recarregar,
      erro,
    ],
  );

  return <DadosContext.Provider value={valor}>{children}</DadosContext.Provider>;
};
