import { useState, type ReactNode } from 'react';
import { AcoesItem, GradeOpcoes, ModalConfirmacao, Secao, Vazio } from '../../components/ui';
import { corVar } from '../../components/cor';
import { CORES } from '../../domain/catalogos';
import type { Cor } from '../../domain/types';

export const SeletorCor = ({ valor, onChange }: { valor: Cor; onChange: (c: Cor) => void }) => (
  <GradeOpcoes
    colunas={5}
    opcoes={CORES.map((c) => ({
      id: c,
      rotulo: <span className="cor-dot" style={{ background: corVar(c) }} aria-label={c} />,
    }))}
    valor={valor}
    onChange={onChange}
  />
);

export interface LinhaLista {
  icone: ReactNode;
  titulo: ReactNode;
  sub?: ReactNode;
}

/** Lista de itens da configuração com "+ Novo", editar e excluir (com confirmação). */
export const ListaConfig = <T extends { id: string }>({
  titulo,
  itens,
  vazio,
  linha,
  onNovo,
  onEditar,
  onExcluir,
  descricao,
  extra,
}: {
  titulo: string;
  itens: T[];
  vazio: string;
  linha: (item: T) => LinhaLista;
  onNovo: () => void;
  onEditar: (item: T) => void;
  onExcluir: (item: T) => Promise<unknown>;
  descricao: (item: T) => string;
  extra?: ReactNode;
}) => {
  const [aExcluir, setAExcluir] = useState<T | null>(null);
  return (
    <Secao titulo={titulo}>
      <div className="card">
        <div className="tx-header">
          <span className="tx-header-title">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
          <button className="btn btn-mini" onClick={onNovo}>
            + Novo
          </button>
        </div>
        {itens.length === 0 ? (
          <Vazio>{vazio}</Vazio>
        ) : (
          itens.map((item) => {
            const l = linha(item);
            return (
              <div key={item.id} className="tx-row">
                <div className="tx-icon">{l.icone}</div>
                <div className="tx-info">
                  <div className="tx-desc">{l.titulo}</div>
                  {l.sub && <div className="tx-meta">{l.sub}</div>}
                </div>
                <AcoesItem
                  descricao={descricao(item)}
                  onEditar={() => onEditar(item)}
                  onExcluir={() => setAExcluir(item)}
                />
              </div>
            );
          })
        )}
        {extra}
      </div>
      {aExcluir && (
        <ModalConfirmacao
          titulo="Excluir?"
          mensagem={
            <>
              <strong>{descricao(aExcluir)}</strong>
              <br />
              Essa ação não pode ser desfeita.
            </>
          }
          onConfirmar={() => onExcluir(aExcluir)}
          onFechar={() => setAExcluir(null)}
        />
      )}
    </Secao>
  );
};
