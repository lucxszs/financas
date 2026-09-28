import { AR, BR, CA, CL, ES, EU, FR, GB, IT, JP, PT, US, UY } from 'country-flag-icons/react/3x2';
import { instituicaoDe } from '../domain/instituicoes';
import { codigoBandeira } from './bandeiras';
import type { Caixinha, Cartao } from '../domain/types';
import { LogoInstituicao } from './logos';

// Só os países mais prováveis: importar todos aumentaria o bundle em centenas de kB.
const BANDEIRAS: Record<string, typeof AR> = { AR, BR, CA, CL, ES, EU, FR, GB, IT, JP, PT, US, UY };

/** Emoji digitado pelo usuário; bandeiras viram SVG (o Windows não desenha bandeira emoji). */
export const EmojiItem = ({ emoji, tamanho = 18 }: { emoji?: string; tamanho?: number }) => {
  if (!emoji) return null;
  const codigo = codigoBandeira(emoji);
  const B = codigo ? BANDEIRAS[codigo] : undefined;
  if (B) return <B className="bandeira" title={codigo!} style={{ width: tamanho * 1.4, height: tamanho }} />;
  return <span className="emoji-item">{emoji}</span>;
};

/** Identidade visual de uma caixinha ou cartão: logo do banco; sem banco, o emoji cadastrado. */
export const MarcaItem = ({ item, tamanho = 22 }: { item: Caixinha | Cartao; tamanho?: number }) => {
  const inst = instituicaoDe(item);
  if (inst) return <LogoInstituicao id={inst} tamanho={tamanho} />;
  return <EmojiItem emoji={item.emoji} tamanho={tamanho * 0.8} />;
};

/** Nome da caixinha com o logo do banco e, se o emoji dela for uma bandeira, a bandeira depois do nome. */
export const NomeCaixinha = ({
  caixinha,
  tamanho = 18,
}: {
  caixinha: Caixinha | Cartao;
  tamanho?: number;
}) => (
  <span className="nome-marca">
    <MarcaItem item={caixinha} tamanho={tamanho} />
    <span>{caixinha.nome}</span>
    {codigoBandeira(caixinha.emoji) && <EmojiItem emoji={caixinha.emoji} tamanho={tamanho * 0.7} />}
  </span>
);
