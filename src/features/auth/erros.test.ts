import { describe, expect, it } from 'vitest';
import { mensagemErroAuth } from './erros';

describe('mensagemErroAuth', () => {
  it('traduz os erros conhecidos', () => {
    expect(mensagemErroAuth({ code: 'auth/invalid-credential' })).toBe('E-mail ou senha incorretos.');
    expect(mensagemErroAuth({ code: 'auth/weak-password' })).toContain('6 caracteres');
  });

  it('fechar a janela do Google não é erro', () => {
    expect(mensagemErroAuth({ code: 'auth/popup-closed-by-user' })).toBeNull();
  });

  it('erro desconhecido vira mensagem genérica', () => {
    expect(mensagemErroAuth(new Error('x'))).toBe('Não foi possível concluir. Tente de novo.');
  });
});
