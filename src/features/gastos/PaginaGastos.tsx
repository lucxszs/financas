import { Barra, Secao, Vazio } from '../../components/ui';
import { corVar } from '../../components/cor';
import { categoriaPorId } from '../../domain/catalogos';
import { gastosPorCategoria, transacoesDaCompetencia } from '../../domain/calculos';
import { mesAtualIso, rotuloMesLongo } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import type { Transacao } from '../../domain/types';
import { useDadosConfigurados } from '../dados/useDados';
import { CartoesResumo } from './CartoesResumo';
import { ListaLancamentos } from './ListaLancamentos';

export const PaginaGastos = ({
  onNovo,
  onEditar,
}: {
  onNovo: () => void;
  onEditar: (t: Transacao) => void;
}) => {
  const { transacoes, config } = useDadosConfigurados();
  const mes = mesAtualIso();
  const porCat = gastosPorCategoria(transacoesDaCompetencia(transacoes, mes));
  const max = porCat[0]?.[1] ?? 1;

  const medias = config.mediasGastos;
  const maxMedia = Math.max(1, ...(medias?.itens.map((i) => i.valor) ?? []));

  return (
    <>
      <ListaLancamentos onNovo={onNovo} onEditar={onEditar} />
      <CartoesResumo />

      <Secao titulo={`Gastos por categoria · ${rotuloMesLongo(mes)}`}>
        <div className="card card-pad">
          {porCat.length === 0 ? (
            <Vazio>Nenhum lançamento este mês ainda.</Vazio>
          ) : (
            porCat.map(([cat, val]) => {
              const c = categoriaPorId(cat);
              return (
                <LinhaGrafico
                  key={cat}
                  rotulo={`${c?.emoji ?? '🔧'} ${c?.nome ?? cat}`}
                  valor={val}
                  pct={(val / max) * 100}
                  cor="var(--violet)"
                />
              );
            })
          )}
        </div>
      </Secao>

      {medias && medias.itens.length > 0 && (
        <Secao titulo={`Média histórica · ${medias.periodo}`}>
          <div className="card card-pad">
            {medias.itens.map((i) => (
              <LinhaGrafico
                key={i.nome}
                rotulo={`${i.emoji ?? ''} ${i.nome}`.trim()}
                valor={i.valor}
                pct={(i.valor / maxMedia) * 100}
                cor={corVar(i.cor)}
              />
            ))}
          </div>
        </Secao>
      )}
    </>
  );
};

const LinhaGrafico = ({
  rotulo,
  valor,
  pct,
  cor,
}: {
  rotulo: string;
  valor: number;
  pct: number;
  cor: string;
}) => (
  <div className="chart-row">
    <span className="chart-label" title={rotulo}>
      {rotulo}
    </span>
    <div className="chart-bar-wrap">
      <Barra pct={pct} cor={cor} altura={7} />
    </div>
    <span className="chart-val">{fmt(valor)}</span>
  </div>
);
