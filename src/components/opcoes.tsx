import { TIPOS } from '../domain/catalogos';
import type { Caixinha, Cartao } from '../domain/types';
import { IconeTipo } from './icones';
import { NomeCaixinha } from './marcas';
import type { OpcaoGrade } from './ui';

// Opções prontas para os seletores em grade: sempre ícone SVG + nome.

export const opcoesTipos = () =>
  TIPOS.map((t) => ({
    id: t.id,
    rotulo: (
      <span className="icone-texto">
        <IconeTipo tipo={t.id} /> {t.nome}
      </span>
    ),
  }));

export const opcoesMarcas = <T extends Caixinha | Cartao>(itens: T[]): OpcaoGrade<string>[] =>
  itens.map((i) => ({ id: i.id, rotulo: <NomeCaixinha caixinha={i} tamanho={16} /> }));
