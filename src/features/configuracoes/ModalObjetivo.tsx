import { useState, type CSSProperties, type FormEvent } from 'react';
import { AcoesModal, Modal } from '../../components/ui';
import { gerarId } from '../../domain/ids';
import type { Cor, Objetivo } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { useDadosConfigurados } from '../dados/useDados';
import { SeletorCor } from './componentes';
import { numeroOuNulo, useSalvarConfig } from './configuracao';

export const ModalObjetivo = ({ objetivo, onFechar }: { objetivo?: Objetivo; onFechar: () => void }) => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [nome, setNome] = useState(objetivo?.nome ?? '');
  const [emoji, setEmoji] = useState(objetivo?.emoji ?? '');
  const [descricao, setDescricao] = useState(objetivo?.descricao ?? '');
  const [meta, setMeta] = useState(objetivo ? String(objetivo.meta) : '');
  const [caixinhas, setCaixinhas] = useState<string[]>(objetivo?.caixinhas ?? []);
  const [aporte, setAporte] = useState(objetivo?.aporteMensal ? String(objetivo.aporteMensal) : '');
  const [previsao, setPrevisao] = useState(objetivo?.previsao ?? '');
  const [dataInicio, setDataInicio] = useState(objetivo?.dataInicio ?? '');
  const [dataAlvo, setDataAlvo] = useState(objetivo?.dataAlvo ?? '');
  const [cor, setCor] = useState<Cor>(objetivo?.cor ?? 'violet');

  const alternar = (id: string) =>
    setCaixinhas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valorMeta = numeroOuNulo(meta);
    const valorAporte = numeroOuNulo(aporte);
    if (!nome.trim()) return avisar('⚠️ Informe o nome');
    if (valorMeta === null || !Number.isFinite(valorMeta) || valorMeta <= 0)
      return avisar('⚠️ Informe a meta');
    if (!caixinhas.length) return avisar('⚠️ Escolha ao menos uma caixinha');
    if (valorAporte !== null && (!Number.isFinite(valorAporte) || valorAporte < 0))
      return avisar('⚠️ Aporte mensal inválido');
    if (dataInicio && dataAlvo && dataInicio >= dataAlvo) return avisar('⚠️ O início deve ser antes do alvo');

    const novo: Objetivo = {
      id:
        objetivo?.id ??
        gerarId(
          nome,
          config.objetivos.map((o) => o.id),
        ),
      nome: nome.trim(),
      emoji: emoji.trim() || undefined,
      descricao: descricao.trim() || undefined,
      meta: valorMeta,
      caixinhas,
      cor,
      aporteMensal: valorAporte || undefined,
      previsao: previsao.trim() || undefined,
      dataInicio: dataInicio || undefined,
      dataAlvo: dataAlvo || undefined,
    };
    void enviar(
      () =>
        salvar((c) => ({
          ...c,
          objetivos: objetivo
            ? c.objetivos.map((x) => (x.id === objetivo.id ? novo : x))
            : [...c.objetivos, novo],
        })),
      '✅ Objetivo salvo!',
    );
  };

  return (
    <Modal titulo={objetivo ? 'Editar objetivo' : 'Novo objetivo'} onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ob-nome">Nome</label>
            <input id="ob-nome" maxLength={40} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ob-emoji">Emoji (opcional)</label>
            <input id="ob-emoji" maxLength={8} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ob-desc">Descrição (opcional)</label>
          <input
            id="ob-desc"
            maxLength={80}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ob-meta">Meta (R$)</label>
            <input
              id="ob-meta"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ob-aporte">Aporte mensal (R$)</label>
            <input
              id="ob-aporte"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={aporte}
              onChange={(e) => setAporte(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Caixinhas que contam para a meta</label>
          <div className="tipo-grid" style={{ '--colunas': 2 } as CSSProperties}>
            {config.caixinhas.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={caixinhas.includes(c.id)}
                className={`tipo-btn${caixinhas.includes(c.id) ? ' selected' : ''}`}
                onClick={() => alternar(c.id)}
              >
                {`${c.emoji ?? ''} ${c.nome}`.trim()}
              </button>
            ))}
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ob-inicio">Início (opcional)</label>
            <input
              id="ob-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ob-alvo">Data alvo (opcional)</label>
            <input id="ob-alvo" type="date" value={dataAlvo} onChange={(e) => setDataAlvo(e.target.value)} />
          </div>
        </div>
        <div className="nota mb-12">Com data alvo, o objetivo ganha contagem regressiva.</div>
        <div className="field">
          <label htmlFor="ob-prev">Previsão (texto livre, opcional)</label>
          <input
            id="ob-prev"
            maxLength={30}
            placeholder="Ex: ~set/2028"
            value={previsao}
            onChange={(e) => setPrevisao(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Cor</label>
          <SeletorCor valor={cor} onChange={setCor} />
        </div>
        <AcoesModal onCancelar={onFechar} rotuloSalvar="Salvar" salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};
