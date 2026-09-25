import { describe, expect, it } from 'vitest';
import { gerarId } from './ids';

describe('gerarId', () => {
  it('remove acentos e símbolos', () => {
    expect(gerarId('Conta Itaú 💳', [])).toBe('conta-itau');
  });

  it('não repete ids existentes', () => {
    expect(gerarId('Reserva', ['reserva', 'reserva-2'])).toBe('reserva-3');
  });

  it('nome só com símbolos vira "item"', () => {
    expect(gerarId('🚀', [])).toBe('item');
  });
});
