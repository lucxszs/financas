import { Percent } from 'lucide-react';
import { NomeCaixinha } from '../../components/marcas';
import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { rotuloMesCurto } from '../../domain/datas';
import { fmt, fmtPct, formatarMoeda } from '../../domain/formatadores';
import { rentabilidadeCaixinhas, totalRentabilidade } from '../../domain/rentabilidade';
import { useDadosConfigurados } from '../dados/useDados';

const pctSinal = (v: number) => `${v >= 0 ? '+' : ''}${fmtPct(v, 2)}`;

export const Rentabilidade = () => {
  const { config, saldos, snapshots, cotacoes } = useDadosConfigurados();
  const itens = rentabilidadeCaixinhas(config, saldos.valores, snapshots, cotacoes);
  const total = totalRentabilidade(itens, cotacoes);

  if (!itens.length) return null;

  return (
    <Secao titulo="Rentabilidade" icone={Percent}>
      <div className="card">
        <div className="brow">
          <span className="bname">Investido (saldo − rendimentos)</span>
          <span className="bval">{fmt(total.investido)}</span>
        </div>
        <div className="brow">
          <span className="bname">Rendimentos</span>
          <span className={`bval ${total.rendimento >= 0 ? 'verde' : 'coral'}`}>
            {total.rendimento < 0 ? '− ' : '+ '}
            {fmt(Math.abs(total.rendimento))}
          </span>
        </div>
        <div className="brow total">
          <span className="bname">
            Rentabilidade{total.inicio && ` desde ${rotuloMesCurto(total.inicio)}`}
          </span>
          <span className="bval">
            {total.pct === null || !total.inicio ? 'sem rendimentos informados' : pctSinal(total.pct)}
          </span>
        </div>
      </div>

      <div className="card mt-8">
        {itens.map((i) => (
          <div key={i.caixinha.id} className="orc-row">
            <div className="linha-entre">
              <NomeCaixinha caixinha={i.caixinha} tamanho={16} />
              <span className="mono">
                {formatarMoeda(i.atual, i.caixinha.moeda)}{' '}
                <span className="muted">· {fmtPct(total.alocacao[i.caixinha.id] ?? 0, 1)}</span>
              </span>
            </div>
            <Barra pct={total.alocacao[i.caixinha.id] ?? 0} cor={corVar(i.caixinha.cor)} altura={5} />
            <div className="mono mini muted mt-4">
              {i.pct === null
                ? 'sem rendimento informado no "Atualizar saldos"'
                : `${pctSinal(i.pct)} · rendeu ${formatarMoeda(i.rendimento, i.caixinha.moeda)} em ${i.meses} ${i.meses === 1 ? 'mês' : 'meses'}`}
            </div>
          </div>
        ))}
      </div>
      <div className="nota">
        Rendimentos = soma do &quot;rendimento do mês&quot; informado no &quot;Atualizar saldos&quot;; mês sem
        rendimento informado conta zero. Investido = saldo atual − rendimentos.
      </div>
    </Secao>
  );
};
