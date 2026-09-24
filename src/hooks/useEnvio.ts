import { useCallback, useState } from 'react';

/** Estado padrão de um formulário que grava algo: mensagem, carregando e fechamento após sucesso. */
export const useEnvio = (onSucesso: () => void, atrasoMs = 800) => {
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const avisar = useCallback((texto: string) => {
    setErro(true);
    setMsg(texto);
  }, []);

  const enviar = useCallback(
    async (acao: () => Promise<unknown>, sucesso = '✅ Salvo!') => {
      setSalvando(true);
      setErro(false);
      setMsg('');
      try {
        await acao();
        setMsg(sucesso);
        setTimeout(() => {
          setMsg('');
          onSucesso();
        }, atrasoMs);
      } catch (e) {
        setErro(true);
        setMsg(`❌ Erro: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setSalvando(false);
      }
    },
    [onSucesso, atrasoMs],
  );

  const limpar = useCallback(() => {
    setMsg('');
    setErro(false);
  }, []);

  return { msg, erro, salvando, avisar, enviar, limpar };
};
