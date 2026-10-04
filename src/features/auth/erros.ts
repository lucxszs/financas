// Códigos do Firebase Auth: https://firebase.google.com/docs/reference/js/auth#autherrorcodes
const MENSAGENS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Entre ou use "Esqueci a senha".',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/missing-password': 'Informe a senha.',
  'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente de novo.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups para este site.',
  'auth/operation-not-allowed': 'Este tipo de login não está ativado no Firebase.',
};

/** Mensagem em português para um erro de login. `null` quando o usuário só fechou a janela do Google. */
export const mensagemErroAuth = (e: unknown): string | null => {
  const codigo = (e as { code?: string } | null)?.code ?? '';
  if (codigo === 'auth/popup-closed-by-user' || codigo === 'auth/cancelled-popup-request') return null;
  return MENSAGENS[codigo] ?? 'Não foi possível concluir. Tente de novo.';
};
