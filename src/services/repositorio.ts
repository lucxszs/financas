import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
  type WriteBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  resumoRegistro,
  semIdDoc,
  type EntidadeHistorico,
  type NovoRegistro,
  type OrigemHistorico,
  type RegistroHistorico,
} from '../domain/auditoria';
import { mesAtualIso } from '../domain/datas';
import {
  aporteDeRecorrente,
  idLancamentoRecorrente,
  marcarLancados,
  semRetroativo,
  transacaoDeRecorrente,
  valorPrevisto,
  type LancamentoRecorrente,
} from '../domain/recorrentes';
import type {
  Aporte,
  Config,
  DadosIniciais,
  FechamentoMes,
  Saldos,
  Snapshot,
  Transacao,
} from '../domain/types';

// Todos os dados ficam em /users/{uid}/..., protegidos por firestore.rules.
const perfilDoc = (uid: string, id: 'config' | 'saldos') => doc(db, 'users', uid, 'perfil', id);
type Colecao = 'transacoes' | 'aportes' | 'snapshots' | 'fechamentosMes' | 'historico';
const colecao = (uid: string, nome: Colecao) => collection(db, 'users', uid, nome);

type SemId<T> = Omit<T, 'id'>;
type Erro = (e: Error) => void;

export const observarConfig = (uid: string, cb: (c: Config | null) => void, erro: Erro) =>
  onSnapshot(perfilDoc(uid, 'config'), (s) => cb(s.exists() ? (s.data() as Config) : null), erro);

export const observarSaldos = (uid: string, cb: (s: Saldos | null) => void, erro: Erro) =>
  onSnapshot(perfilDoc(uid, 'saldos'), (s) => cb(s.exists() ? (s.data() as Saldos) : null), erro);

