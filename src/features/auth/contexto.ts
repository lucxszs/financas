import type { User } from 'firebase/auth';
import { createContext } from 'react';

export type EstadoAuth =
  | { status: 'carregando' }
  | { status: 'deslogado' }
  /** Conta de e-mail e senha que ainda não confirmou o e-mail: as regras do Firestore bloqueiam os dados. */
  | { status: 'verificar-email'; user: User }
  | { status: 'liberado'; user: User };

export interface AuthCtx {
  estado: EstadoAuth;
  entrarComGoogle: () => Promise<void>;
  entrarComEmail: (email: string, senha: string) => Promise<void>;
  /** Cria a conta e envia o e-mail de confirmação. */
  criarConta: (nome: string, email: string, senha: string) => Promise<void>;
  redefinirSenha: (email: string) => Promise<void>;
  reenviarVerificacao: () => Promise<void>;
  /** Recarrega a conta depois de o usuário clicar no link de confirmação. */
  confirmarVerificacao: () => Promise<void>;
  sair: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx | null>(null);
