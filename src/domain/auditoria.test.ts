import { describe, expect, it } from 'vitest';
import {
  camposAlterados,
  podeRestaurar,
  resumoRegistro,
  semIdDoc,
  textoValor,
  type RegistroHistorico,
} from './auditoria';

describe('resumoRegistro', () => {
  it('descreve lançamentos, parcelas e fotos do mês', () => {
    expect(resumoRegistro('transacao', { desc: 'Uber', val: 29.6 })).toMatch(/^Uber · R\$\s29,60$/);
    expect(resumoRegistro('transacao', { desc: 'Tela', val: 170, parcela: { atual: 1, total: 5 } })).toMatch(
      /^Tela \(1\/5\) · R\$\s170,00$/,
    );
    expect(resumoRegistro('snapshot', { mes: '2026-07' })).toBe('Foto dos saldos de 2026-07');
    expect(resumoRegistro('config', null)).toBe('Configurações');
  });
});

describe('camposAlterados', () => {
  it('lista só o que mudou, ignorando carimbos de data', () => {
    const antes = { desc: 'Uber', val: 29.6, cat: 'transporte', atualizadoEm: 'a' };
    const depois = { desc: 'Uber', val: 31, cat: 'transporte', atualizadoEm: 'b' };
    expect(camposAlterados(antes, depois)).toEqual([{ campo: 'val', antes: 29.6, depois: 31 }]);
  });

  it('na criação e na exclusão, todos os campos aparecem de um lado só', () => {
    expect(camposAlterados(null, { desc: 'X', val: 1 }).map((c) => c.campo)).toEqual(['desc', 'val']);
  });
});

describe('textoValor', () => {
  it('resume listas e objetos', () => {
    expect(textoValor([1, 2])).toBe('2 itens');
    expect(textoValor({ a: 1 })).toBe('(alterado)');
    expect(textoValor(1234.5)).toBe('1.234,5');
    expect(textoValor(undefined)).toBe('·');
  });
});

describe('podeRestaurar', () => {
  const base: RegistroHistorico = {
    id: 'h',
    em: '',
    acao: 'excluir',
    entidade: 'transacao',
    docId: 'x',
    resumo: '',
    origem: 'usuario',
    antes: { desc: 'Uber' },
    depois: null,
  };
  it('só exclusões de lançamento e aporte com o conteúdo guardado', () => {
    expect(podeRestaurar(base)).toBe(true);
    expect(podeRestaurar({ ...base, acao: 'editar' })).toBe(false);
    expect(podeRestaurar({ ...base, entidade: 'config' })).toBe(false);
    expect(podeRestaurar({ ...base, antes: null })).toBe(false);
  });
});

describe('semIdDoc', () => {
  it('remove o id que vem do listener', () => {
    expect(semIdDoc({ id: 'abc', desc: 'Uber' })).toEqual({ desc: 'Uber' });
    expect(semIdDoc(null)).toBeNull();
  });
});
