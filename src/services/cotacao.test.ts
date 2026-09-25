import { describe, expect, it } from 'vitest';
import { lerAwesome } from './cotacao';

describe('lerAwesome', () => {
  it('lê o bid de cada par e ignora valores inválidos', () => {
    const json = {
      USDBRL: { bid: '5.3210', create_date: '2026-09-24 13:53:12' },
      EURBRL: { bid: 'abc', create_date: '2026-09-24 13:53:12' },
    };
    expect(lerAwesome(json, ['USD', 'EUR'])).toEqual({
      cotacoes: { USD: 5.321 },
      atualizadoEm: '2026-09-24 13:53:12',
    });
  });

  it('resposta vazia não gera cotação', () => {
    expect(lerAwesome(null, ['USD'])).toEqual({ cotacoes: {}, atualizadoEm: null });
  });
});
