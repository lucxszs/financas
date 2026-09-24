import { useContext } from 'react';
import { DadosContext } from './contexto';
import type { Config } from '../../domain/types';

export const useDados = () => {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>');
  return ctx;
};

/** Para telas que só renderizam depois que a config existe. */
export const useDadosConfigurados = () => {
  const dados = useDados();
  if (!dados.config) throw new Error('Config ainda não carregada');
  return { ...dados, config: dados.config as Config };
};
