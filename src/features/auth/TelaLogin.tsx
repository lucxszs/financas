import { useState } from 'react';
import { useAuth } from './useAuth';

export const TelaLogin = () => {
  const { estado, entrar, sair } = useAuth();
  const [erro, setErro] = useState('');

  const handleEntrar = async () => {
    setErro('');
    try {
      await entrar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha no login');
    }
  };

  if (estado.status === 'sem-acesso') {
    return (
      <div className="tela-centro">
        <div className="card card-pad tela-login">
          <h1>🔒 Acesso não liberado</h1>
          <p className="muted">
            A conta <strong>{estado.user.email}</strong> ainda não tem permissão.
          </p>
          <p className="muted mono pequeno">
            No Console do Firebase, crie o documento <code>acessos/{estado.user.uid}</code> no Firestore (pode
            ser vazio) e recarregue a página.
          </p>
          <button className="btn" onClick={() => void sair()}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tela-centro">
      <div className="card card-pad tela-login">
        <div className="eyebrow">Plano financeiro pessoal</div>
        <h1>Entrar</h1>
        <button className="btn-save" onClick={() => void handleEntrar()}>
          Entrar com Google
        </button>
        {erro && <div className="save-msg erro">{erro}</div>}
      </div>
    </div>
  );
};
