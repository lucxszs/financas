import { describe, expect, it } from 'vitest';
import { analisarCompra, type ContextoCompra, type PedidoCompra } from './compra';
import type { Config, Transacao } from './types';

const config: Config = {
  nome: 'Teste',
  rendaMensal: 12000,
  taxaAnualEstimada: 0.12,
  caixinhas: [{ id: 'reserva', nome: 'Reserva', moeda: 'BRL', rendimento: '', cor: 'emerald' }],
  objetivos: [
    { id: 'viagem', nome: 'Viagem', meta: 10000, caixinhas: ['reserva'], cor: 'violet', aporteMensal: 1000 },
  ],
  cartoes: [
    { id: 'inter', nome: 'Inter', limite: 3270, cor: 'amber', melhorDiaCompra: 9, diaVencimento: 15 },
  ],
};

let seq = 0;
const tx = (p: Partial<Transacao>): Transacao => ({
  id: `t${seq++}`,
  desc: 'x',
  val: 100,
  tipo: 'pix',
  cartao: null,
  cat: 'outro',
  data: '2026-09-10',
  mesFatura: null,
  obs: '',
  isEntrada: false,
  criadoEm: '',
  ...p,
});

// Setembro: salário de 12.000 e 8.000 gastos. Agosto: 9.000 gastos (a média).
// Disponível agora = 12.000 − 8.000 − 1.000 (aporte planejado) = 3.000. Sobra típica = 12.000 − 9.000 − 1.000 = 2.000.
const transacoes = [
  tx({ tipo: 'salario', val: 12000, isEntrada: true, data: '2026-09-15' }),
  tx({ val: 8000 }),
  tx({ val: 9000, data: '2026-08-10' }),
];
const ctx = (hoje = '2026-09-20'): ContextoCompra => ({
  config,
  transacoes,
  aportes: [],
  cotacoes: {},
  hoje,
});
const pedido = (p: Partial<PedidoCompra>): PedidoCompra => ({
  valor: 500,
  forma: 'avista',
  parcelas: 1,
  ...p,
});

describe('analisarCompra', () => {
  it('à vista com folga: cabe', () => {
    const r = analisarCompra(pedido({ valor: 500 }), ctx());
    expect(r.sinal).toBe('verde');
    expect(r.impactos).toEqual([{ mes: '2026-09', valor: 500, margem: 2500 }]);
  });

  it('à vista deixando menos de 10% da renda: apertado, com dica de juntar', () => {
    const r = analisarCompra(pedido({ valor: 2500 }), ctx());
    expect(r.sinal).toBe('amarelo');
    expect(r.dicas.join(' ')).toContain('em 2 meses');
  });

  it('à vista estourando o mês: não recomendado', () => {
    const r = analisarCompra(pedido({ valor: 3500 }), ctx());
    expect(r.sinal).toBe('vermelho');
    expect(r.motivos.join(' ')).toMatch(/faltariam R\$\s500,00/);
  });

  it('parcelado: uma parcela por fatura a partir da sugerida pelo melhor dia', () => {
    const r = analisarCompra(
      pedido({ valor: 3000, forma: 'parcelado', parcelas: 3, cartaoId: 'inter' }),
      ctx(),
    );
    expect(r.impactos.map((i) => [i.mes, i.valor, i.margem])).toEqual([
      ['2026-10', 1000, 1000],
      ['2026-11', 1000, 1000],
      ['2026-12', 1000, 1000],
    ]);
    expect(r.sinal).toBe('amarelo');
    expect(r.motivos.join(' ')).toMatch(/3x de R\$\s1\.000,00: compromete 8,3% da renda/);
  });

  it('crédito acima do limite disponível do cartão: não recomendado', () => {
    const r = analisarCompra(pedido({ valor: 4000, forma: 'credito', cartaoId: 'inter' }), ctx());
    expect(r.sinal).toBe('vermelho');
    expect(r.motivos[0]).toMatch(/Inter tem R\$\s3\.270,00 de limite disponível/);
  });

  it('perto do melhor dia, sugere esperar para cair na fatura seguinte', () => {
    const r = analisarCompra(pedido({ valor: 100, forma: 'credito', cartaoId: 'inter' }), ctx('2026-09-05'));
    expect(r.impactos[0]?.mes).toBe('2026-09');
    expect(r.dicas.join(' ')).toContain(
      'Esperando 4 dias (melhor dia 09), a compra cai na fatura de outubro de 2026',
    );
  });
});
