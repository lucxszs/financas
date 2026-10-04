import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import { AuthContext, type EstadoAuth } from './contexto';

// Qualquer conta entra. Contas Google já chegam com o e-mail verificado; e-mail e senha precisam confirmar o
// link antes de acessar os dados (as regras do Firestore exigem email_verified).
const estadoDe = (user: User | null): EstadoAuth =>
  !user
    ? { status: 'deslogado' }
    : user.emailVerified
      ? { status: 'liberado', user }
      : { status: 'verificar-email', user };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<EstadoAuth>({ status: 'carregando' });

  useEffect(() => onAuthStateChanged(auth, (user) => setEstado(estadoDe(user))), []);

  const entrarComGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const entrarComEmail = useCallback(async (email: string, senha: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  }, []);

  const criarConta = useCallback(async (nome: string, email: string, senha: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), senha);
    if (nome.trim()) await updateProfile(user, { displayName: nome.trim() });
    await sendEmailVerification(user);
  }, []);

  const redefinirSenha = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const reenviarVerificacao = useCallback(async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  }, []);

  const confirmarVerificacao = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    await user.reload();
    // Token novo: as regras do Firestore só enxergam email_verified depois de renovar o token.
    if (user.emailVerified) await user.getIdToken(true);
    setEstado(estadoDe(auth.currentUser));
  }, []);

  const sair = useCallback(() => signOut(auth), []);

  const valor = useMemo(
    () => ({
      estado,
      entrarComGoogle,
      entrarComEmail,
      criarConta,
      redefinirSenha,
      reenviarVerificacao,
      confirmarVerificacao,
      sair,
    }),
    [
      estado,
      entrarComGoogle,
      entrarComEmail,
      criarConta,
      redefinirSenha,
      reenviarVerificacao,
      confirmarVerificacao,
      sair,
    ],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
