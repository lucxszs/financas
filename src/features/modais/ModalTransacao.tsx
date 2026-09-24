import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { CATEGORIAS, TIPOS, TIPOS_CREDITO, isEntrada } from '../../domain/catalogos';
import { hojeIso, rotuloMesLongo, somarMeses } from '../../domain/datas';
import type { Categoria, TipoTransacao } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { criarTransacao } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

const MESES_FATURA_A_FRENTE = 6;

export const ModalTransacao = ({ onFechar }: { onFechar: () => void }) => {
  const { uid, config } = useDadosConfigurados();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [tipo, setTipo] = useState<TipoTransacao | ''>('');
  const [cartao, setCartao] = useState('');
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [cat, setCat] = useState<Categoria>('alimentacao');
  const [data, setData] = useState(hojeIso());
  const [mesFatura, setMesFatura] = useState('');
  const [obs, setObs] = useState('');

  const credito = tipo !== '' && TIPOS_CREDITO.includes(tipo);
  const mesBase = data.slice(0, 7);
  const opcoesFatura = Array.from({ length: MESES_FATURA_A_FRENTE }, (_, i) => somarMeses(mesBase, i + 1));

  const selecionarTipo = (t: TipoTransacao) => {
    setTipo(t);
    if (!TIPOS_CREDITO.includes(t)) {
      setCartao('');
      setMesFatura('');
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!tipo) return avisar('⚠️ Selecione o tipo');
    const valor = Number(val);
    if (!desc.trim() || !Number.isFinite(valor) || valor <= 0) return avisar('⚠️ Preencha descrição e valor');
    if (credito && !cartao) return avisar('⚠️ Selecione o cartão');

    void enviar(
      () =>
        criarTransacao(uid, {
          desc: desc.trim(),
          val: valor,
          tipo,
          cartao: credito ? cartao : null,
          cat,
          data: data || hojeIso(),
          mesFatura: credito && mesFatura ? mesFatura : null,
          obs: obs.trim(),
          isEntrada: isEntrada(tipo),
          criadoEm: new Date().toISOString(),
        }),
      '✅ Lançado!',
    );
  };

  return (
    <Modal aberto titulo="Lançar transação" onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="tx-desc">Descrição</label>
          <input
            id="tx-desc"
            type="text"
            maxLength={120}
            placeholder="Ex: Mercado, Gasolina..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="tx-val">Valor (R$)</label>
          <input
            id="tx-val"
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
          <label>Tipo</label>
          <GradeOpcoes
            opcoes={TIPOS.map((t) => ({ id: t.id, rotulo: `${t.emoji} ${t.nome}` }))}
            valor={tipo}
            onChange={selecionarTipo}
          />
        </div>

        {credito && (
          <>
            <div className="field">
              <label>Cartão</label>
              <GradeOpcoes
                colunas={2}
                opcoes={config.cartoes.map((c) => ({ id: c.id, rotulo: `${c.emoji ?? '💳'} ${c.nome}` }))}
                valor={cartao}
                onChange={setCartao}
              />
            </div>
            <div className="field">
              <label htmlFor="tx-fatura">Mês da fatura</label>
              <select id="tx-fatura" value={mesFatura} onChange={(e) => setMesFatura(e.target.value)}>
                <option value="">Mesmo mês do lançamento</option>
                {opcoesFatura.map((m) => (
                  <option key={m} value={m}>
                    {rotuloMesLongo(m)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="tx-cat">Categoria</label>
            <select id="tx-cat" value={cat} onChange={(e) => setCat(e.target.value as Categoria)}>
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tx-data">Data</label>
            <input id="tx-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="tx-obs">Observação (opcional)</label>
          <input
            id="tx-obs"
            type="text"
            maxLength={200}
            placeholder="Ex: parcela 2/5..."
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
