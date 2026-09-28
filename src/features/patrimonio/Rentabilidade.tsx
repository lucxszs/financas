import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { mesAtualIso, rotuloMesCurto, somarMeses } from '../../domain/datas';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import { acumulado, rentabilidadeCaixinhas, totalRentabilidade } from '../../domain/rentabilidade';
import { useIndicadores } from '../../hooks/useIndicadores';
import { useDadosConfigurados } from '../dados/useDados';

const pctSinal = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')}%`;

export const Rentabilidade = () => {
  const { config, saldos, snapshots, aportes, cotacoes } = useDadosConfigurados();
  const itens = rentabilidadeCaixinhas(config, saldos.valores, snapshots, aportes, cotacoes);
  const total = totalRentabilidade(itens, cotacoes);
  // O rendimento começa a contar depois da primeira foto dos saldos.
  const desde = total.inicio ? somarMeses(total.inicio, 1) : null;
  const { cdi, ipca, status } = useIndicadores(desde);
  const mes = mesAtualIso();
  const cdiPeriodo = desde ? acumulado(cdi, desde, mes) : null;
  const ipcaPeriodo = desde ? acumulado(ipca, desde, mes) : null;

  if (!itens.length) return null;

  return (
    <Secao titulo="Rentabilidade">
      <div className="card">
        <div className="brow">
          <span className="bname">Investido (saldo inicial + aportes)</span>
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
          <span className="bval">{total.pct === null ? '·' : pctSinal(total.pct)}</span>
        </div>
        {desde && (
          <div className="brow">
            <span className="bname">
              CDI · IPCA no período
              {cdiPeriodo && ` (até ${rotuloMesCurto(cdiPeriodo.ate)})`}
            </span>
            <span className="bval">
              {status === 'erro' || (!cdiPeriodo && status !== 'loading')
                ? 'indisponível'
                : status === 'loading' && !cdiPeriodo
                  ? 'buscando...'
                  : `${cdiPeriodo ? pctSinal(cdiPeriodo.pct) : '·'} · ${ipcaPeriodo ? pctSinal(ipcaPeriodo.pct) : '·'}`}
            </span>
          </div>
        )}
      </div>

      <div className="card mt-8">
        {itens.map((i) => (
          <div key={i.caixinha.id} className="orc-row">
            <div className="linha-entre">
              <span>
                {i.caixinha.emoji} {i.caixinha.nome}
              </span>
              <span className="mono">
                {formatarMoeda(i.atual, i.caixinha.moeda)}{' '}
                <span className="muted">
                  · {(total.alocacao[i.caixinha.id] ?? 0).toFixed(1).replace('.', ',')}%
                </span>
              </span>
            </div>
            <Barra pct={total.alocacao[i.caixinha.id] ?? 0} cor={corVar(i.caixinha.cor)} altura={5} />
            <div className="mono mini muted mt-4">
              {i.pct === null
                ? 'sem valor investido registrado'
                : `${pctSinal(i.pct)} · rendeu ${formatarMoeda(i.rendimento, i.caixinha.moeda)} sobre ${formatarMoeda(i.investido, i.caixinha.moeda)}`}
            </div>
          </div>
        ))}
      </div>
      <div className="nota">
        Investido = saldo na primeira foto do &quot;Atualizar saldos&quot; + aportes lançados depois. Saques
        não são registrados e reduzem o rendimento. CDI e IPCA: Banco Central, compostos mês a mês desde o mês
        seguinte à primeira foto; comparação aproximada, porque os aportes entram ao longo do período.
        {status === 'antiga' && ' ⚠️ Banco Central indisponível: usando os últimos valores guardados.'}
      </div>
    </Secao>
  );
};
