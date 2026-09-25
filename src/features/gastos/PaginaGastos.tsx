import { Barra, Secao, Vazio } from '../../components/ui';
import { corVar } from '../../components/cor';
import { categoriaPorId } from '../../domain/catalogos';
import { mesAtualIso, rotuloMesLongo } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import { orcamentoPorCategoria, type StatusOrcamento } from '../../domain/historico';
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
  const linhas = orcamentoPorCategoria(transacoes, config, mes);
  const maxReal = Math.max(1, ...linhas.map((l) => l.real));
  const totalReal = linhas.reduce((a, l) => a + l.real, 0);
  const totalMeta = linhas.reduce((a, l) => a + (l.meta ?? 0), 0);

  const medias = config.mediasGastos;
  const maxMedia = Math.max(1, ...(medias?.itens.map((i) => i.valor) ?? []));

  return (
    <>
      <ListaLancamentos onNovo={onNovo} onEditar={onEditar} />
      <CartoesResumo />

      <Secao titulo={`Gastos por categoria · ${rotuloMesLongo(mes)}`}>
        <div className="card">
          {linhas.length === 0 ? (
            <Vazio>Nenhum gasto este mês ainda.</Vazio>
          ) : (
            linhas.map((l) => {
              const c = categoriaPorId(l.cat);
              const st = l.status ? STATUS[l.status] : null;
              return (
                <div key={l.cat} className="orc-row">
                  <div className="linha-entre">
                    <span>
                      {c?.emoji ?? '🔧'} {c?.nome ?? l.cat}
                    </span>
                    <span className="mono">
                      {fmt(l.real)}
                      {l.meta !== null && <span className="muted"> / {fmt(l.meta)}</span>}
                    </span>
                  </div>
                  <Barra pct={l.pct ?? (l.real / maxReal) * 100} cor={st?.cor ?? 'var(--sky)'} altura={6} />
                  {st && (
                    <div className="mono mini muted mt-4">
                      {st.icone} {st.rotulo} · {l.pct!.toFixed(0)}% do orçamento
                    </div>
                  )}
                </div>
              );
            })
          )}
          {totalMeta > 0 && (
            <div className="brow total">
              <span className="bname">Total</span>
              <span className="bval">
                {fmt(totalReal)} <span className="muted">/ {fmt(totalMeta)} orçado</span>
              </span>
            </div>
          )}
        </div>
        {totalMeta === 0 && (
          <div className="nota">Defina um orçamento por categoria em ⚙️ Configurações.</div>
        )}
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

// Status usa as cores reservadas (verde/amarelo/vermelho) sempre com ícone e texto, nunca só a cor.
const STATUS: Record<StatusOrcamento, { icone: string; rotulo: string; cor: string }> = {
  ok: { icone: '🟢', rotulo: 'dentro', cor: 'var(--emerald)' },
  atencao: { icone: '🟡', rotulo: 'no limite', cor: 'var(--amber)' },
  estourou: { icone: '🔴', rotulo: 'estourou', cor: 'var(--coral)' },
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
