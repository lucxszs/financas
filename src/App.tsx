import { useCallback, useState } from 'react';
import { fmt } from './domain/formatadores';
import { AuthProvider } from './features/auth/AuthProvider';
import { TelaLogin } from './features/auth/TelaLogin';
import { useAuth } from './features/auth/useAuth';
import { DadosProvider } from './features/dados/DadosProvider';
import { useDados } from './features/dados/useDados';
import { PaginaGastos } from './features/gastos/PaginaGastos';
import { PaginaHistorico } from './features/historico/PaginaHistorico';
import { PaginaLancamentos } from './features/lancamentos/PaginaLancamentos';
import { ModalAporte } from './features/modais/ModalAporte';
import { ModalSaldos } from './features/modais/ModalSaldos';
import { ModalTransacao } from './features/modais/ModalTransacao';
import { TelaOnboarding } from './features/onboarding/TelaOnboarding';
import { PaginaVisao } from './features/visao/PaginaVisao';

type Pagina = 'visao' | 'lancamentos' | 'historico' | 'gastos';
type ModalAberto = 'saldos' | 'transacao' | 'aporte' | null;

const PAGINAS: { id: Pagina; nome: string }[] = [
  { id: 'visao', nome: 'Visão geral' },
  { id: 'lancamentos', nome: 'Lançamentos' },
  { id: 'historico', nome: 'Histórico' },
  { id: 'gastos', nome: 'Gastos' },
];

export const App = () => (
  <AuthProvider>
    <Portao />
  </AuthProvider>
);

const Portao = () => {
  const { estado } = useAuth();
  if (estado.status === 'carregando') return <Carregando texto="Conectando..." />;
  if (estado.status !== 'liberado') return <TelaLogin />;
  return (
    <DadosProvider uid={estado.user.uid}>
      <Principal />
    </DadosProvider>
  );
};

const Principal = () => {
  const { config, saldos, erro } = useDados();
  const { sair } = useAuth();
  const [pagina, setPagina] = useState<Pagina>('visao');
  const [modal, setModal] = useState<ModalAberto>(null);
  const fechar = useCallback(() => setModal(null), []);

  if (erro) return <Carregando texto={`❌ Erro ao carregar dados: ${erro}`} />;
  if (config === undefined) return <Carregando texto="Carregando dados..." />;
  if (config === null) return <TelaOnboarding />;

  const atualizado = saldos.updatedAt
    ? `atualizado ${new Date(saldos.updatedAt).toLocaleDateString('pt-BR')}`
    : 'nunca atualizado';

  return (
    <div className="wrap">
      <header className="header">
        <div className="header-left">
          <div className="eyebrow">Plano financeiro pessoal</div>
          <h1>{config.nome}</h1>
          <div className="header-sub">
            {atualizado} · Renda {fmt(config.rendaMensal)}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => setModal('aporte')}>
            🐷 Lançar aporte
          </button>
          <button className="btn" onClick={() => setModal('transacao')}>
            + Lançar gasto
          </button>
          <button className="btn" onClick={() => setModal('saldos')}>
            ✏️ Atualizar saldos
          </button>
          <button className="btn" onClick={() => void sair()} title="Sair">
            ⎋ Sair
          </button>
        </div>
      </header>

      <nav className="nav" aria-label="Seções">
        {PAGINAS.map((p) => (
          <button
            key={p.id}
            className={`nav-btn${pagina === p.id ? ' active' : ''}`}
            aria-current={pagina === p.id ? 'page' : undefined}
            onClick={() => setPagina(p.id)}
          >
            {p.nome}
          </button>
        ))}
      </nav>

      <main>
        {pagina === 'visao' && <PaginaVisao />}
        {pagina === 'lancamentos' && <PaginaLancamentos onNovo={() => setModal('transacao')} />}
        {pagina === 'historico' && <PaginaHistorico onNovoAporte={() => setModal('aporte')} />}
        {pagina === 'gastos' && <PaginaGastos />}
      </main>

      {modal === 'saldos' && <ModalSaldos onFechar={fechar} />}
      {modal === 'transacao' && <ModalTransacao onFechar={fechar} />}
      {modal === 'aporte' && <ModalAporte onFechar={fechar} />}
    </div>
  );
};

const Carregando = ({ texto }: { texto: string }) => (
  <div className="tela-centro">
    <div className="mono muted">{texto}</div>
  </div>
);
