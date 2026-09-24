import { useEffect, type ReactNode } from 'react';

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
  aberto,
  titulo,
  onFechar,
  children,
}: {
  aberto: boolean;
  titulo: ReactNode;
  onFechar: () => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="modal-overlay open" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
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
  <div className="tipo-grid" style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }} role="radiogroup">
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

export const BotaoExcluir = ({ onClick, titulo = 'Excluir' }: { onClick: () => void; titulo?: string }) => (
  <button type="button" className="btn-excluir" onClick={onClick} title={titulo} aria-label={titulo}>
    🗑
  </button>
);
