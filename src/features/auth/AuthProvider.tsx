import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import { temAcesso } from '../../services/repositorio';
import { AuthContext, type EstadoAuth } from './contexto';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<EstadoAuth>({ status: 'carregando' });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) return setEstado({ status: 'deslogado' });
        setEstado({ status: 'carregando' });
        try {
          const ok = await temAcesso(user.uid);
          setEstado({ status: ok ? 'liberado' : 'sem-acesso', user });
        } catch {
          // Sem permissão para ler /acessos/{uid} também significa "não liberado".
          setEstado({ status: 'sem-acesso', user });
        }
      }),
    [],
  );

  const entrar = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const sair = useCallback(() => signOut(auth), []);

  const valor = useMemo(() => ({ estado, entrar, sair }), [estado, entrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
