// Popula os emuladores locais (Auth + Firestore) com um usuário de teste e os dados de
// seed/exemplo.json, mais alguns lançamentos e aportes no mês atual.
// Usado por `npm run dev:emulador`. Nunca toca no projeto real: só fala com 127.0.0.1.

import { readFileSync } from 'node:fs';

const PROJETO = 'demo-financas';
const AUTH = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJETO}`;
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJETO}/databases/(default)/documents`;
// "Bearer owner" é o token de administrador aceito apenas pelos emuladores (ignora as regras).
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

export const USUARIO_TESTE = { uid: 'dev', email: 'dev@financas.local', senha: 'dev12345' };

const pedir = async (url, init) => {
  const resp = await fetch(url, init);
  if (!resp.ok) throw new Error(`${init.method} ${url} -> ${resp.status} ${await resp.text()}`);
  return resp;
};

/** Converte um valor JS para o formato tipado da API REST do Firestore. */
const valor = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valor) } };
  return { mapValue: { fields: campos(v) } };
};
const campos = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, valor(v)]));

const gravar = (caminho, dados) =>
  pedir(`${FIRESTORE}/${caminho}`, {
    method: 'PATCH',
    headers: ADMIN,
    body: JSON.stringify({ fields: campos(dados) }),
  });

const pad = (n) => String(n).padStart(2, '0');
const hoje = new Date();
const mes = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`;
const dia = (d) => `${mes}-${pad(Math.min(d, hoje.getDate()))}`;

const exemplo = JSON.parse(readFileSync(new URL('../seed/exemplo.json', import.meta.url), 'utf8'));
const { uid } = USUARIO_TESTE;
const criadoEm = hoje.toISOString();

const transacoes = [
  { desc: 'Salário', val: 6000, tipo: 'salario', cat: 'outro', data: dia(5), isEntrada: true },
  { desc: 'Mercado do mês', val: 486.9, tipo: 'debito', cat: 'mercado', data: dia(6), isEntrada: false },
  {
    desc: 'Combustível',
    val: 210,
    tipo: 'credito',
    cartao: 'cartao-a',
    cat: 'transporte',
    data: dia(8),
    isEntrada: false,
  },
  {
    desc: 'Streaming',
    val: 55.9,
    tipo: 'credito',
    cartao: 'cartao-b',
    cat: 'assinaturas',
    data: dia(10),
    isEntrada: false,
  },
  {
    desc: 'Farmácia',
    val: 89.5,
    tipo: 'pix',
    cat: 'saude',
    data: dia(12),
    isEntrada: false,
    obs: 'vitaminas',
  },
  {
    desc: 'Jantar com amigos com uma descrição bem longa para testar quebra de linha',
    val: 1234.56,
    tipo: 'credito',
    cartao: 'cartao-a',
    cat: 'lazer',
    data: dia(14),
    isEntrada: false,
  },
];

const aportes = [
  { caixinha: 'reserva', val: 500, data: dia(6), obs: 'aporte mensal' },
  { caixinha: 'viagem', val: 800, data: dia(6), obs: '' },
  { caixinha: 'dolar', val: 50, data: dia(9), obs: 'compra de dólar' },
];

await pedir(`${AUTH}/accounts`, {
  method: 'POST',
  headers: ADMIN,
  body: JSON.stringify({
    localId: uid,
    email: USUARIO_TESTE.email,
    password: USUARIO_TESTE.senha,
    displayName: 'Usuário de teste',
    emailVerified: true,
  }),
});

await gravar(`acessos/${uid}`, { ativo: true });
await gravar(`users/${uid}/perfil/config`, exemplo.config);
await gravar(`users/${uid}/perfil/saldos`, {
  ...exemplo.saldos,
  score: { pagou: 'sim', positivo: 'sim', aporte: 'parcial' },
  updatedAt: criadoEm,
});
for (const s of exemplo.snapshots) await gravar(`users/${uid}/snapshots/${s.mes}`, s);
for (const f of exemplo.fechamentos) await gravar(`users/${uid}/fechamentos/${f.mes}`, f);
for (const [i, t] of transacoes.entries()) {
  await gravar(`users/${uid}/transacoes/tx${i}`, { cartao: null, mesFatura: null, obs: '', criadoEm, ...t });
}
for (const [i, a] of aportes.entries()) await gravar(`users/${uid}/aportes/ap${i}`, { criadoEm, ...a });

console.log(`✅ Emuladores populados. Login de teste: ${USUARIO_TESTE.email} / ${USUARIO_TESTE.senha}`);
