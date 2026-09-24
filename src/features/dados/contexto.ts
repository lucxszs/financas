import { createContext } from 'react';
import type { StatusCotacao } from '../../hooks/useCotacoes';
import type { Aporte, Config, Cotacoes, Fechamento, Saldos, Snapshot, Transacao } from '../../domain/types';

export interface Dados {
  uid: string;
  /** undefined = carregando, null = ainda não configurado. */
  config: Config | null | undefined;
  saldos: Saldos;
  transacoes: Transacao[];
  aportes: Aporte[];
  snapshots: Snapshot[];
  fechamentos: Fechamento[];
  cotacoes: Cotacoes;
  statusCotacao: StatusCotacao;
  cotacaoAtualizadaEm: string | null;
  recarregarCotacao: () => void;
  erro: string | null;
}

export const DadosContext = createContext<Dados | null>(null);
