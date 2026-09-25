import { describe, expect, it } from 'vitest';
import exemplo from '../../seed/exemplo.json';
import { validarDadosIniciais } from './validacao';

describe('validarDadosIniciais', () => {
  it('aceita o seed de exemplo', () => {
    expect(validarDadosIniciais(exemplo)).toMatchObject({ ok: true });
  });

  it('rejeita objetivo apontando para caixinha inexistente', () => {
    const invalido = structuredClone(exemplo);
    invalido.config.objetivos[0]!.caixinhas = ['nao-existe'];
    const r = validarDadosIniciais(invalido);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.join()).toContain('nao-existe');
  });

  it('rejeita entrada sem config', () => {
    expect(validarDadosIniciais({})).toEqual({ ok: false, erros: ['Campo "config" ausente'] });
  });
});

describe('campos da v2', () => {
  const comConfig = (alterar: (c: (typeof exemplo)['config']) => void) => {
    const d = structuredClone(exemplo);
    alterar(d.config);
    return validarDadosIniciais(d);
  };
  const erros = (r: ReturnType<typeof validarDadosIniciais>) => (r.ok ? '' : r.erros.join(' | '));

  it('rejeita dia de cartão fora de 1 a 31', () => {
    expect(erros(comConfig((c) => (c.cartoes[0]!.melhorDiaCompra = 32)))).toContain('melhorDiaCompra');
  });

  it('rejeita orçamento de categoria desconhecida', () => {
    expect(erros(comConfig((c) => Object.assign(c.orcamentos, { pizza: 10 })))).toContain('pizza');
  });

  it('rejeita recorrente apontando para cartão ou caixinha inexistente', () => {
    expect(erros(comConfig((c) => (c.recorrentes[1]!.cartao = 'nao-existe')))).toContain(
      'cartão inexistente',
    );
    expect(erros(comConfig((c) => (c.recorrentes[2]!.caixinha = 'nao-existe')))).toContain(
      'caixinha inexistente',
    );
  });
});
