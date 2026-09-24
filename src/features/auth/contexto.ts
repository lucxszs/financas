import type { User } from 'firebase/auth';
import { createContext } from 'react';

export type EstadoAuth =
  | { status: 'carregando' }
  | { status: 'deslogado' }
  | { status: 'sem-acesso'; user: User }
  | { status: 'liberado'; user: User };

export interface AuthCtx {
  estado: EstadoAuth;
  entrar: () => Promise<void>;
  sair: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx | null>(null);
