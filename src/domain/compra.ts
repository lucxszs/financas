import { diasAteMelhorDia, mesFaturaSugerido, resumoCartao } from './cartoes';
import { rotuloMesLongo, somarDias, somarMeses } from './datas';
import { fmt, fmtPct } from './formatadores';
import { aportePlanejado, limiteGastos, mediaGastos, resumoMes } from './resumo';
import type { Aporte, Config, Cotacoes, LimiteInformado, Transacao } from './types';

export type FormaPagamento = 'avista' | 'credito' | 'parcelado';
export type SinalCompra = 'verde' | 'amarelo' | 'vermelho';

export interface PedidoCompra {
  /** Valor total da compra. */
  valor: number;
  forma: FormaPagamento;
  /** Só no parcelado (2 a 48). */
  parcelas: number;
  /** Cartão, no crédito e no parcelado. */
  cartaoId?: string;
}

export interface ContextoCompra {
  config: Config;
  transacoes: Transacao[];
  aportes: Aporte[];
  cotacoes: Cotacoes;
  limitesInformados?: Record<string, LimiteInformado>;
  hoje: string;
}

export interface ImpactoMes {
  mes: string;
  valor: number;
  /** Quanto sobra no mês depois da compra. */
  margem: number;
}

export interface AnaliseCompra {
  sinal: SinalCompra;
  titulo: string;
  motivos: string[];
  dicas: string[];
  impactos: ImpactoMes[];
}

/** Margem abaixo disso (fração da renda) deixa o mês apertado. */
const FOLGA_MINIMA = 0.1;

/**
 * "Posso comprar?": distribui a compra pelos meses em que ela pesa e compara com a margem de cada mês.
 *
 * - Mês atual: o disponível para gastar do limite de gastos.
 * - Meses seguintes: a sobra típica (renda − média de gastos − aporte planejado).
 * - Crédito: o limite disponível do cartão precisa cobrir o valor total (o banco bloqueia tudo, mesmo parcelado).
 *
 * 🔴 falta limite no cartão ou algum mês fica negativo · 🟡 algum mês fica com menos de 10% da renda · 🟢 cabe.
 */
export const analisarCompra = (p: PedidoCompra, ctx: ContextoCompra): AnaliseCompra => {
  const { config, transacoes, aportes, cotacoes, hoje } = ctx;
  const mesAtual = hoje.slice(0, 7);
  const resumo = resumoMes(transacoes, aportes, config, cotacoes, mesAtual);
  const disponivelAgora = limiteGastos(resumo, transacoes, config, cotacoes, hoje).disponivel;
  const renda = config.rendaMensal || resumo.renda;
  const media = mediaGastos(transacoes, mesAtual) ?? resumo.gastos;
  const sobraTipica = renda - media - aportePlanejado(config, cotacoes);

  const cartao = p.forma === 'avista' ? undefined : config.cartoes.find((c) => c.id === p.cartaoId);
  const primeiroMes = cartao ? (mesFaturaSugerido(cartao, hoje) ?? mesAtual) : mesAtual;
  const n = p.forma === 'parcelado' ? Math.max(2, Math.round(p.parcelas)) : 1;
  const parcela = p.valor / n;

  const impactos: ImpactoMes[] = Array.from({ length: n }, (_, i) => {
    const mes = somarMeses(primeiroMes, i);
    const base = mes === mesAtual ? disponivelAgora : sobraTipica;
    return { mes, valor: parcela, margem: base - parcela };
  });

  const motivos: string[] = [];
  const dicas: string[] = [];
  let sinal: SinalCompra = 'verde';
  const piorar = (s: SinalCompra) => {
    if (s === 'vermelho' || (s === 'amarelo' && sinal === 'verde')) sinal = s;
  };

  // Limite do cartão.
  if (cartao) {
    const disponivel = resumoCartao(cartao, transacoes, hoje, ctx.limitesInformados?.[cartao.id]).disponivel;
    if (disponivel < p.valor) {
      piorar('vermelho');
      motivos.push(
        `O ${cartao.nome} tem ${fmt(Math.max(0, disponivel))} de limite disponível, menos que ${fmt(p.valor)}.`,
      );
    } else motivos.push(`O ${cartao.nome} tem limite: sobram ${fmt(disponivel - p.valor)} depois da compra.`);
  }

  // Margem de cada mês.
  const pior = impactos.reduce((a, i) => (i.margem < a.margem ? i : a));
  const rotulo = (mes: string) => (mes === mesAtual ? 'este mês' : `na fatura de ${rotuloMesLongo(mes)}`);
  if (pior.margem < 0) {
    piorar('vermelho');
    motivos.push(`${capitalizar(rotulo(pior.mes))}, faltariam ${fmt(-pior.margem)} para fechar no azul.`);
  } else if (pior.margem < renda * FOLGA_MINIMA) {
    piorar('amarelo');
    motivos.push(
      `${capitalizar(rotulo(pior.mes))}, sobrariam só ${fmt(pior.margem)} (menos de 10% da renda).`,
    );
  } else motivos.push(`Mesmo no mês mais apertado, sobram ${fmt(pior.margem)}.`);

  if (n > 1)
    motivos.push(
      `${n}x de ${fmt(parcela)}: compromete ${renda > 0 ? fmtPct((parcela / renda) * 100, 1) : '·'} da renda por ${n} meses.`,
    );
  if (sobraTipica <= 0)
    motivos.push(
      `Hoje sua média de gastos e aportes já consome a renda (sobra típica de ${fmt(sobraTipica)}).`,
    );

  // Dicas.
  if (cartao) {
    const dias = diasAteMelhorDia(cartao, hoje);
    if (dias !== null && dias > 0 && dias <= 10 && cartao.melhorDiaCompra) {
      const data = somarDias(hoje, dias);
      const fatura = mesFaturaSugerido(cartao, data);
      if (fatura && fatura !== primeiroMes)
        dicas.push(
          `Esperando ${dias} ${dias === 1 ? 'dia' : 'dias'} (melhor dia ${String(cartao.melhorDiaCompra).padStart(2, '0')}), a compra cai na fatura de ${rotuloMesLongo(fatura)}.`,
        );
    }
  }
  if (sinal !== 'verde' && sobraTipica > 0) {
    const meses = Math.ceil(p.valor / sobraTipica);
    dicas.push(
      `Guardando a sobra típica (${fmt(sobraTipica)}/mês), dá para pagar à vista em ${meses} ${meses === 1 ? 'mês' : 'meses'}.`,
    );
  }
  const aporte = aportePlanejado(config, cotacoes);
  if (aporte > 0 && p.valor >= aporte)
    dicas.push(
      `O valor equivale a ${(p.valor / aporte).toFixed(1).replace('.', ',')} meses dos seus aportes planejados.`,
    );

  const titulo = {
    verde: 'Cabe no seu orçamento',
    amarelo: 'Cabe, mas deixa o orçamento apertado',
    vermelho: 'Não recomendado agora',
  }[sinal];

  return { sinal, titulo, motivos, dicas, impactos };
};

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
