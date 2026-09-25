import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Roda contra o emulador: `npm run test:rules` (usa firebase emulators:exec).

let env: RulesTestEnvironment;

const DONO = 'dono';
const INTRUSO = 'intruso';
const SEM_ACESSO = 'sem-acesso';

const transacao = (extra: Record<string, unknown> = {}) => ({
  desc: 'Mercado',
  val: 50,
  tipo: 'debito',
  cat: 'mercado',
  data: '2026-09-24',
  isEntrada: false,
  cartao: null,
  mesFatura: null,
  obs: '',
  criadoEm: '2026-09-24T12:00:00.000Z',
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-financas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'acessos', DONO), {});
    await setDoc(doc(db, 'acessos', INTRUSO), {});
    await setDoc(doc(db, 'users', DONO, 'perfil', 'config'), { nome: 'x' });
  });
});

const dbDe = (uid: string | null) =>
  uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();

describe('acesso anônimo', () => {
  it('não lê nem escreve nada', async () => {
    const db = dbDe(null);
    await assertFails(getDoc(doc(db, 'users', DONO, 'perfil', 'config')));
    await assertFails(setDoc(doc(db, 'users', DONO, 'perfil', 'config'), { nome: 'hack' }));
    await assertFails(getDoc(doc(db, 'acessos', DONO)));
  });

  it('não acessa as coleções legadas da raiz', async () => {
    await assertFails(getDoc(doc(dbDe(null), 'transacoes', 'qualquer')));
    await assertFails(addDoc(collection(dbDe(DONO), 'transacoes'), transacao()));
  });
});

describe('allowlist', () => {
  it('usuário logado sem /acessos não usa o app', async () => {
    const db = dbDe(SEM_ACESSO);
    await assertSucceeds(getDoc(doc(db, 'acessos', SEM_ACESSO)));
    await assertFails(setDoc(doc(db, 'users', SEM_ACESSO, 'perfil', 'config'), { nome: 'x' }));
  });

  it('ninguém se autolibera', async () => {
    await assertFails(setDoc(doc(dbDe(SEM_ACESSO), 'acessos', SEM_ACESSO), {}));
  });

  it('não lê o registro de acesso de outra pessoa', async () => {
    await assertFails(getDoc(doc(dbDe(INTRUSO), 'acessos', DONO)));
  });
});

describe('isolamento por usuário', () => {
  it('dono lê e escreve os próprios dados', async () => {
    const db = dbDe(DONO);
    await assertSucceeds(getDoc(doc(db, 'users', DONO, 'perfil', 'config')));
    await assertSucceeds(setDoc(doc(db, 'users', DONO, 'perfil', 'saldos'), { valores: {} }));
    await assertSucceeds(setDoc(doc(db, 'users', DONO, 'snapshots', '2026-09'), { mes: '2026-09' }));
  });

  it('outro usuário liberado não acessa dados do dono', async () => {
    const db = dbDe(INTRUSO);
    await assertFails(getDoc(doc(db, 'users', DONO, 'perfil', 'config')));
    await assertFails(addDoc(collection(db, 'users', DONO, 'transacoes'), transacao()));
  });

  it('só aceita os documentos conhecidos em /perfil', async () => {
    await assertFails(setDoc(doc(dbDe(DONO), 'users', DONO, 'perfil', 'outro'), {}));
  });
});

describe('validação de transações', () => {
  const tx = (extra?: Record<string, unknown>) =>
    addDoc(collection(dbDe(DONO), 'users', DONO, 'transacoes'), transacao(extra));

  it('aceita transação válida e permite excluir', async () => {
    const ref = await assertSucceeds(tx());
    await assertSucceeds(deleteDoc(ref));
  });

  it('rejeita valor negativo, zero ou texto', async () => {
    await assertFails(tx({ val: -10 }));
    await assertFails(tx({ val: 0 }));
    await assertFails(tx({ val: '10' }));
  });

  it('rejeita data fora do formato e descrição vazia ou longa', async () => {
    await assertFails(tx({ data: '24/09/2026' }));
    await assertFails(tx({ desc: '' }));
    await assertFails(tx({ desc: 'x'.repeat(121) }));
  });
});

describe('validação de aportes', () => {
  const base = {
    caixinha: 'reserva',
    val: 100,
    data: '2026-09-24',
    obs: '',
    criadoEm: '2026-09-24T12:00:00.000Z',
  };
  const aporte = (dados: Record<string, unknown> = base) =>
    addDoc(collection(dbDe(DONO), 'users', DONO, 'aportes'), dados);

  it('aceita aporte válido', async () => {
    await assertSucceeds(aporte());
  });

  it('rejeita aporte sem caixinha ou com valor inválido', async () => {
    const { caixinha: _omitida, ...semCaixinha } = base;
    await assertFails(aporte(semCaixinha));
    await assertFails(aporte({ ...base, val: -1 }));
  });
});

describe('edição', () => {
  const criarTx = async () => {
    const db = dbDe(DONO);
    return assertSucceeds(addDoc(collection(db, 'users', DONO, 'transacoes'), transacao()));
  };

  it('dono edita a transação mantendo criadoEm', async () => {
    const ref = await criarTx();
    await assertSucceeds(setDoc(ref, transacao({ val: 80, atualizadoEm: '2026-09-25T10:00:00.000Z' })));
  });

  it('edição continua validando os campos', async () => {
    const ref = await criarTx();
    await assertFails(setDoc(ref, transacao({ val: -5 })));
  });

  it('não permite alterar criadoEm', async () => {
    const ref = await criarTx();
    await assertFails(setDoc(ref, transacao({ criadoEm: '2020-01-01T00:00:00.000Z' })));
  });

  it('outro usuário não edita', async () => {
    const ref = await criarTx();
    await assertFails(setDoc(doc(dbDe(INTRUSO), 'users', DONO, 'transacoes', ref.id), transacao({ val: 1 })));
  });

  it('dono edita aporte', async () => {
    const aporte = {
      caixinha: 'reserva',
      val: 100,
      data: '2026-09-24',
      obs: '',
      criadoEm: '2026-09-24T12:00:00.000Z',
    };
    const ref = await assertSucceeds(addDoc(collection(dbDe(DONO), 'users', DONO, 'aportes'), aporte));
    await assertSucceeds(setDoc(ref, { ...aporte, val: 150 }));
    await assertFails(setDoc(ref, { ...aporte, criadoEm: 'outro' }));
  });
});

describe('lançamentos de recorrências', () => {
  const ref = () => doc(dbDe(DONO), 'users', DONO, 'transacoes', 'rec_aluguel_2026-09');

  it('aceita transação com recorrenteId e id determinístico', async () => {
    await assertSucceeds(setDoc(ref(), transacao({ recorrenteId: 'aluguel' })));
  });

  it('rejeita recorrenteId vazio ou longo', async () => {
    await assertFails(setDoc(ref(), transacao({ recorrenteId: '' })));
    await assertFails(setDoc(ref(), transacao({ recorrenteId: 'x'.repeat(61) })));
  });

  it('lançar de novo o mesmo mês (outro criadoEm) é recusado, sem duplicar', async () => {
    await assertSucceeds(setDoc(ref(), transacao({ recorrenteId: 'aluguel' })));
    await assertFails(
      setDoc(ref(), transacao({ recorrenteId: 'aluguel', criadoEm: '2026-09-25T08:00:00.000Z' })),
    );
  });
});
