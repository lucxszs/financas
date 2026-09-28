import { useCallback, useState } from 'react';
import {
  ChartColumn,
  CreditCard,
  House,
  LogOut,
  PiggyBank,
  Plus,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Icone } from './components/icones';
import { Modal } from './components/ui';
import type { Aporte, Transacao } from './domain/types';
import { AuthProvider } from './features/auth/AuthProvider';
import { TelaLogin } from './features/auth/TelaLogin';
import { useAuth } from './features/auth/useAuth';
import { DadosProvider } from './features/dados/DadosProvider';
import { useDados } from './features/dados/useDados';
import { PaginaAnalises } from './features/analises/PaginaAnalises';
import { PaginaConfiguracoes } from './features/configuracoes/PaginaConfiguracoes';
import { PaginaDashboard } from './features/dashboard/PaginaDashboard';
import { PaginaGastos } from './features/gastos/PaginaGastos';
import { PaginaMetas } from './features/metas/PaginaMetas';
import { ModalAporte } from './features/modais/ModalAporte';
import { ModalSaldos } from './features/modais/ModalSaldos';
import { ModalTransacao } from './features/modais/ModalTransacao';
import { TelaOnboarding } from './features/onboarding/TelaOnboarding';
import { PaginaPatrimonio } from './features/patrimonio/PaginaPatrimonio';

type Pagina = 'dashboard' | 'gastos' | 'patrimonio' | 'metas' | 'analises' | 'configuracoes';
type ModalAberto =
  { tipo: 'saldos' } | { tipo: 'transacao'; item?: Transacao } | { tipo: 'aporte'; item?: Aporte } | null;

// Configurações sai do menu principal: fica no ícone de engrenagem do cabeçalho.
const PAGINAS: { id: Exclude<Pagina, 'configuracoes'>; nome: string; icone: LucideIcon }[] = [
  { id: 'dashboard', nome: 'Início', icone: House },
  { id: 'gastos', nome: 'Gastos', icone: CreditCard },
  { id: 'patrimonio', nome: 'Patrimônio', icone: TrendingUp },
  { id: 'metas', nome: 'Metas', icone: Target },
  { id: 'analises', nome: 'Análises', icone: ChartColumn },
];

type Acao = { id: 'transacao' | 'aporte' | 'saldos'; nome: string; icone: LucideIcon };
const ACOES: Acao[] = [
  { id: 'transacao', nome: 'Lançar gasto', icone: Plus },
  { id: 'aporte', nome: 'Lançar aporte', icone: PiggyBank },
  { id: 'saldos', nome: 'Atualizar saldos', icone: RefreshCw },
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
  const [pagina, setPagina] = useState<Pagina>('dashboard');
  const [modal, setModal] = useState<ModalAberto>(null);
  const [menuAcoes, setMenuAcoes] = useState(false);
  const fechar = useCallback(() => setModal(null), []);

  if (erro) return <Carregando texto={`Erro ao carregar dados: ${erro}`} />;
  if (config === undefined) return <Carregando texto="Carregando dados..." />;
  if (config === null) return <TelaOnboarding />;

  const atualizado = saldos.updatedAt
    ? `atualizado ${new Date(saldos.updatedAt).toLocaleDateString('pt-BR')}`
    : 'nunca atualizado';

  const abrir = (a: Acao['id']) => {
    setMenuAcoes(false);
    setModal({ tipo: a });
  };

  return (
    <div className="wrap">
      <header className="topo">
        <div className="topo-marca">
          <h1>Plano financeiro</h1>
          <div className="header-sub">{atualizado}</div>
        </div>
        <div className="topo-acoes">
          {ACOES.map((a, i) => (
            <button key={a.id} className={`btn${i === 0 ? ' btn-primario' : ''}`} onClick={() => abrir(a.id)}>
              <Icone icone={a.icone} tamanho={15} /> {a.nome}
            </button>
          ))}
        </div>
        <div className="topo-icones">
          <button
            className={`btn-topo${pagina === 'configuracoes' ? ' ativo' : ''}`}
            onClick={() => setPagina('configuracoes')}
            aria-label="Configurações"
            aria-current={pagina === 'configuracoes' ? 'page' : undefined}
            title="Configurações"
          >
            <Icone icone={Settings} tamanho={19} />
          </button>
          <button className="btn-topo" onClick={() => void sair()} aria-label="Sair" title="Sair">
            <Icone icone={LogOut} tamanho={19} />
          </button>
        </div>
      </header>

      <nav className="abas" aria-label="Seções">
        {PAGINAS.map((p) => (
          <button
            key={p.id}
            className={`aba${pagina === p.id ? ' ativa' : ''}`}
            aria-current={pagina === p.id ? 'page' : undefined}
            onClick={() => setPagina(p.id)}
          >
            <Icone icone={p.icone} tamanho={18} />
            <span>{p.nome}</span>
          </button>
        ))}
      </nav>

      <main>
        {pagina === 'dashboard' && <PaginaDashboard />}
        {pagina === 'gastos' && (
          <PaginaGastos
            onNovo={() => setModal({ tipo: 'transacao' })}
            onEditar={(item) => setModal({ tipo: 'transacao', item })}
          />
        )}
        {pagina === 'patrimonio' && <PaginaPatrimonio />}
        {pagina === 'metas' && <PaginaMetas />}
        {pagina === 'analises' && (
          <PaginaAnalises
            onNovoAporte={() => setModal({ tipo: 'aporte' })}
            onEditarAporte={(item) => setModal({ tipo: 'aporte', item })}
          />
        )}
        {pagina === 'configuracoes' && <PaginaConfiguracoes />}
      </main>

      {/* Celular: as ações ficam num botão flutuante acima da barra de abas. */}
      <button className="fab" onClick={() => setMenuAcoes(true)} aria-label="Lançar">
        <Icone icone={Plus} tamanho={24} strokeWidth={2.25} />
      </button>
      {menuAcoes && (
        <Modal titulo="O que você quer fazer?" onFechar={() => setMenuAcoes(false)}>
          <div className="menu-acoes">
            {ACOES.map((a) => (
              <button key={a.id} className="menu-acao" onClick={() => abrir(a.id)}>
                <Icone icone={a.icone} tamanho={20} />
                {a.nome}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal?.tipo === 'saldos' && <ModalSaldos onFechar={fechar} />}
      {modal?.tipo === 'transacao' && <ModalTransacao transacao={modal.item} onFechar={fechar} />}
      {modal?.tipo === 'aporte' && <ModalAporte aporte={modal.item} onFechar={fechar} />}
    </div>
  );
};

const Carregando = ({ texto }: { texto: string }) => (
  <div className="tela-centro">
    <div className="mono muted">{texto}</div>
  </div>
);
