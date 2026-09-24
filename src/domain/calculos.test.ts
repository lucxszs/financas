import { describe, expect, it } from 'vitest';
import {
  calcularScore,
  paraBRL,
  progressoObjetivo,
  rendimentoMensalEstimado,
  totaisFechamento,
  usoCartao,
} from './calculos';
import type { Config, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 5000,
  taxaAnualEstimada: 0.12,
  caixinhas: [
    { id: 'reserva', nome: 'Reserva', moeda: 'BRL', rendimento: '100% CDI', cor: 'emerald' },
    { id: 'dolar', nome: 'Dólar', moeda: 'USD', rendimento: '3% a.a.', cor: 'sky' },
  ],
  objetivos: [{ id: 'viagem', nome: 'Viagem', meta: 1000, caixinhas: ['reserva', 'dolar'], cor: 'violet' }],
  cartoes: [{ id: 'c1', nome: 'Cartão', limite: 1000, cor: 'amber' }],
};

const tx = (p: Partial<Transacao>): Transacao => ({
  id: 'x',
  desc: 'x',
  val: 100,
  tipo: 'credito',
  cartao: 'c1',
  cat: 'outro',
  data: '2026-09-10',
  mesFatura: null,
  obs: '',
  isEntrada: false,
  criadoEm: '',
  ...p,
});

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

describe('rendimentoMensalEstimado', () => {
  it('considera só caixinhas em BRL', () => {
    expect(rendimentoMensalEstimado(config, { reserva: 1200, dolar: 1000 })).toBe(12);
  });
});

describe('calcularScore', () => {
  it('classifica pela pontuação', () => {
    expect(calcularScore({ pagou: 'sim', positivo: 'sim', aporte: 'parcial' }).cls).toBe('verde');
    expect(calcularScore({ pagou: 'parcial', positivo: 'sim' }).cls).toBe('amarelo');
    expect(calcularScore({}).cls).toBe('vermelho');
  });
});

describe('usoCartao', () => {
  it('usa mesFatura quando informado', () => {
    const txs = [tx({}), tx({ mesFatura: '2026-10' }), tx({ cartao: 'outro' }), tx({ isEntrada: true })];
    expect(usoCartao(config.cartoes[0]!, txs, '2026-09').utilizado).toBe(100);
    expect(usoCartao(config.cartoes[0]!, txs, '2026-10').utilizado).toBe(100);
  });
});

describe('totaisFechamento', () => {
  it('calcula saldo e pendências', () => {
    const t = totaisFechamento({
      mes: '2026-09',
      itens: [
        { nome: 'Renda', valor: 1000, tipo: 'entrada' },
        { nome: 'Casa', valor: 700, tipo: 'saida', pago: true },
        { nome: 'Conta', valor: 400, tipo: 'saida', pago: false },
      ],
    });
    expect(t).toEqual({ entradas: 1000, saidas: 1100, saldo: -100, pendente: 400 });
  });
});
