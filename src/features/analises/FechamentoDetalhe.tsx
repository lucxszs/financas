import { categoriaPorId } from '../../domain/catalogos';
import { fmt } from '../../domain/formatadores';
import type { FechamentoMes } from '../../domain/types';

const sinal = (v: number) => `${v < 0 ? '− ' : '+ '}${fmt(Math.abs(v))}`;

/** Linhas de um fechamento (prévia no Dashboard e histórico em Análises). */
export const FechamentoDetalhe = ({ f }: { f: FechamentoMes }) => {
  const cat = f.maiorCategoria && categoriaPorId(f.maiorCategoria.cat);
  return (
    <>
      <div className="brow">
        <span className="bname">Renda{f.rendaPrevista && ' (prevista)'}</span>
        <span className="bval">{fmt(f.renda)}</span>
      </div>
      <div className="brow out">
        <span className="bname">Gastos</span>
        <span className="bval">{fmt(f.gastos)}</span>
      </div>
      <div className="brow">
        <span className="bname">Investimentos</span>
        <span className="bval violeta">{fmt(f.investimentos)}</span>
      </div>
      <div className={`brow total ${f.saldo >= 0 ? 'positivo' : 'deficit'}`}>
        <span className="bname">Saldo</span>
        <span className="bval">{f.saldo < 0 ? `− ${fmt(-f.saldo)}` : fmt(f.saldo)}</span>
      </div>
      <div className="brow">
        <span className="bname">Taxa de poupança</span>
        <span className="bval">{f.taxaPoupanca.toFixed(1)}%</span>
      </div>
      {f.maiorCategoria && (
        <div className="brow">
          <span className="bname">
            Maior categoria: {cat?.emoji} {cat?.nome ?? f.maiorCategoria.cat}
          </span>
          <span className="bval">{fmt(f.maiorCategoria.valor)}</span>
        </div>
      )}
      {f.maiorGasto && (
        <div className="brow">
          <span className="bname">Maior gasto: {f.maiorGasto.desc}</span>
          <span className="bval">{fmt(f.maiorGasto.valor)}</span>
        </div>
      )}
      {f.aportesPorMeta.map((m) => (
        <div key={m.objetivoId} className="brow">
          <span className="bname">
            Meta: {m.emoji ?? '🎯'} {m.nome}
          </span>
          <span className="bval verde">+ {fmt(m.valor)}</span>
        </div>
      ))}
      <div className="brow">
        <span className="bname">📈 Patrimônio</span>
        <span className="bval">
          {f.patrimonio === null ? 'sem foto dos saldos' : fmt(f.patrimonio)}
          {f.variacaoPatrimonio !== null && (
            <span className={f.variacaoPatrimonio >= 0 ? 'verde' : 'coral'}>
              {' '}
              ({sinal(f.variacaoPatrimonio)})
            </span>
          )}
        </span>
      </div>
    </>
  );
};
