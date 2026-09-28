import { Receipt, Wrench, type LucideIcon, type LucideProps } from 'lucide-react';
import type { Categoria, TipoTransacao } from '../domain/types';
import { ICONE_CATEGORIA, ICONE_TIPO } from './mapaIcones';

export const IconeCategoria = ({ cat, tamanho = 18 }: { cat: Categoria; tamanho?: number }) => (
  <Icone icone={ICONE_CATEGORIA[cat] ?? Wrench} tamanho={tamanho} />
);

export const IconeTipo = ({ tipo, tamanho = 14 }: { tipo: TipoTransacao; tamanho?: number }) => (
  <Icone icone={ICONE_TIPO[tipo] ?? Receipt} tamanho={tamanho} />
);

/** Tamanho e traço padrão dos ícones do app. */
export const Icone = ({
  icone: I,
  tamanho = 16,
  ...props
}: { icone: LucideIcon; tamanho?: number } & LucideProps) => (
  <I size={tamanho} strokeWidth={1.75} aria-hidden="true" {...props} />
);
