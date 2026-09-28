import {
  Banknote,
  BookOpen,
  Car,
  Clapperboard,
  CreditCard,
  HandCoins,
  HeartHandshake,
  House,
  Package,
  Pill,
  QrCode,
  Receipt,
  ShoppingCart,
  Shirt,
  Smartphone,
  Users,
  Utensils,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Categoria, TipoTransacao } from '../domain/types';

// Ícones de interface em SVG (lucide). Emojis ficam só no que o usuário digita (ex.: emoji de um objetivo).

export const ICONE_CATEGORIA: Record<Categoria, LucideIcon> = {
  alimentacao: Utensils,
  mercado: ShoppingCart,
  transporte: Car,
  saude: Pill,
  moradia: House,
  lazer: Clapperboard,
  assinaturas: Smartphone,
  familia: Users,
  educacao: BookOpen,
  vestuario: Shirt,
  outro: Wrench,
};

export const ICONE_TIPO: Record<TipoTransacao, LucideIcon> = {
  debito: CreditCard,
  pix: QrCode,
  credito: CreditCard,
  parcelado: Package,
  dinheiro: Banknote,
  emprestei: HeartHandshake,
  recebi: HandCoins,
  salario: Wallet,
  outro: Receipt,
};
