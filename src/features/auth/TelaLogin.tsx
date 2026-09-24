import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { auth, usandoEmuladores } from '../../lib/firebase';
import { useAuth } from './useAuth';

// Usuário criado por scripts/seed-emulador.mjs. Só existe no emulador local.
const USUARIO_TESTE = { email: 'dev@financas.local', senha: 'dev12345' };

export const TelaLogin = () => {
  const { estado, entrar, sair } = useAuth();
  const [erro, setErro] = useState('');

  const tentar = async (acao: () => Promise<unknown>) => {
    setErro('');
    try {
      await acao();
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
        <button className="btn-save" onClick={() => void tentar(entrar)}>
          Entrar com Google
        </button>
        {usandoEmuladores && (
          <button
            className="btn"
            onClick={() =>
              void tentar(() => signInWithEmailAndPassword(auth, USUARIO_TESTE.email, USUARIO_TESTE.senha))
            }
          >
            🧪 Entrar como usuário de teste (emulador)
          </button>
        )}
        {erro && <div className="save-msg erro">{erro}</div>}
      </div>
    </div>
  );
};
