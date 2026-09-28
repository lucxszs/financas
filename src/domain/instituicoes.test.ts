import { describe, expect, it } from 'vitest';
import { instituicaoDe } from './instituicoes';

describe('instituicaoDe', () => {
  it('deduz o banco pelo nome quando não foi escolhido', () => {
    expect(instituicaoDe({ nome: 'Nubank Turbo' })).toBe('nubank');
    expect(instituicaoDe({ nome: 'MP Bariloche' })).toBe('mercadopago');
    expect(instituicaoDe({ nome: 'Mercado Pago' })).toBe('mercadopago');
    expect(instituicaoDe({ nome: 'Itaú' })).toBe('itau');
    expect(instituicaoDe({ nome: 'Inter' })).toBe('inter');
    expect(instituicaoDe({ nome: 'Wise Rende+' })).toBe('wise');
    expect(instituicaoDe({ nome: 'Reserva' })).toBeNull();
  });

  it('a escolha em Configurações vale mais que o nome', () => {
    expect(instituicaoDe({ nome: 'Nubank Turbo', instituicao: 'inter' })).toBe('inter');
  });
});
