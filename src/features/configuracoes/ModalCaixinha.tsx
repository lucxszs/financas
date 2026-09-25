import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { gerarId } from '../../domain/ids';
import type { Caixinha, Cor, Moeda, TipoCaixinha } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { useDadosConfigurados } from '../dados/useDados';
import { SeletorCor } from './componentes';
import { useSalvarConfig } from './configuracao';

const MOEDAS: { id: Moeda; rotulo: string }[] = [
  { id: 'BRL', rotulo: '🇧🇷 BRL' },
  { id: 'USD', rotulo: '🇺🇸 USD' },
  { id: 'EUR', rotulo: '🇪🇺 EUR' },
];

const TIPOS: { id: TipoCaixinha; rotulo: string }[] = [
  { id: 'investimento', rotulo: '📈 Investimento' },
  { id: 'conta', rotulo: '🏦 Conta' },
];

export const ModalCaixinha = ({ caixinha, onFechar }: { caixinha?: Caixinha; onFechar: () => void }) => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [nome, setNome] = useState(caixinha?.nome ?? '');
  const [emoji, setEmoji] = useState(caixinha?.emoji ?? '');
  const [moeda, setMoeda] = useState<Moeda>(caixinha?.moeda ?? 'BRL');
  const [tipo, setTipo] = useState<TipoCaixinha>(caixinha?.tipo ?? 'investimento');
  const [rendimento, setRendimento] = useState(caixinha?.rendimento ?? '');
  const [descricao, setDescricao] = useState(caixinha?.descricao ?? '');
  const [cor, setCor] = useState<Cor>(caixinha?.cor ?? 'emerald');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return avisar('⚠️ Informe o nome');
    const nova: Caixinha = {
      id:
        caixinha?.id ??
        gerarId(
          nome,
          config.caixinhas.map((c) => c.id),
        ),
      nome: nome.trim(),
      emoji: emoji.trim() || undefined,
      moeda,
      tipo,
      rendimento: rendimento.trim(),
      descricao: descricao.trim() || undefined,
      cor,
    };
    void enviar(
      () =>
        salvar((c) => ({
          ...c,
          caixinhas: caixinha
            ? c.caixinhas.map((x) => (x.id === caixinha.id ? nova : x))
            : [...c.caixinhas, nova],
        })),
      '✅ Caixinha salva!',
    );
  };

  return (
    <Modal titulo={caixinha ? 'Editar caixinha' : 'Nova caixinha'} onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="cx-nome">Nome</label>
            <input id="cx-nome" maxLength={40} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cx-emoji">Emoji (opcional)</label>
            <input id="cx-emoji" maxLength={8} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Tipo</label>
          <GradeOpcoes colunas={2} opcoes={TIPOS} valor={tipo} onChange={setTipo} />
        </div>
        <div className="field">
          <label>Moeda</label>
          {caixinha ? (
            // Trocar a moeda reinterpretaria os saldos já gravados.
            <div className="nota">{moeda} · não dá para trocar depois de criada</div>
          ) : (
            <GradeOpcoes opcoes={MOEDAS} valor={moeda} onChange={setMoeda} />
          )}
        </div>
        <div className="field">
          <label htmlFor="cx-rend">Rendimento (texto livre)</label>
          <input
            id="cx-rend"
            maxLength={40}
            placeholder="Ex: 100% CDI"
            value={rendimento}
            onChange={(e) => setRendimento(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cx-desc">Descrição (opcional)</label>
          <input
            id="cx-desc"
            maxLength={80}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
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
