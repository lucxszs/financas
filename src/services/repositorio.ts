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
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  max: number,
  cb: (itens: T[]) => void,
  erro: Erro,
): Unsubscribe =>
  onSnapshot(
    query(colecao(uid, nome), orderBy(campoOrdem, 'desc'), limit(max)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    erro,
  );

export const observarTransacoes = (uid: string, cb: (t: Transacao[]) => void, erro: Erro) =>
  observarColecao<Transacao>(uid, 'transacoes', 'data', 300, cb, erro);

export const observarAportes = (uid: string, cb: (a: Aporte[]) => void, erro: Erro) =>
  observarColecao<Aporte>(uid, 'aportes', 'data', 200, cb, erro);

export const observarSnapshots = (uid: string, cb: (s: Snapshot[]) => void, erro: Erro) =>
  observarColecao<Snapshot>(uid, 'snapshots', 'mes', 36, cb, erro);

export const observarFechamentos = (uid: string, cb: (f: Fechamento[]) => void, erro: Erro) =>
  observarColecao<Fechamento>(uid, 'fechamentos', 'mes', 24, cb, erro);

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

export const salvarConfig = (uid: string, config: Config) => setDoc(perfilDoc(uid, 'config'), config);

/** Grava config, saldos, snapshots e fechamentos de uma vez (primeiro acesso). */
export const importarDados = async (uid: string, dados: DadosIniciais) => {
  const batch = writeBatch(db);
  batch.set(perfilDoc(uid, 'config'), dados.config);
  batch.set(perfilDoc(uid, 'saldos'), {
    valores: dados.saldos?.valores ?? {},
    ...(dados.saldos?.score ? { score: dados.saldos.score } : {}),
    updatedAt: null,
  } satisfies Saldos);
  for (const s of dados.snapshots ?? []) batch.set(doc(colecao(uid, 'snapshots'), s.mes), s);
  for (const f of dados.fechamentos ?? []) batch.set(doc(colecao(uid, 'fechamentos'), f.mes), f);
  await batch.commit();
};
