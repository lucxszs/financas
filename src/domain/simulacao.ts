import { somarMeses } from './datas';

/** Meses para juntar `faltam` guardando `mensal` (sem rendimento, como o ritmo das metas). null se não há aporte. */
export const mesesParaJuntar = (faltam: number, mensal: number) =>
  faltam <= 0 ? 0 : mensal > 0 ? Math.ceil(faltam / mensal) : null;

export interface ImpactoMeta {
  mesesAntes: number | null;
  mesesDepois: number | null;
  /** "YYYY-MM" de conclusão. */
  antes: string | null;
  depois: string | null;
  /** Meses a menos (positivo = adianta). */
  ganho: number | null;
}

/** Quanto adianta uma meta direcionando `extra` por mês para ela, além do ritmo atual. */
export const impactoNaMeta = (
  faltam: number,
  ritmoAtual: number,
  extra: number,
  mesAtual: string,
): ImpactoMeta => {
  const mesesAntes = mesesParaJuntar(faltam, ritmoAtual);
  const mesesDepois = mesesParaJuntar(faltam, ritmoAtual + extra);
  return {
    mesesAntes,
    mesesDepois,
    antes: mesesAntes === null ? null : somarMeses(mesAtual, mesesAntes),
    depois: mesesDepois === null ? null : somarMeses(mesAtual, mesesDepois),
    ganho: mesesAntes !== null && mesesDepois !== null ? mesesAntes - mesesDepois : null,
  };
};
