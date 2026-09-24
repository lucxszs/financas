import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { hojeIso } from '../../domain/datas';
import { useEnvio } from '../../hooks/useEnvio';
import { criarAporte } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

export const ModalAporte = ({ onFechar }: { onFechar: () => void }) => {
  const { uid, config } = useDadosConfigurados();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [caixinha, setCaixinha] = useState('');
  const [val, setVal] = useState('');
  const [data, setData] = useState(hojeIso());
  const [obs, setObs] = useState('');

  const moeda = config.caixinhas.find((c) => c.id === caixinha)?.moeda ?? 'BRL';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!caixinha) return avisar('⚠️ Selecione a caixinha');
    const valor = Number(val);
    if (!Number.isFinite(valor) || valor <= 0) return avisar('⚠️ Informe o valor');

    void enviar(
      () =>
        criarAporte(uid, {
          caixinha,
          val: valor,
          data: data || hojeIso(),
          obs: obs.trim(),
          criadoEm: new Date().toISOString(),
        }),
      '✅ Aporte lançado!',
    );
  };

  return (
    <Modal aberto titulo="🐷 Lançar aporte" onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Caixinha</label>
          <GradeOpcoes
            colunas={2}
            opcoes={config.caixinhas.map((c) => ({ id: c.id, rotulo: `${c.emoji ?? ''} ${c.nome}`.trim() }))}
            valor={caixinha}
            onChange={setCaixinha}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ap-val">Valor ({moeda})</label>
            <input
              id="ap-val"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ap-data">Data</label>
            <input id="ap-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ap-obs">Observação (opcional)</label>
          <input
            id="ap-obs"
            type="text"
            maxLength={200}
            placeholder="Ex: aporte mensal..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>

        <AcoesModal onCancelar={onFechar} rotuloSalvar="Lançar" salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};
