import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hojeIso, somarMeses } from '../../domain/datas';
import { recorrentesALancar } from '../../domain/recorrentes';
import { useCotacoes } from '../../hooks/useCotacoes';
import {
  lancarRecorrentes,
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

/** Histórico carregado: 13 meses completos (o atual + 12), mais as parcelas futuras. */
const MESES_DE_HISTORICO = 12;
const inicioDoHistorico = () => `${somarMeses(hojeIso().slice(0, 7), -MESES_DE_HISTORICO)}-01`;

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
      observarTransacoes(uid, inicioDoHistorico(), setTransacoes, onErro),
      observarAportes(uid, setAportes, onErro),
      observarSnapshots(uid, setSnapshots, onErro),
      observarFechamentos(uid, setFechamentos, onErro),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [uid]);

  // Lança as recorrências vencidas sempre que a config muda (inclusive ao abrir o app).
  // Depois de gravar, a config volta pelo listener com `lancadoAte` atualizado e não há mais nada a lançar.
  const lancando = useRef(false);
  useEffect(() => {
    if (!config?.recorrentes?.length || lancando.current) return;
    const itens = recorrentesALancar(config.recorrentes, hojeIso());
    if (!itens.length) return;
    lancando.current = true;
    lancarRecorrentes(uid, config, itens)
      .catch((e: unknown) => console.error('Falha ao lançar recorrências', e))
      .finally(() => {
        lancando.current = false;
      });
  }, [uid, config]);

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
