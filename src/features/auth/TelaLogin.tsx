import { signInWithEmailAndPassword } from 'firebase/auth';
import { MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Icone } from '../../components/icones';
import { auth, usandoEmuladores } from '../../lib/firebase';
import { mensagemErroAuth } from './erros';
import { useAuth } from './useAuth';

// Usuário criado por scripts/seed-emulador.mjs. Só existe no emulador local.
const USUARIO_TESTE = { email: 'dev@financas.local', senha: 'dev12345' };

type Modo = 'entrar' | 'criar' | 'recuperar';

/** Executa uma ação de login e devolve a mensagem de erro (ou '' se deu certo / foi cancelada). */
const useAcao = () => {
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const executar = async (acao: () => Promise<unknown>, sucesso = '') => {
    setErro('');
    setAviso('');
    setOcupado(true);
    try {
      await acao();
      setAviso(sucesso);
    } catch (e) {
      setErro(mensagemErroAuth(e) ?? '');
    } finally {
      setOcupado(false);
    }
  };
  return { erro, aviso, ocupado, executar, setErro };
};

export const TelaLogin = () => {
  const { estado } = useAuth();
  if (estado.status === 'verificar-email') return <VerificarEmail email={estado.user.email ?? ''} />;
  return <Entrar />;
};

const Entrar = () => {
  const { entrarComGoogle, entrarComEmail, criarConta, redefinirSenha } = useAuth();
  const { erro, aviso, ocupado, executar, setErro } = useAcao();
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  const trocar = (m: Modo) => {
    setModo(m);
    setErro('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (modo === 'recuperar')
      return void executar(
        () => redefinirSenha(email),
        'Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha.',
      );
    if (modo === 'criar') {
      if (senha !== confirmacao) return setErro('As senhas não conferem.');
      return void executar(() => criarConta(nome, email, senha));
    }
    void executar(() => entrarComEmail(email, senha));
  };

  const titulo = { entrar: 'Entrar', criar: 'Criar conta', recuperar: 'Recuperar senha' }[modo];

  return (
    <div className="tela-centro">
      <div className="card card-pad tela-login">
        <div className="eyebrow">Plano financeiro pessoal</div>
        <h1>{titulo}</h1>

        {modo !== 'recuperar' && (
          <>
            <button className="btn-save" onClick={() => void executar(entrarComGoogle)} disabled={ocupado}>
              Continuar com Google
            </button>
            <div className="divisor">ou com e-mail</div>
          </>
        )}

        <form onSubmit={onSubmit} className="form-login">
          {modo === 'criar' && (
            <div className="field">
              <label htmlFor="login-nome">Nome</label>
              <input
                id="login-nome"
                autoComplete="name"
                maxLength={60}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {modo !== 'recuperar' && (
            <div className="field">
              <label htmlFor="login-senha">Senha</label>
              <input
                id="login-senha"
                type="password"
                autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          )}
          {modo === 'criar' && (
            <div className="field">
              <label htmlFor="login-confirmacao">Confirmar senha</label>
              <input
                id="login-confirmacao"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>
          )}
          <button type="submit" className="btn largura-total centro" disabled={ocupado}>
            {ocupado
              ? 'Aguarde...'
              : { entrar: 'Entrar', criar: 'Criar conta', recuperar: 'Enviar link' }[modo]}
          </button>
        </form>

        {erro && <div className="save-msg erro">{erro}</div>}
        {aviso && <div className="save-msg">{aviso}</div>}

        <div className="links-login">
          {modo === 'entrar' && (
            <>
              <button className="link" onClick={() => trocar('criar')}>
                Criar conta
              </button>
              <button className="link" onClick={() => trocar('recuperar')}>
                Esqueci a senha
              </button>
            </>
          )}
          {modo !== 'entrar' && (
            <button className="link" onClick={() => trocar('entrar')}>
              Já tenho conta
            </button>
          )}
        </div>

        {usandoEmuladores && (
          <button
            className="btn"
            onClick={() =>
              void executar(() => signInWithEmailAndPassword(auth, USUARIO_TESTE.email, USUARIO_TESTE.senha))
            }
          >
            Entrar como usuário de teste (emulador)
          </button>
        )}
      </div>
    </div>
  );
};

/** Conta de e-mail e senha criada, mas ainda sem o e-mail confirmado. */
const VerificarEmail = ({ email }: { email: string }) => {
  const { reenviarVerificacao, confirmarVerificacao, sair } = useAuth();
  const { erro, aviso, ocupado, executar } = useAcao();
  return (
    <div className="tela-centro">
      <div className="card card-pad tela-login">
        <div className="verificar-icone">
          <Icone icone={MailCheck} tamanho={36} />
        </div>
        <h1>Confirme seu e-mail</h1>
        <p className="muted">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra o e-mail (confira o spam),
          clique no link e volte aqui.
        </p>
        <button
          className="btn-save"
          disabled={ocupado}
          onClick={() =>
            void executar(
              confirmarVerificacao,
              'Ainda não confirmado. Clique no link do e-mail e tente de novo.',
            )
          }
        >
          Já confirmei
        </button>
        <button
          className="btn largura-total centro"
          disabled={ocupado}
          onClick={() => void executar(reenviarVerificacao, 'E-mail reenviado.')}
        >
          Reenviar e-mail
        </button>
        {erro && <div className="save-msg erro">{erro}</div>}
        {aviso && <div className="save-msg">{aviso}</div>}
        <button className="link" onClick={() => void sair()}>
          Sair e usar outra conta
        </button>
      </div>
    </div>
  );
};
