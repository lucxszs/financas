import { describe, expect, it } from 'vitest';
import { paraBRL, progressoObjetivo } from './calculos';
import type { Config } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 5000,
  caixinhas: [
    { id: 'reserva', nome: 'Reserva', moeda: 'BRL', rendimento: '100% CDI', cor: 'emerald' },
    { id: 'dolar', nome: 'Dólar', moeda: 'USD', rendimento: '3% a.a.', cor: 'sky' },
  ],
  objetivos: [{ id: 'viagem', nome: 'Viagem', meta: 1000, caixinhas: ['reserva', 'dolar'], cor: 'violet' }],
  cartoes: [{ id: 'c1', nome: 'Cartão', limite: 1000, cor: 'amber' }],
};

describe('paraBRL', () => {
  it('mantém BRL e converte moedas com cotação', () => {
    expect(paraBRL(10, 'BRL', {})).toBe(10);
    expect(paraBRL(10, 'USD', { USD: 5 })).toBe(50);
    expect(paraBRL(10, 'EUR', { EUR: 6 })).toBe(60);
  });

  it('retorna null sem cotação', () => {
    expect(paraBRL(10, 'EUR', { USD: 5 })).toBeNull();
  });
});

describe('progressoObjetivo', () => {
  it('soma caixinhas em moedas diferentes', () => {
    const p = progressoObjetivo(config.objetivos[0]!, config, { reserva: 500, dolar: 50 }, { USD: 5 });
    expect(p.guardado).toBe(750);
    expect(p.faltam).toBe(250);
    expect(p.pct).toBe(75);
    expect(p.completo).toBe(true);
  });

  it('sinaliza soma incompleta sem cotação', () => {
    const p = progressoObjetivo(config.objetivos[0]!, config, { reserva: 500, dolar: 50 }, {});
    expect(p.guardado).toBe(500);
    expect(p.completo).toBe(false);
  });
});
