import { useState, type ChangeEvent } from 'react';
import type { DadosIniciais } from '../../domain/types';
import { validarDadosIniciais } from '../../domain/validacao';
import { useAuth } from '../auth/useAuth';
import { importarDados } from '../../services/repositorio';
import { useDados } from '../dados/useDados';
import exemplo from '../../../seed/exemplo.json';

/** Plano mínimo para quem começa sem arquivo: uma conta corrente; o resto se cadastra em Configurações. */
const planoInicial = (nome: string): DadosIniciais => ({
  config: {
    nome: nome || 'Meu plano',
    rendaMensal: 0,
    taxaAnualEstimada: 0.1,
    caixinhas: [
      { id: 'conta', nome: 'Conta corrente', moeda: 'BRL', rendimento: '', cor: 'sky', tipo: 'conta' },
    ],
    objetivos: [],
    cartoes: [],
  },
});

export const TelaOnboarding = () => {
  const { uid } = useDados();
  const { estado } = useAuth();
  const nome = estado.status === 'liberado' ? (estado.user.displayName ?? '') : '';
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const importar = async (json: unknown) => {
    const r = validarDadosIniciais(json);
    if (!r.ok) return setErros(r.erros);
    setErros([]);
    setSalvando(true);
    try {
      await importarDados(uid, r.dados);
    } catch (e) {
      setErros([e instanceof Error ? e.message : String(e)]);
    } finally {
      setSalvando(false);
    }
  };

  const onArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      await importar(JSON.parse(await arquivo.text()));
    } catch {
      setErros(['Arquivo não é um JSON válido']);
    }
  };

  return (
    <div className="tela-centro">
      <div className="card card-pad tela-login">
        <div className="eyebrow">Primeiro acesso</div>
        <h1>Configurar plano</h1>
        <p className="muted">
          Comece do zero e cadastre renda, contas, cartões e metas em Configurações. Se já tiver tudo num
          arquivo, importe o JSON (formato em <code>seed/exemplo.json</code>).
        </p>
        <button className="btn-save" onClick={() => void importar(planoInicial(nome))} disabled={salvando}>
          Começar do zero
        </button>
        <label className="btn largura-total centro">
          {salvando ? 'Importando...' : 'Importar JSON'}
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => void onArquivo(e)}
            disabled={salvando}
          />
        </label>
        <button className="btn" onClick={() => void importar(exemplo)} disabled={salvando}>
          Usar dados de exemplo
        </button>
        {erros.length > 0 && (
          <ul className="lista-erros">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