const observarColecao = <T>(
  uid: string,
  nome: Colecao,
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
  observarColecao<Aporte>(uid, 'aportes', 'data', limit(1000), cb, erro);

export const observarSnapshots = (uid: string, cb: (s: Snapshot[]) => void, erro: Erro) =>
  observarColecao<Snapshot>(uid, 'snapshots', 'mes', limit(36), cb, erro);

export const observarFechamentosMes = (uid: string, cb: (f: FechamentoMes[]) => void, erro: Erro) =>
  observarColecao<FechamentoMes>(uid, 'fechamentosMes', 'mes', limit(36), cb, erro);

export const observarHistorico = (uid: string, cb: (r: RegistroHistorico[]) => void, erro: Erro) =>
  observarColecao<RegistroHistorico>(uid, 'historico', 'em', limit(300), cb, erro);

// ── Gravações ──
// Toda gravação vai num batch junto com o registro do histórico (users/{uid}/historico): ou entram os dois, ou
// nenhum. O histórico guarda o documento antes e depois, para saber o que mudou e desfazer exclusões.

// O Firestore rejeita campos `undefined`; os documentos só têm tipos JSON, então o round-trip remove esses campos.
const semIndefinidos = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const registrar = (
  batch: WriteBatch,
  uid: string,
  entidade: EntidadeHistorico,
  docId: string,
  antes: object | null | undefined,
  depois: object | null | undefined,
  origem: OrigemHistorico = 'usuario',
) => {
  const a = semIdDoc(antes);
  const d = semIdDoc(depois);
  const registro: NovoRegistro = {
    acao: !a ? 'criar' : !d ? 'excluir' : 'editar',
    entidade,
    docId,
    resumo: resumoRegistro(entidade, d ?? a).slice(0, 200),
    origem,
    antes: a,
    depois: d,
  };
  batch.set(doc(colecao(uid, 'historico')), semIndefinidos({ ...registro, em: new Date().toISOString() }));
};

const gravar = async (montar: (batch: WriteBatch) => void) => {
  const batch = writeBatch(db);
  montar(batch);
  await batch.commit();
};

/** Grava a foto do mês. As regras só permitem criar: se o mês já foi fechado, a gravação é recusada. */
export const fecharMes = (uid: string, f: FechamentoMes) =>
  gravar((b) => {
    b.set(doc(colecao(uid, 'fechamentosMes'), f.mes), f);
    registrar(b, uid, 'fechamentoMes', f.mes, null, f);
  });

export const reabrirMes = (uid: string, f: FechamentoMes) =>
  gravar((b) => {
    b.delete(doc(colecao(uid, 'fechamentosMes'), f.mes));
    registrar(b, uid, 'fechamentoMes', f.mes, f, null);
  });

/** Foto de um mês passado (preenche o histórico) sem mexer nos saldos atuais. */
export const salvarSnapshot = (uid: string, snapshot: Snapshot, antes: Snapshot | null) =>
  gravar((b) => {
    b.set(doc(colecao(uid, 'snapshots'), snapshot.mes), snapshot);
    registrar(b, uid, 'snapshot', snapshot.mes, antes, snapshot);
  });

export const salvarSaldos = (
  uid: string,
  saldos: Saldos,
  snapshot: Snapshot,
  antes: { saldos: Saldos; snapshot: Snapshot | null },
) =>
  gravar((b) => {
    b.set(perfilDoc(uid, 'saldos'), saldos);
    b.set(doc(colecao(uid, 'snapshots'), snapshot.mes), snapshot);
    registrar(b, uid, 'saldos', 'saldos', antes.saldos, saldos);
    registrar(b, uid, 'snapshot', snapshot.mes, antes.snapshot, snapshot);
  });

export const criarTransacao = (uid: string, t: SemId<Transacao>) =>
  gravar((b) => {
    const ref = doc(colecao(uid, 'transacoes'));
    b.set(ref, t);
    registrar(b, uid, 'transacao', ref.id, null, t);
  });

export const atualizarTransacao = (uid: string, id: string, t: SemId<Transacao>, antes: Transacao) =>
  gravar((b) => {
    b.set(doc(colecao(uid, 'transacoes'), id), t);
    registrar(b, uid, 'transacao', id, antes, t);
  });

export const excluirTransacao = (uid: string, t: Transacao) =>
  gravar((b) => {
    b.delete(doc(colecao(uid, 'transacoes'), t.id));
    registrar(b, uid, 'transacao', t.id, t, null);
  });

/** Compra parcelada: todas as parcelas em um batch (ou todas ou nenhuma). */
export const criarParcelas = (uid: string, parcelas: SemId<Transacao>[]) =>
  gravar((b) => {
    for (const p of parcelas) {
      const ref = doc(colecao(uid, 'transacoes'));
      b.set(ref, p);
      registrar(b, uid, 'transacao', ref.id, null, p);
    }
  });

/** Aplica os mesmos campos em várias transações (ex.: descrição e categoria de todas as parcelas). */
export const atualizarTransacoes = (uid: string, itens: Transacao[], campos: Partial<SemId<Transacao>>) =>
  gravar((b) => {
    for (const t of itens) {
      b.update(doc(colecao(uid, 'transacoes'), t.id), campos);
      registrar(b, uid, 'transacao', t.id, t, { ...t, ...campos });
    }
  });

export const excluirTransacoes = (uid: string, itens: Transacao[]) =>
  gravar((b) => {
    for (const t of itens) {
      b.delete(doc(colecao(uid, 'transacoes'), t.id));
      registrar(b, uid, 'transacao', t.id, t, null);
    }
  });

export const criarAporte = (uid: string, a: SemId<Aporte>) =>
  gravar((b) => {
    const ref = doc(colecao(uid, 'aportes'));
    b.set(ref, a);
    registrar(b, uid, 'aporte', ref.id, null, a);
  });

export const atualizarAporte = (uid: string, id: string, a: SemId<Aporte>, antes: Aporte) =>
  gravar((b) => {
    b.set(doc(colecao(uid, 'aportes'), id), a);
    registrar(b, uid, 'aporte', id, antes, a);
  });

export const excluirAporte = (uid: string, a: Aporte) =>
  gravar((b) => {
    b.delete(doc(colecao(uid, 'aportes'), a.id));
    registrar(b, uid, 'aporte', a.id, a, null);
  });

export const salvarConfig = (uid: string, config: Config, antes: Config) =>
  gravar((b) => {
    const nova = semIndefinidos(config);
    b.set(perfilDoc(uid, 'config'), nova);
    registrar(b, uid, 'config', 'config', antes, nova);
  });

/** Desfaz a exclusão de um lançamento ou aporte: o documento volta com o mesmo id e o conteúdo de antes. */
export const restaurarExclusao = (uid: string, r: RegistroHistorico) =>
  gravar((b) => {
    if (!r.antes || (r.entidade !== 'transacao' && r.entidade !== 'aporte'))
      throw new Error('Nada para restaurar');
    const nome = r.entidade === 'transacao' ? 'transacoes' : 'aportes';
    b.set(doc(colecao(uid, nome), r.docId), r.antes);
    registrar(b, uid, r.entidade, r.docId, null, r.antes, 'restauracao');
  });

/**
 * Grava os lançamentos das recorrências e marca os meses como lançados, tudo no mesmo batch.
 * Os ids são determinísticos: se outro dispositivo já lançou, a regra de edição (criadoEm imutável) recusa o batch
 * inteiro e nada é duplicado. O `lancadoAte` da config é controle interno e não entra no histórico.
 */
export const lancarRecorrentes = async (
  uid: string,
  config: Config,
  itens: LancamentoRecorrente[],
  transacoes: Transacao[],
) => {
  if (!itens.length) return;
  const agora = new Date().toISOString();
  await gravar((b) => {
    for (const { recorrente: r, mes, data } of itens) {
      const id = idLancamentoRecorrente(r.id, mes);
      if (r.tipo === 'aporte') {
        const a = aporteDeRecorrente(r, data, agora);
        b.set(doc(colecao(uid, 'aportes'), id), a);
        registrar(b, uid, 'aporte', id, null, a, 'recorrencia');
      } else {
        const t = transacaoDeRecorrente(r, data, config.cartoes, agora, valorPrevisto(r, transacoes));
        b.set(doc(colecao(uid, 'transacoes'), id), t);
        registrar(b, uid, 'transacao', id, null, t, 'recorrencia');
      }
    }
    const recorrentes = marcarLancados(config.recorrentes ?? [], itens);
    b.set(perfilDoc(uid, 'config'), semIndefinidos({ ...config, recorrentes }));
  });
};

/** Grava config, saldos e snapshots de uma vez (primeiro acesso). */
export const importarDados = (uid: string, dados: DadosIniciais) =>
  gravar((b) => {
    const recorrentes = dados.config.recorrentes && semRetroativo(dados.config.recorrentes, mesAtualIso());
    const config = semIndefinidos({ ...dados.config, recorrentes });
    b.set(perfilDoc(uid, 'config'), config);
    b.set(perfilDoc(uid, 'saldos'), {
      valores: dados.saldos?.valores ?? {},
      updatedAt: null,
    } satisfies Saldos);
    for (const s of dados.snapshots ?? []) b.set(doc(colecao(uid, 'snapshots'), s.mes), s);
    registrar(b, uid, 'config', 'config', null, config, 'importacao');
  });
