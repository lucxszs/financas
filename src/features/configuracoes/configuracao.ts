import { useCallback } from 'react';
import type { Config } from '../../domain/types';
import { validarDadosIniciais } from '../../domain/validacao';
import { salvarConfig } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

/** Salva a config inteira depois de validar (mesmas regras da importação). Lança erro com a lista de problemas. */
export const useSalvarConfig = () => {
  const { uid, config } = useDadosConfigurados();
  return useCallback(
    async (alterar: (c: Config) => Config) => {
      const nova = alterar(config);
      const r = validarDadosIniciais({ config: nova });
      if (!r.ok) throw new Error(r.erros.join('; '));
      await salvarConfig(uid, nova);
    },
    [uid, config],
  );
};

/** "" vira null; texto inválido vira NaN (para o formulário recusar). */
export const numeroOuNulo = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

export const diaValido = (n: number | null) => n !== null && Number.isInteger(n) && n >= 1 && n <= 31;
