import type { Categoria, Cor, TipoTransacao } from './types';

export const TIPOS: { id: TipoTransacao; nome: string; entrada: boolean }[] = [
  { id: 'debito', nome: 'Débito', entrada: false },
  { id: 'pix', nome: 'PIX', entrada: false },
  { id: 'credito', nome: 'Crédito', entrada: false },
  { id: 'parcelado', nome: 'Parcelado', entrada: false },
  { id: 'dinheiro', nome: 'Dinheiro', entrada: false },
  { id: 'emprestei', nome: 'Emprestei', entrada: false },
  { id: 'recebi', nome: 'Recebi', entrada: true },
  { id: 'salario', nome: 'Salário', entrada: true },
  { id: 'outro', nome: 'Outro', entrada: false },
];

export const TIPOS_CREDITO: TipoTransacao[] = ['credito', 'parcelado'];

export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: 'alimentacao', nome: 'Alimentação' },
  { id: 'mercado', nome: 'Mercado' },
  { id: 'transporte', nome: 'Transporte' },
  { id: 'saude', nome: 'Saúde/Farmácia' },
  { id: 'moradia', nome: 'Moradia' },
  { id: 'lazer', nome: 'Lazer' },
  { id: 'assinaturas', nome: 'Assinaturas' },
  { id: 'familia', nome: 'Família' },
  { id: 'educacao', nome: 'Educação' },
  { id: 'vestuario', nome: 'Vestuário' },
  { id: 'outro', nome: 'Outro' },
];

export const tipoPorId = (id: string) => TIPOS.find((t) => t.id === id);
export const categoriaPorId = (id: string) => CATEGORIAS.find((c) => c.id === id);
export const isEntrada = (tipo: TipoTransacao) => tipoPorId(tipo)?.entrada ?? false;

export const CORES: Cor[] = ['emerald', 'amber', 'violet', 'coral', 'sky'];
