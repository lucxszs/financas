import { useState, type ReactNode } from 'react';
import { Briefcase, Calculator, Scissors, TrendingUp } from 'lucide-react';
import { Icone } from '../../components/icones';
import { GradeOpcoes, Secao } from '../../components/ui';
import { hojeIso, rotuloMesCurto } from '../../domain/datas';
import { fmt, fmtPct } from '../../domain/formatadores';
import { ritmoObjetivo } from '../../domain/metas';
import { aportePlanejado } from '../../domain/resumo';
import { impactoNaMeta, valorFuturo } from '../../domain/simulacao';
import { useDadosConfigurados } from '../dados/useDados';

type Cenario = 'renda' | 'gastar' | 'aporte';

const CENARIOS: { id: Cenario; rotulo: ReactNode }[] = [
  {
    id: 'renda',
    rotulo: (
      <span className="icone-texto">
        <Icone icone={Briefcase} tamanho={14} /> Ganhar mais
      </span>
    ),
  },
  {
    id: 'gastar',
    rotulo: (
      <span className="icone-texto">
        <Icone icone={Scissors} tamanho={14} /> Gastar menos
      </span>
    ),
  },
  {
    id: 'aporte',
    rotulo: (
      <span className="icone-texto">
        <Icone icone={TrendingUp} tamanho={14} /> Aportar mais
      </span>
    ),
  },
];

const meses = (n: number) => `${n} ${n === 1 ? 'mês' : 'meses'}`;

export const Simulador = () => {
  const { config, saldos, cotacoes, aportes } = useDadosConfigurados();
  const hoje = hojeIso();
  const planejado = aportePlanejado(config, cotacoes);
  const [cenario, setCenario] = useState<Cenario>('renda');
  const [valores, setValores] = useState<Record<Cenario, string>>({
    renda: String(config.rendaMensal + 1000),
    gastar: '500',
    aporte: String(Math.round(planejado) + 300),
  });
  const metas = config.objetivos
    .map((o) => ({ o, r: ritmoObjetivo(o, config, saldos.valores, cotacoes, aportes, hoje) }))
    .filter(({ r }) => !r.concluido);
  const [metaId, setMetaId] = useState(() => (metas.find(({ o }) => o.dataAlvo) ?? metas[0])?.o.id ?? '');

  const n = Number(valores[cenario].replace(',', '.'));
  const valido = valores[cenario].trim() !== '' && Number.isFinite(n);
  const extra = !valido
    ? 0
    : cenario === 'renda'
      ? n - config.rendaMensal
      : cenario === 'gastar'
        ? n
        : n - planejado;
  const rotulo = {
    renda: `Nova renda mensal (hoje ${fmt(config.rendaMensal)})`,
    gastar: 'Quanto a menos por mês',
    aporte: `Novo aporte mensal (hoje ${fmt(planejado)})`,
  }[cenario];
  const meta = metas.find(({ o }) => o.id === metaId);
  const impacto =
    meta && extra > 0 ? impactoNaMeta(meta.r.faltam, meta.r.atualMes, extra, hoje.slice(0, 7)) : null;

  return (
    <Secao titulo="Simulações: e se..." icone={Calculator}>
      <div className="card card-pad">
        <div className="field">
          <GradeOpcoes opcoes={CENARIOS} valor={cenario} onChange={setCenario} />
        </div>
        <div className="field">
          <label htmlFor="sim-valor">{rotulo} (R$)</label>
          <input
            id="sim-valor"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={valores[cenario]}
            onChange={(e) => setValores((v) => ({ ...v, [cenario]: e.target.value }))}
          />
        </div>

        {extra <= 0 ? (
          <div className="nota">Informe um valor que aumente o que sobra por mês.</div>
        ) : (
          <>
            <div className="sim-destaque">+ {fmt(extra)}/mês</div>
            <div className="brow">
              <span className="bname">Em 1 ano</span>
              <span className="bval">
                {fmt(extra * 12)}{' '}
                <span className="muted">
                  ({fmt(valorFuturo(extra, 12, config.taxaAnualEstimada))} investindo)
                </span>
              </span>
            </div>
            <div className="brow">
              <span className="bname">Em 3 anos</span>
              <span className="bval">
                {fmt(extra * 36)}{' '}
                <span className="muted">
                  ({fmt(valorFuturo(extra, 36, config.taxaAnualEstimada))} investindo)
                </span>
              </span>
            </div>

            {metas.length > 0 && (
              <div className="field mt-8">
                <label htmlFor="sim-meta">Direcionar o extra para</label>
                <select id="sim-meta" value={metaId} onChange={(e) => setMetaId(e.target.value)}>
                  {metas.map(({ o }) => (
                    <option key={o.id} value={o.id}>
                      {o.emoji ? `${o.emoji} ` : ''}
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {meta && impacto && (
              <div className="brow total">
                <span className="bname">{meta.o.nome}</span>
                <span className="bval">
                  {impacto.antes && impacto.mesesAntes !== null
                    ? `${rotuloMesCurto(impacto.antes)} (${meses(impacto.mesesAntes)})`
                    : 'sem previsão'}{' '}
                  → {impacto.depois && rotuloMesCurto(impacto.depois)} ({meses(impacto.mesesDepois ?? 0)})
                  {impacto.ganho !== null && impacto.ganho > 0 && (
                    <span className="verde"> · adianta {meses(impacto.ganho)}</span>
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="nota">
        &quot;Investindo&quot; usa o rendimento estimado das Configurações (
        {fmtPct(config.taxaAnualEstimada * 100, 1)} ao ano). O prazo das metas usa o ritmo atual de aportes
        mais o extra, sem rendimento.
      </div>
    </Secao>
  );
};
