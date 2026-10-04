import { useState } from 'react';
import type { Config } from '../../domain/types';
import { criarPlano } from '../../services/repositorio';
import { useAuth } from '../auth/useAuth';
import { useDados } from '../dados/useDados';

/** Plano mínimo para começar: uma conta corrente; o resto se cadastra em Configurações. */
const planoInicial = (nome: string, renda: number): Config => ({
  nome: nome || 'Meu plano',
  rendaMensal: renda,
  caixinhas: [
    { id: 'conta', nome: 'Conta corrente', moeda: 'BRL', rendimento: '', cor: 'sky', tipo: 'conta' },
  ],
  objetivos: [],
  cartoes: [],
});

/** Primeiro acesso: boas-vindas e um plano em branco. A configuração toda acontece dentro do app. */
export const TelaOnboarding = () => {
  const { uid } = useDados();
  const { estado } = useAuth();
  const nome = estado.status === 'liberado' ? (estado.user.displayName ?? '') : '';
  const primeiroNome = nome.split(' ')[0];
  const [renda, setRenda] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const comecar = async () => {
    const valor = renda.trim() === '' ? 0 : Number(renda.replace(',', '.'));
    if (!Number.isFinite(valor) || valor < 0) return setErro('Renda inválida');
    setErro('');
    setSalvando(true);
    try {
      await criarPlano(uid, planoInicial(nome, valor));
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
      setSalvando(false);
    }
  };

  return (
    <div className="tela-centro">
      <div className="card card-pad tela-login">
        <div className="eyebrow">Plano financeiro</div>
        <h1>{primeiroNome ? `Bem-vindo, ${primeiroNome}!` : 'Bem-vindo!'}</h1>
        <p className="muted">
          Aqui você acompanha gastos, cartões, investimentos e metas, e vê quanto ainda pode gastar no mês.
        </p>
        <div className="field">
          <label htmlFor="boas-vindas-renda">Sua renda mensal (opcional)</label>
          <input
            id="boas-vindas-renda"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="Ex: 5000"
            value={renda}
            onChange={(e) => setRenda(e.target.value)}
          />
        </div>
        <button className="btn-save" onClick={() => void comecar()} disabled={salvando}>
          {salvando ? 'Preparando...' : 'Começar'}
        </button>
        <p className="mono pequeno muted">
          Depois, em Configurações (ícone de engrenagem), cadastre suas contas, cartões, metas e contas fixas.
        </p>
        {erro && <div className="save-msg erro">{erro}</div>}
      </div>
    </div>
  );
};
