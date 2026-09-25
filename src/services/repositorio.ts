import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mesAtualIso } from '../domain/datas';
import {
  aporteDeRecorrente,
  idLancamentoRecorrente,
  marcarLancados,
  semRetroativo,
  transacaoDeRecorrente,
  type LancamentoRecorrente,
} from '../domain/recorrentes';
import type { Aporte, Config, DadosIniciais, Fechamento, Saldos, Snapshot, Transacao } from '../domain/types';

// Todos os dados ficam em /users/{uid}/..., protegidos por firestore.rules.
const perfilDoc = (uid: string, id: 'config' | 'saldos') => doc(db, 'users', uid, 'perfil', id);
const colecao = (uid: string, nome: 'transacoes' | 'aportes' | 'snapshots' | 'fechamentos') =>
  collection(db, 'users', uid, nome);

type SemId<T> = Omit<T, 'id'>;
type Erro = (e: Error) => void;

export const temAcesso = async (uid: string) => (await getDoc(doc(db, 'acessos', uid))).exists();

export const observarConfig = (uid: string, cb: (c: Config | null) => void, erro: Erro) =>
  onSnapshot(perfilDoc(uid, 'config'), (s) => cb(s.exists() ? (s.data() as Config) : null), erro);

export const observarSaldos = (uid: string, cb: (s: Saldos | null) => void, erro: Erro) =>
  onSnapshot(perfilDoc(uid, 'saldos'), (s) => cb(s.exists() ? (s.data() as Saldos) : null), erro);

const observarColecao = <T>(
  uid: string,
  nome: 'transacoes' | 'aportes' | 'snapshots' | 'fechamentos',
  campoOrdem: string,
  filtro: QueryConstraint,
  cb: (itens: T[]) => void,
  erro: Erro,
): Unsubscribe =>
  onSnapshot(
    query(colecao(uid, nome), filtro, orderBy(campoOrdem, 'desc')),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    erro,
  );

/** Transações a partir de `desde` ("YYYY-MM-DD"), incluindo parcelas futuras. */
export const observarTransacoes = (uid: string, desde: string, cb: (t: Transacao[]) => void, erro: Erro) =>
  observarColecao<Transacao>(uid, 'transacoes', 'data', where('data', '>=', desde), cb, erro);

export const observarAportes = (uid: string, cb: (a: Aporte[]) => void, erro: Erro) =>
  observarColecao<Aporte>(uid, 'aportes', 'data', limit(200), cb, erro);

export const observarSnapshots = (uid: string, cb: (s: Snapshot[]) => void, erro: Erro) =>
  observarColecao<Snapshot>(uid, 'snapshots', 'mes', limit(36), cb, erro);

export const observarFechamentos = (uid: string, cb: (f: Fechamento[]) => void, erro: Erro) =>
  observarColecao<Fechamento>(uid, 'fechamentos', 'mes', limit(24), cb, erro);

export const salvarSaldos = async (uid: string, saldos: Saldos, snapshot: Snapshot) => {
  const batch = writeBatch(db);
  batch.set(perfilDoc(uid, 'saldos'), saldos);
  batch.set(doc(colecao(uid, 'snapshots'), snapshot.mes), snapshot);
  await batch.commit();
};

export const criarTransacao = (uid: string, t: SemId<Transacao>) => addDoc(colecao(uid, 'transacoes'), t);
export const atualizarTransacao = (uid: string, id: string, t: SemId<Transacao>) =>
  setDoc(doc(colecao(uid, 'transacoes'), id), t);
export const excluirTransacao = (uid: string, id: string) => deleteDoc(doc(colecao(uid, 'transacoes'), id));

export const criarAporte = (uid: string, a: SemId<Aporte>) => addDoc(colecao(uid, 'aportes'), a);
export const atualizarAporte = (uid: string, id: string, a: SemId<Aporte>) =>
  setDoc(doc(colecao(uid, 'aportes'), id), a);
export const excluirAporte = (uid: string, id: string) => deleteDoc(doc(colecao(uid, 'aportes'), id));

// O Firestore rejeita campos `undefined`; a config só tem tipos JSON, então o round-trip remove esses campos.
const semIndefinidos = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const salvarConfig = (uid: string, config: Config) =>
  setDoc(perfilDoc(uid, 'config'), semIndefinidos(config));

/**
 * Grava os lançamentos das recorrências e marca os meses como lançados, tudo no mesmo batch.
 * Os ids são determinísticos: se outro dispositivo já lançou, a regra de edição (criadoEm imutável) recusa o batch
 * inteiro e nada é duplicado.
 */
export const lancarRecorrentes = async (uid: string, config: Config, itens: LancamentoRecorrente[]) => {
  if (!itens.length) return;
  const agora = new Date().toISOString();
  const batch = writeBatch(db);
  for (const { recorrente: r, mes, data } of itens) {
    const id = idLancamentoRecorrente(r.id, mes);
    if (r.tipo === 'aporte') batch.set(doc(colecao(uid, 'aportes'), id), aporteDeRecorrente(r, data, agora));
    else
      batch.set(doc(colecao(uid, 'transacoes'), id), transacaoDeRecorrente(r, data, config.cartoes, agora));
  }
  const recorrentes = marcarLancados(config.recorrentes ?? [], itens);
  batch.set(perfilDoc(uid, 'config'), semIndefinidos({ ...config, recorrentes }));
  await batch.commit();
};

/** Grava config, saldos, snapshots e fechamentos de uma vez (primeiro acesso). */
export const importarDados = async (uid: string, dados: DadosIniciais) => {
  const batch = writeBatch(db);
  const recorrentes = dados.config.recorrentes && semRetroativo(dados.config.recorrentes, mesAtualIso());
  batch.set(perfilDoc(uid, 'config'), semIndefinidos({ ...dados.config, recorrentes }));
  batch.set(perfilDoc(uid, 'saldos'), {
    valores: dados.saldos?.valores ?? {},
    ...(dados.saldos?.score ? { score: dados.saldos.score } : {}),
    updatedAt: null,
  } satisfies Saldos);
  for (const s of dados.snapshots ?? []) batch.set(doc(colecao(uid, 'snapshots'), s.mes), s);
  for (const f of dados.fechamentos ?? []) batch.set(doc(colecao(uid, 'fechamentos'), f.mes), f);
  await batch.commit();
};
