import type { Instituicao } from './instituicoes';

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
  tipo?: TipoCaixinha; /** Banco (cor e logo). Ausente = deduzido do nome. */
  instituicao?: Instituicao;
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
  /** Marca a reserva de emergência (usada na Saúde financeira). */
  reservaEmergencia?: boolean;
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
  diaVencimento?: number; /** Banco (cor e logo). Ausente = deduzido do nome. */
  instituicao?: Instituicao;
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
      /** Valor muda todo mês (ex.: financiamento): lança com o último valor confirmado e marca "a confirmar". */
      variavel?: boolean;
    })
  | (RecorrenteBase & { tipo: 'aporte'; caixinha: string });

/** Limite disponível que o app do banco mostra, informado no "Atualizar saldos". */
export interface LimiteInformado {
  disponivel: number;
  /** Momento (ISO) em que foi informado. */
  em: string;
}

export interface Saldos {
  /** Saldo por caixinha, na moeda da própria caixinha. */
  valores: Record<string, number>;
  /** Limite disponível por cartão (id do cartão). */
  cartoes?: Record<string, LimiteInformado>;
  updatedAt: string | null;
}

/** Foto mensal dos saldos. Id do documento = "YYYY-MM". */
export interface Snapshot {
  mes: string;
  valores: Record<string, number>;
  rendimentos?: Record<string, number>;
  cotacoes?: Cotacoes;
  /** Faturas de cartão em aberto (atual + futuras) no dia da foto, em BRL. */
  dividas?: number;
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
  /** Lançado por uma recorrência de valor variável e ainda não revisado (some ao editar). */
  aConfirmar?: boolean;
  /** Compra parcelada: todas as parcelas compartilham o mesmo grupoId. */
  grupoId?: string;
  parcela?: { atual: number; total: number };
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

/** Foto imutável de um mês, gravada no "Fechar mês". Id do documento = "YYYY-MM". */
export interface FechamentoMes {
  mes: string;
  /** ISO. */
  fechadoEm: string;
  renda: number;
  rendaPrevista: boolean;
  gastos: number;
  investimentos: number;
  saldo: number;
  taxaPoupanca: number;
  maiorCategoria: { cat: Categoria; valor: number } | null;
  maiorGasto: { desc: string; valor: number } | null;
  aportesPorMeta: { objetivoId: string; nome: string; emoji?: string; valor: number }[];
  /** Patrimônio líquido no fechamento; null se não havia foto dos saldos daquele mês. */
  patrimonio: number | null;
  /** Diferença para o patrimônio do mês anterior; null se um dos dois não é conhecido. */
  variacaoPatrimonio: number | null;
}

/** Formato do arquivo JSON importado no primeiro acesso. */
export interface DadosIniciais {
  config: Config;
  saldos?: Omit<Saldos, 'updatedAt'>;
  snapshots?: Snapshot[];
}
