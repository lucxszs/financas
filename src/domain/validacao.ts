import type { DadosIniciais } from './types';

// Validação estrutural do JSON importado no onboarding. Mantida sem dependências;
// se o modelo crescer, vale trocar por zod.

const CORES = ['emerald', 'amber', 'violet', 'coral', 'sky'];
const MOEDAS = ['BRL', 'USD', 'EUR'];
const MES = /^\d{4}-\d{2}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

export const validarDadosIniciais = (
  entrada: unknown,
): { ok: true; dados: DadosIniciais } | { ok: false; erros: string[] } => {
  const erros: string[] = [];
  const exigir = (cond: boolean, msg: string) => {
    if (!cond) erros.push(msg);
  };

  if (!isObj(entrada) || !isObj(entrada.config)) return { ok: false, erros: ['Campo "config" ausente'] };
  const c = entrada.config;

  exigir(isStr(c.nome), 'config.nome obrigatório');
  exigir(isNum(c.rendaMensal), 'config.rendaMensal deve ser número');
  exigir(isNum(c.taxaAnualEstimada), 'config.taxaAnualEstimada deve ser número');

  const caixinhas = Array.isArray(c.caixinhas) ? c.caixinhas : [];
  exigir(caixinhas.length > 0, 'config.caixinhas precisa de ao menos 1 item');
  const ids = new Set<string>();
  caixinhas.forEach((cx: unknown, i) => {
    if (!isObj(cx)) return erros.push(`caixinhas[${i}] inválida`);
    exigir(isStr(cx.id), `caixinhas[${i}].id obrigatório`);
    exigir(isStr(cx.nome), `caixinhas[${i}].nome obrigatório`);
    exigir(MOEDAS.includes(cx.moeda as string), `caixinhas[${i}].moeda deve ser ${MOEDAS.join('/')}`);
    exigir(CORES.includes(cx.cor as string), `caixinhas[${i}].cor deve ser ${CORES.join('/')}`);
    if (isStr(cx.id)) ids.add(cx.id);
  });

  (Array.isArray(c.objetivos) ? c.objetivos : []).forEach((o: unknown, i) => {
    if (!isObj(o)) return erros.push(`objetivos[${i}] inválido`);
    exigir(isStr(o.id) && isStr(o.nome), `objetivos[${i}] precisa de id e nome`);
    exigir(isNum(o.meta), `objetivos[${i}].meta deve ser número`);
    exigir(CORES.includes(o.cor as string), `objetivos[${i}].cor inválida`);
    const refs = Array.isArray(o.caixinhas) ? o.caixinhas : [];
    refs.forEach((r) =>
      exigir(ids.has(r as string), `objetivos[${i}] referencia caixinha inexistente "${String(r)}"`),
    );
    if (o.dataAlvo !== undefined)
      exigir(DATA.test(String(o.dataAlvo)), `objetivos[${i}].dataAlvo deve ser YYYY-MM-DD`);
    if (o.dataInicio !== undefined)
      exigir(DATA.test(String(o.dataInicio)), `objetivos[${i}].dataInicio deve ser YYYY-MM-DD`);
  });

  (Array.isArray(c.cartoes) ? c.cartoes : []).forEach((k: unknown, i) => {
    exigir(isObj(k) && isStr(k.id) && isNum(k.limite), `cartoes[${i}] precisa de id e limite`);
  });

  (Array.isArray(entrada.snapshots) ? entrada.snapshots : []).forEach((s: unknown, i) => {
    exigir(
      isObj(s) && MES.test(String(s.mes)) && isObj(s.valores),
      `snapshots[${i}] precisa de mes (YYYY-MM) e valores`,
    );
  });

  (Array.isArray(entrada.fechamentos) ? entrada.fechamentos : []).forEach((f: unknown, i) => {
    exigir(
      isObj(f) && MES.test(String(f.mes)) && Array.isArray(f.itens),
      `fechamentos[${i}] precisa de mes e itens`,
    );
  });

  if (!Array.isArray(c.objetivos)) erros.push('config.objetivos deve ser lista');
  if (!Array.isArray(c.cartoes)) erros.push('config.cartoes deve ser lista');

  return erros.length ? { ok: false, erros } : { ok: true, dados: entrada as unknown as DadosIniciais };
};
