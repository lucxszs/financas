export type Moeda = 'BRL' | 'USD' | 'EUR';
export type MoedaEstrangeira = Exclude<Moeda, 'BRL'>;
export type Cotacoes = Partial<Record<MoedaEstrangeira, number>>;

export type Cor = 'emerald' | 'amber' | 'violet' | 'coral' | 'sky';

/** `conta` = dinheiro disponível (conta corrente, carteira); `investimento` = aplicado. */
export type TipoCaixinha = 'investimento' | 'conta';

export interface Caixinha {
  id: string;
  nome: string;
  emoji?: string;
  moeda: Moeda;
  /** Texto livre, ex.: "115% CDI". */
  rendimento: string;
  descricao?: string;
  cor: Cor;
  /** Ausente = investimento. */
  tipo?: TipoCaixinha;
}

export interface Objetivo {
  id: string;
  nome: string;
  emoji?: string;
  descricao?: string;
  /** Meta em BRL. */
  meta: number;
  /** Caixinhas cujo saldo (convertido para BRL) conta para o objetivo. */
  caixinhas: string[];
  cor: Cor;
  aporteMensal?: number;
  /** Rótulo livre de previsão, ex.: "~set/2034". */
  previsao?: string;
  /** Objetivos com data aparecem na contagem regressiva. */
  dataInicio?: string;
  dataAlvo?: string;
}

export interface Cartao {
  id: string;
  nome: string;
  emoji?: string;
  limite: number;
  cor: Cor;
  /** Dia do mês (1 a 31) a partir do qual a compra cai na fatura seguinte. */
  melhorDiaCompra?: number;
  /** Dia do mês (1 a 31) do vencimento da fatura. */
  diaVencimento?: number;
}

export interface MediaGasto {
  nome: string;
  emoji?: string;
  valor: number;
  cor: Cor;
}

export interface Config {
  nome: string;
  rendaMensal: number;
  /** Taxa anual usada para estimar o rendimento mensal das caixinhas em BRL (ex.: 0.147). */
  taxaAnualEstimada: number;
  caixinhas: Caixinha[];
  objetivos: Objetivo[];
  cartoes: Cartao[];
  alocacaoDesde?: string;
  mediasGastos?: { periodo: string; itens: MediaGasto[] };
  /** Orçamento mensal por categoria, em BRL. */
  orcamentos?: Partial<Record<Categoria, number>>;
  /** Lançamentos e aportes criados automaticamente todo mês. */
  recorrentes?: Recorrente[];
}

interface RecorrenteBase {
  id: string;
  desc: string;
  /** Na moeda da caixinha (aporte) ou em BRL (lançamento). */
  val: number;
  /** Dia do mês (1 a 31); em meses mais curtos vale o último dia. */
  dia: number;
  ativo: boolean;
  /** Primeiro mês a lançar, "YYYY-MM". */
  inicio: string;
  /** Último mês já lançado, "YYYY-MM". Evita relançar o que foi excluído à mão. */
  lancadoAte?: string;
}

export type Recorrente =
  | (RecorrenteBase & {
      tipo: 'transacao';
      tipoTransacao: TipoTransacao;
      cat: Categoria;
      cartao: string | null;
    })
  | (RecorrenteBase & { tipo: 'aporte'; caixinha: string });

export type Resposta = 'sim' | 'parcial' | 'nao';

export interface ScoreMes {
  pagou?: Resposta;
  positivo?: Resposta;
  aporte?: Resposta;
}

export interface Saldos {
  /** Saldo por caixinha, na moeda da própria caixinha. */
  valores: Record<string, number>;
  score?: ScoreMes;
  updatedAt: string | null;
}

/** Foto mensal dos saldos. Id do documento = "YYYY-MM". */
export interface Snapshot {
  mes: string;
  valores: Record<string, number>;
  rendimentos?: Record<string, number>;
  cotacoes?: Cotacoes;
}

export type TipoTransacao =
  'debito' | 'pix' | 'credito' | 'parcelado' | 'dinheiro' | 'emprestei' | 'recebi' | 'salario' | 'outro';

export type Categoria =
  | 'alimentacao'
  | 'mercado'
  | 'transporte'
  | 'saude'
  | 'moradia'
  | 'lazer'
  | 'assinaturas'
  | 'familia'
  | 'educacao'
  | 'vestuario'
  | 'outro';

export interface Transacao {
  id: string;
  desc: string;
  val: number;
  tipo: TipoTransacao;
  cartao: string | null;
  cat: Categoria;
  data: string;
  mesFatura: string | null;
  obs: string;
  isEntrada: boolean;
  criadoEm: string;
  atualizadoEm?: string;
  /** Preenchido quando foi criado por uma recorrência. */
  recorrenteId?: string;
}

export interface Aporte {
  id: string;
  caixinha: string;
  val: number;
  data: string;
  obs: string;
  criadoEm: string;
  atualizadoEm?: string;
  recorrenteId?: string;
}

export interface ItemFechamento {
  nome: string;
  emoji?: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  /** true = pago, false = pendente, ausente = não se aplica. */
  pago?: boolean;
}

/** Fechamento manual de um mês. Id do documento = "YYYY-MM". */
export interface Fechamento {
  mes: string;
  itens: ItemFechamento[];
  notas?: string[];
}

/** Formato do arquivo JSON importado no primeiro acesso. */
export interface DadosIniciais {
  config: Config;
  saldos?: Omit<Saldos, 'updatedAt'>;
  snapshots?: Snapshot[];
  fechamentos?: Fechamento[];
}
