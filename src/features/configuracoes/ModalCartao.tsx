import { useState, type FormEvent } from 'react';
import { AcoesModal, Modal } from '../../components/ui';
import { gerarId } from '../../domain/ids';
import type { Cartao, Cor } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { useDadosConfigurados } from '../dados/useDados';
import { SeletorCor } from './componentes';
import { diaValido, numeroOuNulo, useSalvarConfig } from './configuracao';

export const ModalCartao = ({ cartao, onFechar }: { cartao?: Cartao; onFechar: () => void }) => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [nome, setNome] = useState(cartao?.nome ?? '');
  const [emoji, setEmoji] = useState(cartao?.emoji ?? '');
  const [limite, setLimite] = useState(cartao ? String(cartao.limite) : '');
  const [melhorDia, setMelhorDia] = useState(cartao?.melhorDiaCompra ? String(cartao.melhorDiaCompra) : '');
  const [vencimento, setVencimento] = useState(cartao?.diaVencimento ? String(cartao.diaVencimento) : '');
  const [cor, setCor] = useState<Cor>(cartao?.cor ?? 'amber');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lim = numeroOuNulo(limite);
    const melhor = numeroOuNulo(melhorDia);
    const venc = numeroOuNulo(vencimento);
    if (!nome.trim()) return avisar('⚠️ Informe o nome');
    if (lim === null || !Number.isFinite(lim) || lim <= 0) return avisar('⚠️ Informe o limite');
    if (melhor !== null && !diaValido(melhor)) return avisar('⚠️ Melhor dia deve ser de 1 a 31');
    if (venc !== null && !diaValido(venc)) return avisar('⚠️ Vencimento deve ser de 1 a 31');

    const novo: Cartao = {
      id:
        cartao?.id ??
        gerarId(
          nome,
          config.cartoes.map((c) => c.id),
        ),
      nome: nome.trim(),
      emoji: emoji.trim() || undefined,
      limite: lim,
      cor,
      melhorDiaCompra: melhor ?? undefined,
      diaVencimento: venc ?? undefined,
    };
    void enviar(
      () =>
        salvar((c) => ({
          ...c,
          cartoes: cartao ? c.cartoes.map((x) => (x.id === cartao.id ? novo : x)) : [...c.cartoes, novo],
        })),
      '✅ Cartão salvo!',
    );
  };

  return (
    <Modal titulo={cartao ? 'Editar cartão' : 'Novo cartão'} onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ct-nome">Nome</label>
            <input id="ct-nome" maxLength={40} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ct-emoji">Emoji (opcional)</label>
            <input id="ct-emoji" maxLength={8} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ct-limite">Limite (R$)</label>
          <input
            id="ct-limite"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ct-melhor">Melhor dia de compra</label>
            <input
              id="ct-melhor"
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              placeholder="Ex: 4"
              value={melhorDia}
              onChange={(e) => setMelhorDia(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ct-venc">Dia do vencimento</label>
            <input
              id="ct-venc"
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              placeholder="Ex: 13"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
            />
          </div>
        </div>
        <div className="nota mb-12">
          Se o banco informa o dia do fechamento, o melhor dia é o dia seguinte (fecha 11 → melhor dia 12).
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
