import { useState } from 'react';
import { AcoesItem, ModalConfirmacao, Secao } from '../../components/ui';
import { categoriaPorId, tipoPorId } from '../../domain/catalogos';
import { mesCompetencia, resumoTransacoes, transacoesDaCompetencia } from '../../domain/calculos';
import { mesAtualIso, rotuloDiaMes, rotuloMesCurto, rotuloMesLongo, somarMeses } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import type { Transacao } from '../../domain/types';
import { Repeat } from 'lucide-react';
import { Icone, IconeCategoria, IconeTipo } from '../../components/icones';
import { excluirTransacao, excluirTransacoes } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

export const ListaLancamentos = ({
  onNovo,
  onEditar,
}: {
  onNovo: () => void;
  onEditar: (t: Transacao) => void;
}) => {
  const { uid, transacoes, config } = useDadosConfigurados();
  const [mes, setMes] = useState(mesAtualIso());
  const [aExcluir, setAExcluir] = useState<Transacao | null>(null);
  const grupo = aExcluir?.grupoId ? transacoes.filter((t) => t.grupoId === aExcluir.grupoId) : [];

  // Compras no cartão aparecem no mês da fatura.
  const doMes = transacoesDaCompetencia(transacoes, mes);
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
            // Lançamentos antigos de recorrência guardavam "🔁 automático" na observação: o ícone já diz isso.
            const obs = t.obs === '🔁 automático' ? '' : t.obs;
            const meta = [
              tipo?.nome ?? t.tipo,
              nomeCartao(t.cartao),
              rotuloDiaMes(t.data),
              t.parcela && `parcela ${t.parcela.atual}/${t.parcela.total}`,
              mesCompetencia(t) !== t.data.slice(0, 7) && `fatura ${rotuloMesCurto(mesCompetencia(t))}`,
              obs,
            ].filter(Boolean);
            return (
              <div key={t.id} className="tx-row">
                <div className="tx-icon" title={categoriaPorId(t.cat)?.nome}>
                  <IconeCategoria cat={t.cat} />
                </div>
                <div className="tx-info">
                  <div className="tx-desc">{t.desc}</div>
                  <div className="tx-meta icone-texto">
                    <IconeTipo tipo={t.tipo} tamanho={12} />
                    {t.recorrenteId && <Icone icone={Repeat} tamanho={12} aria-label="automático" />}
                    {meta.join(' · ')}
                    {t.aConfirmar && <span className="selo-confirmar">confirmar valor</span>}
                  </div>
                </div>
                <div className={`tx-val ${t.isEntrada ? 'in' : 'out'}`}>
                  {t.isEntrada ? '+' : '−'}
                  {t.aConfirmar && '≈ '}
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
          rotuloConfirmar={grupo.length > 1 ? 'Só esta parcela' : 'Excluir'}
          onConfirmar={() => excluirTransacao(uid, aExcluir.id)}
          acaoExtra={
            grupo.length > 1
              ? {
                  rotulo: `Todas as ${grupo.length} parcelas`,
                  onConfirmar: () =>
                    excluirTransacoes(
                      uid,
                      grupo.map((t) => t.id),
                    ),
                }
              : undefined
          }
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
