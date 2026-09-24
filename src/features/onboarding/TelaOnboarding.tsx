import { useState, type ChangeEvent } from 'react';
import { validarDadosIniciais } from '../../domain/validacao';
import { importarDados } from '../../services/repositorio';
import { useDados } from '../dados/useDados';
import exemplo from '../../../seed/exemplo.json';

export const TelaOnboarding = () => {
  const { uid } = useDados();
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
          Importe o arquivo JSON com suas caixinhas, metas, cartões e histórico. O formato está em{' '}
          <code>seed/exemplo.json</code> e no README.
        </p>
        <label className="btn-save centro">
          {salvando ? 'Importando...' : '📂 Importar JSON'}
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
