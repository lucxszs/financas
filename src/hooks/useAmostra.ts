import { useState } from 'react';

/**
 * Mostra só os primeiros `tamanho` itens de uma lista, com opção de expandir.
 * Quando `chave` muda (ex.: o mês da lista), volta a mostrar só a amostra.
 */
export const useAmostra = <T>(itens: T[], tamanho = 6, chave = '') => {
  const [expandidoEm, setExpandidoEm] = useState<string | null>(null);
  const expandido = expandidoEm === chave;
  return {
    visiveis: expandido ? itens : itens.slice(0, tamanho),
    expandido,
    total: itens.length,
    temMais: itens.length > tamanho,
    alternar: () => setExpandidoEm(expandido ? null : chave),
  };
};
