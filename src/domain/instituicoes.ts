export type Instituicao = 'nubank' | 'itau' | 'inter' | 'mercadopago' | 'wise';

export interface DadosInstituicao {
  nome: string;
  /** Cor oficial da marca. */
  cor: string;
  /** Cor do logo/iniciais sobre a cor da marca. */
  corTexto: string;
  /** Iniciais para bancos sem logo em SVG livre. */
  sigla: string;
}

export const INSTITUICOES: Record<Instituicao, DadosInstituicao> = {
  nubank: { nome: 'Nubank', cor: '#820AD1', corTexto: '#FFFFFF', sigla: 'Nu' },
  itau: { nome: 'Itaú', cor: '#EC7000', corTexto: '#FFFFFF', sigla: 'itaú' },
  inter: { nome: 'Inter', cor: '#FF7A00', corTexto: '#FFFFFF', sigla: 'in' },
  mercadopago: { nome: 'Mercado Pago', cor: '#00B1EA', corTexto: '#FFFFFF', sigla: 'MP' },
  wise: { nome: 'Wise', cor: '#9FE870', corTexto: '#163300', sigla: 'W' },
};

export const LISTA_INSTITUICOES = Object.entries(INSTITUICOES).map(([id, d]) => ({
  id: id as Instituicao,
  ...d,
}));

const PADROES: [RegExp, Instituicao][] = [
  [/\bnu\s?bank\b|\bnu\b/i, 'nubank'],
  [/ita[uú]/i, 'itau'],
  [/\binter\b/i, 'inter'],
  [/mercado\s?pago|\bmp\b/i, 'mercadopago'],
  [/\bwise\b/i, 'wise'],
];

/** Banco de uma caixinha ou cartão: o escolhido em Configurações ou, sem escolha, deduzido do nome. */
export const instituicaoDe = (item: { instituicao?: Instituicao; nome: string }): Instituicao | null =>
  item.instituicao ?? PADROES.find(([re]) => re.test(item.nome))?.[1] ?? null;
