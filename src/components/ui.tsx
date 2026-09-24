import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';

export const Secao = ({ titulo, children }: { titulo: ReactNode; children: ReactNode }) => (
  <section className="section">
    <div className="section-label">{titulo}</div>
    {children}
  </section>
);

export const Barra = ({
  pct,
  cor,
  altura = 3,
  opacidade = 1,
}: {
  pct: number;
  cor: string;
  altura?: number;
  opacidade?: number;
}) => (
  <div className="barra" style={{ height: altura }}>
    <div
      className="barra-fill"
      style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: cor, opacity: opacidade }}
    />
  </div>
);

export const Vazio = ({ children }: { children: ReactNode }) => <div className="vazio">{children}</div>;

export const Modal = ({
  titulo,
  onFechar,
  children,
}: {
  titulo: ReactNode;
  onFechar: () => void;
  children: ReactNode;
}) => {
  const idTitulo = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', onKey);
    // Evita que a página de fundo role junto no celular.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onFechar]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <div className="modal-topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/** Confirmação de ação destrutiva, no lugar do window.confirm (que é ruim no celular). */
export const ModalConfirmacao = ({
  titulo,
  mensagem,
  rotuloConfirmar = 'Excluir',
  onConfirmar,
  onFechar,
}: {
  titulo: string;
  mensagem: ReactNode;
  rotuloConfirmar?: string;
  onConfirmar: () => Promise<unknown>;
  onFechar: () => void;
}) => {
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState('');

  const confirmar = async () => {
    setExecutando(true);
    setErro('');
    try {
      await onConfirmar();
      onFechar();
    } catch (e) {
      setErro(`❌ Erro: ${e instanceof Error ? e.message : String(e)}`);
      setExecutando(false);
    }
  };

  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <div className="confirmacao-msg">{mensagem}</div>
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onFechar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-save perigo"
          onClick={() => void confirmar()}
          disabled={executando}
        >
          {executando ? 'Excluindo...' : rotuloConfirmar}
        </button>
      </div>
      <div className="save-msg erro">{erro}</div>
    </Modal>
  );
};

export interface OpcaoGrade<T extends string> {
  id: T;
  rotulo: ReactNode;
}

export const GradeOpcoes = <T extends string>({
  opcoes,
  valor,
  onChange,
  colunas = 3,
}: {
  opcoes: OpcaoGrade<T>[];
  valor: T | '';
  onChange: (v: T) => void;
  colunas?: number;
}) => (
  <div className="tipo-grid" style={{ '--colunas': colunas } as CSSProperties} role="radiogroup">
    {opcoes.map((o) => (
      <button
        type="button"
        key={o.id}
        role="radio"
        aria-checked={valor === o.id}
        className={`tipo-btn${valor === o.id ? ' selected' : ''}`}
        onClick={() => onChange(o.id)}
      >
        {o.rotulo}
      </button>
    ))}
  </div>
);

export const AcoesModal = ({
  onCancelar,
  rotuloSalvar,
  salvando,
}: {
  onCancelar: () => void;
  rotuloSalvar: string;
  salvando: boolean;
}) => (
  <div className="modal-actions">
    <button type="button" className="btn-cancel" onClick={onCancelar}>
      Cancelar
    </button>
    <button type="submit" className="btn-save" disabled={salvando}>
      {salvando ? 'Salvando...' : rotuloSalvar}
    </button>
  </div>
);

/** Botões de editar e excluir de uma linha de lista. */
export const AcoesItem = ({
  descricao,
  onEditar,
  onExcluir,
}: {
  descricao: string;
  onEditar: () => void;
  onExcluir: () => void;
}) => (
  <div className="acoes-item">
    <button
      type="button"
      className="btn-icone"
      onClick={onEditar}
      title="Editar"
      aria-label={`Editar ${descricao}`}
    >
      ✏️
    </button>
    <button
      type="button"
      className="btn-icone perigo"
      onClick={onExcluir}
      title="Excluir"
      aria-label={`Excluir ${descricao}`}
    >
      🗑
    </button>
  </div>
);
