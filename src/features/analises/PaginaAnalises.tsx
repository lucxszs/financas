import { useState, type CSSProperties } from 'react';
import { PiggyBank } from 'lucide-react';
import { Icone } from '../../components/icones';
import { MarcaItem } from '../../components/marcas';
import { AcoesItem, ModalConfirmacao, MostrarMais, Secao, Vazio } from '../../components/ui';
import { useAmostra } from '../../hooks/useAmostra';
import { corVar } from '../../components/cor';
import { totalSnapshot } from '../../domain/calculos';
import { rotuloDiaMes, rotuloMesCurto } from '../../domain/datas';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import type { Aporte } from '../../domain/types';
import { excluirAporte } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';
import { HistoricoMensal } from './HistoricoMensal';
import { MesesFechados } from './MesesFechados';
import { PossoComprar } from './PossoComprar';
import { Simulador } from './Simulador';

export const PaginaAnalises = ({
  onNovoAporte,
  onEditarAporte,
}: {
  onNovoAporte: () => void;
  onEditarAporte: (a: Aporte) => void;
}) => {
  const { uid, config, aportes, snapshots, cotacoes } = useDadosConfigurados();
  const [aExcluir, setAExcluir] = useState<Aporte | null>(null);
  const amostraAportes = useAmostra(aportes, 6);
  const caixinha = (id: string) => config.caixinhas.find((c) => c.id === id);
  const valorAporte = (a: Aporte) => formatarMoeda(a.val, caixinha(a.caixinha)?.moeda ?? 'BRL');

  return (
    <>
      <HistoricoMensal />
      <MesesFechados />
      <PossoComprar />
      <Simulador />

      <Secao titulo="Aportes lançados">
        <div className="card">
          <div className="tx-header">
            <span className="tx-header-title">Histórico de aportes</span>
            <button className="btn btn-mini" onClick={onNovoAporte}>
              <Icone icone={PiggyBank} tamanho={14} /> Novo aporte
            </button>
          </div>
          {aportes.length === 0 ? (
            <Vazio>Nenhum aporte lançado ainda.</Vazio>
          ) : (
            amostraAportes.visiveis.map((a) => {
              const c = caixinha(a.caixinha);
              const nome = c?.nome ?? a.caixinha;
              return (
                <div key={a.id} className="tx-row">
                  <div className="tx-icon">
                    {c ? <MarcaItem item={c} /> : <Icone icone={PiggyBank} tamanho={18} />}
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{nome}</div>
                    <div className="tx-meta">{[rotuloDiaMes(a.data), a.obs].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="tx-val in">+{valorAporte(a)}</div>
                  <AcoesItem
                    descricao={`aporte em ${nome}`}
                    onEditar={() => onEditarAporte(a)}
                    onExcluir={() => setAExcluir(a)}
                  />
                </div>
              );
            })
          )}
          {amostraAportes.temMais && (
            <MostrarMais
              total={amostraAportes.total}
              expandido={amostraAportes.expandido}
              onAlternar={amostraAportes.alternar}
            />
          )}
        </div>
      </Secao>

      {aExcluir && (
        <ModalConfirmacao
          titulo="Excluir aporte?"
          mensagem={
            <>
              <strong>{caixinha(aExcluir.caixinha)?.nome ?? aExcluir.caixinha}</strong> ·{' '}
              {valorAporte(aExcluir)} · {rotuloDiaMes(aExcluir.data)}
              <br />
              Essa ação não pode ser desfeita.
            </>
          }
          onConfirmar={() => excluirAporte(uid, aExcluir.id)}
          onFechar={() => setAExcluir(null)}
        />
      )}

      <Secao titulo="Evolução dos investimentos">
        <div className="card card-pad">
          <div className="evo-cabecalho">
            <div className="evo-mes">MÊS</div>
            <div className="flex-1">SALDOS</div>
            <div className="evo-total">TOTAL</div>
          </div>
          {snapshots.length === 0 ? (
            <Vazio>Atualize os saldos para começar o histórico.</Vazio>
          ) : (
            snapshots.map((s) => {
              const rendTotal = Object.values(s.rendimentos ?? {}).reduce((a, v) => a + v, 0);
              return (
                <div key={s.mes} className="evo-row">
                  <div className="evo-mes">{rotuloMesCurto(s.mes)}</div>
                  <div className="evo-vals">
                    {config.caixinhas.map((c) => {
                      const v = s.valores[c.id];
                      if (!v) return null;
                      return (
                        <span
                          key={c.id}
                          className="evo-chip"
                          style={{ '--cor': corVar(c.cor) } as CSSProperties}
                        >
                          <MarcaItem item={c} tamanho={14} /> {formatarMoeda(v, c.moeda)}
                        </span>
                      );
                    })}
                    {rendTotal > 0 && <span className="mono mini verde">+{fmt(rendTotal)}</span>}
                  </div>
                  <div className="evo-total">{fmt(totalSnapshot(s, config, cotacoes).total)}</div>
                </div>
              );
            })
          )}
        </div>
      </Secao>
    </>
  );
};
