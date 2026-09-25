import { describe, expect, it } from 'vitest';
import { dividasCartoes, liquidoSnapshot, patrimonioAtual } from './patrimonio';
import type { Config, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 9000,
  taxaAnualEstimada: 0.12,
  caixinhas: [
    { id: 'nubank', nome: 'Nubank', moeda: 'BRL', rendimento: '', cor: 'violet' },
    { id: 'wise', nome: 'Wise', moeda: 'USD', rendimento: '', cor: 'sky', tipo: 'conta' },
    { id: 'itau', nome: 'Conta Itaú', moeda: 'BRL', rendimento: '', cor: 'amber', tipo: 'conta' },
  ],
  objetivos: [],
  cartoes: [
    { id: 'itau', nome: 'Itaú', limite: 5000, cor: 'amber', diaVencimento: 13 },
    { id: 'inter', nome: 'Inter', limite: 3000, cor: 'coral' },
  ],
};

let seq = 0;
const compra = (cartao: string, val: number, mesFatura: string): Transacao => ({
  id: `t${seq++}`,
  desc: 'x',
  val,
  tipo: 'credito',
  cartao,
  cat: 'outro',
  data: '2026-09-01',
  mesFatura,
  obs: '',
  isEntrada: false,
  criadoEm: '',
});

const transacoes = [
  compra('itau', 1000, '2026-08'), // já passou
  compra('itau', 800, '2026-09'),
  compra('itau', 200, '2026-10'),
  compra('inter', 500, '2026-09'),
];

describe('dividasCartoes', () => {
  it('conta a fatura do mês até o vencimento e as futuras', () => {
    expect(dividasCartoes(config, transacoes, '2026-09-10')).toBe(1500);
  });

  it('depois do vencimento, a fatura do mês sai (cartão sem vencimento continua contando)', () => {
    expect(dividasCartoes(config, transacoes, '2026-09-20')).toBe(700);
  });
});

describe('patrimonioAtual', () => {
  it('separa investimentos de contas e desconta as dívidas', () => {
    const p = patrimonioAtual(
      config,
      { nubank: 7090, wise: 20, itau: 1200 },
      { USD: 5 },
      transacoes,
      '2026-09-10',
    );
    expect(p).toEqual({
      investimentos: 7090,
      contas: 1300,
      ativos: 8390,
      dividas: 1500,
      liquido: 6890,
      completo: true,
    });
  });

  it('sem cotação, a caixinha em dólar fica fora e sinaliza', () => {
    expect(patrimonioAtual(config, { wise: 20 }, {}, [], '2026-09-10').completo).toBe(false);
  });
});

describe('liquidoSnapshot', () => {
  it('usa a cotação da foto e desconta as dívidas gravadas', () => {
    const s = { mes: '2026-08', valores: { nubank: 6000, wise: 10 }, cotacoes: { USD: 5 }, dividas: 700 };
    expect(liquidoSnapshot(s, config, { USD: 6 })).toBe(5350);
  });

  it('foto antiga sem dívidas conta dívida zero', () => {
    expect(liquidoSnapshot({ mes: '2026-06', valores: { nubank: 4200 } }, config, {})).toBe(4200);
  });
});
