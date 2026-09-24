import { useState } from 'react';
import { AcoesItem, ModalConfirmacao, Secao } from '../../components/ui';
import { categoriaPorId, tipoPorId } from '../../domain/catalogos';
import { resumoTransacoes, transacoesDoMes } from '../../domain/calculos';
import { mesAtualIso, rotuloDiaMes, rotuloMesLongo, somarMeses } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import type { Transacao } from '../../domain/types';
import { excluirTransacao } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

export const PaginaLancamentos = ({
  onNovo,
  onEditar,
}: {
  onNovo: () => void;
  onEditar: (t: Transacao) => void;
}) => {
  const { uid, transacoes, config } = useDadosConfigurados();
  const [mes, setMes] = useState(mesAtualIso());
  const [aExcluir, setAExcluir] = useState<Transacao | null>(null);

  const doMes = transacoesDoMes(transacoes, mes);
  const { entradas, saidas, saldo } = resumoTransacoes(doMes);
  const nomeCartao = (id: string | null) => config.cartoes.find((c) => c.id === id)?.nome;

  return (
    <Secao titulo="Lançamentos">
      <div className="card">
        <div className="tx-header">
          <div className="seletor-mes">
            <button
              className="btn-icone"
              onClick={() => setMes((m) => somarMeses(m, -1))}
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <span className="tx-header-title">{rotuloMesLongo(mes)}</span>
            <button
              className="btn-icone"
              onClick={() => setMes((m) => somarMeses(m, 1))}
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
          <button className="btn btn-mini" onClick={onNovo}>
            + Novo
          </button>
        </div>

        {doMes.length === 0 ? (
          <div className="tx-empty">
            Nenhum lançamento neste mês.
            <br />
            Toque em &quot;+ Novo&quot; para começar.
          </div>
        ) : (
          doMes.map((t) => {
            const tipo = tipoPorId(t.tipo);
            const meta = [
              `${tipo?.emoji ?? ''} ${tipo?.nome ?? t.tipo}`,
              nomeCartao(t.cartao),
              rotuloDiaMes(t.data),
              t.obs,
            ].filter(Boolean);
            return (
              <div key={t.id} className="tx-row">
                <div className="tx-icon">{categoriaPorId(t.cat)?.emoji ?? '🔧'}</div>
                <div className="tx-info">
                  <div className="tx-desc">{t.desc}</div>
                  <div className="tx-meta">{meta.join(' · ')}</div>
                </div>
                <div className={`tx-val ${t.isEntrada ? 'in' : 'out'}`}>
                  {t.isEntrada ? '+' : '−'}
                  {fmt(t.val)}
                </div>
                <AcoesItem descricao={t.desc} onEditar={() => onEditar(t)} onExcluir={() => setAExcluir(t)} />
              </div>
            );
          })
        )}

        <div className="tx-summary">
          <Resumo rotulo="Entradas" valor={fmt(entradas)} cor="var(--emerald)" />
          <Resumo rotulo="Saídas" valor={fmt(saidas)} cor="var(--coral)" />
          <Resumo
            rotulo="Saldo"
            valor={`${saldo < 0 ? '−' : ''}${fmt(Math.abs(saldo))}`}
            cor={saldo >= 0 ? 'var(--emerald)' : 'var(--coral)'}
          />
        </div>
      </div>

      {aExcluir && (
        <ModalConfirmacao
          titulo="Excluir lançamento?"
          mensagem={
            <>
              <strong>{aExcluir.desc}</strong> · {fmt(aExcluir.val)} · {rotuloDiaMes(aExcluir.data)}
              <br />
              Essa ação não pode ser desfeita.
            </>
          }
          onConfirmar={() => excluirTransacao(uid, aExcluir.id)}
          onFechar={() => setAExcluir(null)}
        />
      )}
    </Secao>
  );
};

const Resumo = ({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) => (
  <div className="tx-sum-item">
    <div className="tx-sum-label">{rotulo}</div>
    <div className="tx-sum-val" style={{ color: cor }}>
      {valor}
    </div>
  </div>
);
