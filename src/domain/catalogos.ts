import type { Categoria, TipoTransacao } from './types';

export const TIPOS: { id: TipoTransacao; nome: string; emoji: string; entrada: boolean }[] = [
  { id: 'debito', nome: 'Débito', emoji: '💳', entrada: false },
  { id: 'pix', nome: 'PIX', emoji: '📱', entrada: false },
  { id: 'credito', nome: 'Crédito', emoji: '💳', entrada: false },
  { id: 'parcelado', nome: 'Parcelado', emoji: '📦', entrada: false },
  { id: 'dinheiro', nome: 'Dinheiro', emoji: '💵', entrada: false },
  { id: 'emprestei', nome: 'Emprestei', emoji: '🤝', entrada: false },
  { id: 'recebi', nome: 'Recebi', emoji: '✅', entrada: true },
  { id: 'salario', nome: 'Salário', emoji: '💰', entrada: true },
  { id: 'outro', nome: 'Outro', emoji: '🔧', entrada: false },
];

export const TIPOS_CREDITO: TipoTransacao[] = ['credito', 'parcelado'];

export const CATEGORIAS: { id: Categoria; nome: string; emoji: string }[] = [
  { id: 'alimentacao', nome: 'Alimentação', emoji: '🍜' },
  { id: 'mercado', nome: 'Mercado', emoji: '🛒' },
  { id: 'transporte', nome: 'Transporte', emoji: '🚗' },
  { id: 'saude', nome: 'Saúde/Farmácia', emoji: '💊' },
  { id: 'moradia', nome: 'Moradia', emoji: '🏠' },
  { id: 'lazer', nome: 'Lazer', emoji: '🎬' },
  { id: 'assinaturas', nome: 'Assinaturas', emoji: '📱' },
  { id: 'familia', nome: 'Família', emoji: '👨‍👩‍👧' },
  { id: 'educacao', nome: 'Educação', emoji: '📚' },
  { id: 'vestuario', nome: 'Vestuário', emoji: '👕' },
  { id: 'outro', nome: 'Outro', emoji: '🔧' },
];

export const tipoPorId = (id: string) => TIPOS.find((t) => t.id === id);
export const categoriaPorId = (id: string) => CATEGORIAS.find((c) => c.id === id);
export const isEntrada = (tipo: TipoTransacao) => tipoPorId(tipo)?.entrada ?? false;
