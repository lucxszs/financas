import { fmt } from './formatadores';

// Histórico de alterações: cada criação, edição e exclusão grava um registro imutável em users/{uid}/historico.

export type AcaoHistorico = 'criar' | 'editar' | 'excluir';
export type EntidadeHistorico = 'transacao' | 'aporte' | 'config' | 'saldos' | 'snapshot' | 'fechamentoMes';
/** Quem fez: você no app, uma recorrência automática, a importação do primeiro acesso ou uma restauração. */
export type OrigemHistorico = 'usuario' | 'recorrencia' | 'importacao' | 'restauracao';

type Dados = Record<string, unknown>;

export interface RegistroHistorico {
  id: string;
  /** ISO. */
  em: string;
  acao: AcaoHistorico;
  entidade: EntidadeHistorico;
  /** Id do documento alterado (ex.: id da transação, "config", "2026-09"). */
  docId: string;
  resumo: string;
  origem: OrigemHistorico;
  antes: Dados | null;
  depois: Dados | null;
}

export type NovoRegistro = Omit<RegistroHistorico, 'id' | 'em'>;

export const ROTULO_ENTIDADE: Record<EntidadeHistorico, string> = {
  transacao: 'Lançamento',
  aporte: 'Aporte',
  config: 'Configurações',
  saldos: 'Saldos',
  snapshot: 'Foto do mês',
  fechamentoMes: 'Fechamento',
};

export const ROTULO_ORIGEM: Record<OrigemHistorico, string> = {
  usuario: 'você',
  recorrencia: 'recorrência',
  importacao: 'importação',
  restauracao: 'restauração',
};

const num = (v: unknown) => (typeof v === 'number' ? v : null);
const txt = (v: unknown) => (typeof v === 'string' ? v : '');

/** Frase curta do que foi alterado, a partir do documento (depois ou, na exclusão, antes). */
export const resumoRegistro = (entidade: EntidadeHistorico, dados: Dados | null): string => {
  const d = dados ?? {};
  const valor = num(d.val);
  switch (entidade) {
    case 'transacao': {
      const parcela = d.parcela as { atual?: number; total?: number } | undefined;
      const sufixo = parcela?.total ? ` (${parcela.atual}/${parcela.total})` : '';
      return `${txt(d.desc) || 'Lançamento'}${sufixo}${valor !== null ? ` · ${fmt(valor)}` : ''}`;
    }
    case 'aporte':
      return `Aporte em ${txt(d.caixinha) || 'caixinha'}${valor !== null ? ` · ${valor.toLocaleString('pt-BR')}` : ''}`;
    case 'snapshot':
      return `Foto dos saldos de ${txt(d.mes)}`;
    case 'fechamentoMes':
      return `Fechamento de ${txt(d.mes)}`;
    default:
      return ROTULO_ENTIDADE[entidade];
  }
};

/** Campos técnicos que mudam em toda edição e não dizem nada ao usuário. */
const IGNORADOS = new Set(['atualizadoEm', 'updatedAt', 'criadoEm', 'id']);

export interface CampoAlterado {
  campo: string;
  antes: unknown;
  depois: unknown;
}

/** Campos de primeiro nível que mudaram entre antes e depois. */
export const camposAlterados = (antes: Dados | null, depois: Dados | null): CampoAlterado[] => {
  const chaves = new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]);
  return [...chaves]
    .filter((c) => !IGNORADOS.has(c))
    .filter((c) => JSON.stringify(antes?.[c]) !== JSON.stringify(depois?.[c]))
    .sort()
    .map((campo) => ({ campo, antes: antes?.[campo], depois: depois?.[campo] }));
};

/** Valor curto para exibir na lista de alterações. Objetos e listas aparecem resumidos. */
export const textoValor = (v: unknown): string => {
  if (v === undefined || v === null || v === '') return '·';
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return `${v.length} ${v.length === 1 ? 'item' : 'itens'}`;
  return '(alterado)';
};

/** Exclusões de lançamento e de aporte podem ser desfeitas: o documento volta com o mesmo id. */
export const podeRestaurar = (r: RegistroHistorico) =>
  r.acao === 'excluir' && (r.entidade === 'transacao' || r.entidade === 'aporte') && r.antes !== null;

/** Tira o `id` (que vem do listener, não é campo do documento) antes de guardar no histórico. */
export const semIdDoc = <T extends object>(d: T | null | undefined): Dados | null => {
  if (!d) return null;
  const { id: _id, ...resto } = d as T & { id?: unknown };
  return resto as Dados;
};
