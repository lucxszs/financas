import { useEffect, useState } from 'react';
import { History, Pencil, Plus, RotateCcw, Trash2, type LucideIcon } from 'lucide-react';
import { Icone } from '../../components/icones';
import { GradeOpcoes, ModalConfirmacao, MostrarMais, Secao, Vazio } from '../../components/ui';
import {
  ROTULO_ENTIDADE,
  ROTULO_ORIGEM,
  camposAlterados,
  podeRestaurar,
  textoValor,
  type AcaoHistorico,
  type RegistroHistorico,
} from '../../domain/auditoria';
import { useAmostra } from '../../hooks/useAmostra';
import { observarHistorico, restaurarExclusao } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

type Filtro = 'todos' | 'transacao' | 'aporte' | 'outros';

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'transacao', rotulo: 'Lançamentos' },
  { id: 'aporte', rotulo: 'Aportes' },
  { id: 'outros', rotulo: 'Outros' },
];

const ACAO: Record<AcaoHistorico, { icone: LucideIcon; rotulo: string; cls: string }> = {
  criar: { icone: Plus, rotulo: 'criado', cls: 'verde' },
  editar: { icone: Pencil, rotulo: 'editado', cls: 'azul' },
  excluir: { icone: Trash2, rotulo: 'excluído', cls: 'coral' },
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Tudo o que foi criado, editado e excluído, com o antes e o depois de cada alteração. */
export const HistoricoAlteracoes = () => {
  const { uid, transacoes, aportes } = useDadosConfigurados();
  const [registros, setRegistros] = useState<RegistroHistorico[] | null>(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [aberto, setAberto] = useState<string | null>(null);
  const [restaurando, setRestaurando] = useState<RegistroHistorico | null>(null);

  // Carrega só quando a seção aparece: o histórico não é usado no resto do app.
  useEffect(
    () =>
      observarHistorico(uid, setRegistros, (e) => {
        console.error(e);
        setErro(e.message);
      }),
    [uid],
  );

  const filtrados = (registros ?? []).filter((r) =>
    filtro === 'todos'
      ? true
      : filtro === 'outros'
        ? r.entidade !== 'transacao' && r.entidade !== 'aporte'
        : r.entidade === filtro,
  );
  const amostra = useAmostra(filtrados, 10, filtro);
  // Já restaurado (ou nunca saiu): o documento existe de novo.
  const existe = (r: RegistroHistorico) =>
    (r.entidade === 'transacao' ? transacoes : aportes).some((x) => x.id === r.docId);

  return (
    <Secao titulo="Histórico de alterações" icone={History}>
      <div className="card">
        <div className="card-pad">
          <GradeOpcoes colunas={4} opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
        </div>
        {erro && <Vazio>Não foi possível carregar o histórico: {erro}</Vazio>}
        {!erro && registros === null && <Vazio>Carregando...</Vazio>}
        {registros !== null && filtrados.length === 0 && <Vazio>Nada registrado ainda.</Vazio>}
        {amostra.visiveis.map((r) => {
          const a = ACAO[r.acao];
          const campos = aberto === r.id ? camposAlterados(r.antes, r.depois) : [];
          return (
            <div key={r.id} className="hist-row">
              <button
                className="hist-topo"
                onClick={() => setAberto(aberto === r.id ? null : r.id)}
                aria-expanded={aberto === r.id}
              >
                <span className={`hist-icone ${a.cls}`}>
                  <Icone icone={a.icone} tamanho={15} />
                </span>
                <span className="hist-info">
                  <span className="tx-desc">{r.resumo}</span>
                  <span className="tx-meta">
                    {ROTULO_ENTIDADE[r.entidade]} {a.rotulo} · {dataHora(r.em)} · por{' '}
                    {ROTULO_ORIGEM[r.origem]}
                  </span>
                </span>
              </button>
              {aberto === r.id && (
                <div className="hist-detalhe">
                  {campos.length === 0 ? (
                    <div className="mono mini muted">Sem campos alterados.</div>
                  ) : (
                    campos.map((c) => (
                      <div key={c.campo} className="hist-campo mono mini">
                        <span className="muted">{c.campo}</span>
                        <span>
                          {r.acao !== 'criar' && <span className="coral">{textoValor(c.antes)}</span>}
                          {r.acao === 'editar' && ' → '}
                          {r.acao !== 'excluir' && <span className="verde">{textoValor(c.depois)}</span>}
                        </span>
                      </div>
                    ))
                  )}
                  {podeRestaurar(r) && !existe(r) && (
                    <button className="btn btn-mini mt-8" onClick={() => setRestaurando(r)}>
                      <Icone icone={RotateCcw} tamanho={14} /> Desfazer exclusão
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {amostra.temMais && (
          <MostrarMais total={amostra.total} expandido={amostra.expandido} onAlternar={amostra.alternar} />
        )}
      </div>
      <div className="nota">
        Cada criação, edição e exclusão fica registrada no banco (users/seu-id/historico) e não pode ser
        editada nem apagada. Mostra as 300 alterações mais recentes.
      </div>
      {restaurando && (
        <ModalConfirmacao
          titulo="Desfazer exclusão?"
          rotuloConfirmar="Restaurar"
          mensagem={
            <>
              <strong>{restaurando.resumo}</strong> volta como estava antes de ser excluído.
            </>
          }
          onConfirmar={() => restaurarExclusao(uid, restaurando)}
          onFechar={() => setRestaurando(null)}
        />
      )}
    </Secao>
  );
};
