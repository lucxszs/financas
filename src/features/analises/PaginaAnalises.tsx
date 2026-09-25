import { useState, type CSSProperties } from 'react';
import { AcoesItem, ModalConfirmacao, Secao, Vazio } from '../../components/ui';
import { corVar } from '../../components/cor';
import { calcularScore, totaisFechamento, totalSnapshot } from '../../domain/calculos';
import { rotuloDiaMes, rotuloMesCurto } from '../../domain/datas';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import type { Aporte, Fechamento } from '../../domain/types';
import { excluirAporte } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';
import { HistoricoMensal } from './HistoricoMensal';

export const PaginaAnalises = ({
  onNovoAporte,
  onEditarAporte,
}: {
  onNovoAporte: () => void;
  onEditarAporte: (a: Aporte) => void;
}) => {
  const { uid, config, aportes, snapshots, fechamentos, cotacoes } = useDadosConfigurados();
  const [aExcluir, setAExcluir] = useState<Aporte | null>(null);
  const caixinha = (id: string) => config.caixinhas.find((c) => c.id === id);
  const valorAporte = (a: Aporte) => formatarMoeda(a.val, caixinha(a.caixinha)?.moeda ?? 'BRL');

  return (
    <>
      <HistoricoMensal />

      <Secao titulo="Aportes lançados">
        <div className="card">
          <div className="tx-header">
            <span className="tx-header-title">Histórico de aportes</span>
            <button className="btn btn-mini" onClick={onNovoAporte}>
              🐷 Novo aporte
            </button>
          </div>
          {aportes.length === 0 ? (
            <Vazio>Nenhum aporte lançado ainda.</Vazio>
          ) : (
            aportes.map((a) => {
              const c = caixinha(a.caixinha);
              const nome = c?.nome ?? a.caixinha;
              return (
                <div key={a.id} className="tx-row">
                  <div className="tx-icon">{c?.emoji ?? '🐷'}</div>
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
                          {c.emoji} {formatarMoeda(v, c.moeda)}
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

      {fechamentos.length > 0 && <Fechamentos fechamentos={fechamentos} />}

      <ScoreMes />
    </>
  );
};

const ROTULO_RESPOSTA = { sim: 'sim', parcial: 'parcial', nao: 'não' } as const;

const ScoreMes = () => {
  const { saldos } = useDadosConfigurados();
  const score = calcularScore(saldos.score);
  return (
    <Secao titulo="Score do mês">
      <div className="score-card">
        <div className="score-icon">{score.icon}</div>
        <div className="score-info">
          <div className="score-title">{score.label}</div>
          <div className="score-sub">
            {saldos.score?.pagou
              ? `Contas: ${ROTULO_RESPOSTA[saldos.score.pagou]} · Positivo: ${ROTULO_RESPOSTA[saldos.score.positivo ?? 'nao']} · Aporte: ${ROTULO_RESPOSTA[saldos.score.aporte ?? 'nao']}`
              : 'Atualize os saldos para registrar o mês'}
          </div>
        </div>
        <div className={`score-badge ${score.cls}`}>{score.pts}/3</div>
      </div>
    </Secao>
  );
};

const Fechamentos = ({ fechamentos }: { fechamentos: Fechamento[] }) => {
  // Mais antigo à esquerda, mais recente selecionado por padrão.
  const ordenados = [...fechamentos].sort((a, b) => a.mes.localeCompare(b.mes));
  const [sel, setSel] = useState(ordenados.at(-1)?.mes ?? '');
  const atual = ordenados.find((f) => f.mes === sel) ?? ordenados.at(-1);
  if (!atual) return null;
  const t = totaisFechamento(atual);

  return (
    <Secao titulo="Gastos mensais">
      <div className="mes-tabs" role="tablist">
        {ordenados.map((f) => (
          <button
            key={f.mes}
            role="tab"
            aria-selected={f.mes === atual.mes}
            className={`mes-tab${f.mes === atual.mes ? ' active' : ''}`}
            onClick={() => setSel(f.mes)}
          >
            {rotuloMesCurto(f.mes)}
          </button>
        ))}
      </div>
      <div className="card">
        {atual.itens.map((i, idx) => (
          <div key={idx} className={`brow ${i.tipo === 'entrada' ? 'in' : 'out'}`}>
            <span className="bname">
              {i.emoji} {i.nome} {i.pago === true ? '✅' : i.pago === false ? '❌' : ''}
            </span>
            <span className="bval">
              {i.tipo === 'entrada' ? '+ ' : '− '}
              {fmt(i.valor)}
            </span>
          </div>
        ))}
        <div className="brow total">
          <span className="bname">📊 Total de saídas</span>
          <span className="bval">{fmt(t.saidas)}</span>
        </div>
        <div className={`brow ${t.saldo >= 0 ? 'positivo' : 'deficit'}`}>
          <span className="bname">{t.saldo >= 0 ? '🟢 Sobra' : '🔴 Déficit'}</span>
          <span className="bval">
            {t.saldo < 0 ? '− ' : '+ '}
            {fmt(Math.abs(t.saldo))}
          </span>
        </div>
        {t.pendente > 0 && (
          <div className="brow pendente">
            <span className="bname">⚠️ Pendente</span>
            <span className="bval">{fmt(t.pendente)}</span>
          </div>
        )}
        {atual.notas?.map((n, idx) => (
          <div key={`n${idx}`} className="brow pendente">
            <span className="bname">📝 {n}</span>
          </div>
        ))}
      </div>
    </Secao>
  );
};
