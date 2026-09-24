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
