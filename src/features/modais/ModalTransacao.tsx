import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { MAX_PARCELAS, mesFaturaSugerido, montarParcelas, valoresParcelas } from '../../domain/cartoes';
import { CATEGORIAS, TIPOS, TIPOS_CREDITO, isEntrada } from '../../domain/catalogos';
import { hojeIso, rotuloMesCurto, rotuloMesLongo, somarMeses } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import type { Categoria, TipoTransacao, Transacao } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import {
  atualizarTransacao,
  atualizarTransacoes,
  criarParcelas,
  criarTransacao,
} from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

const MESES_FATURA_A_FRENTE = 6;

/** Sem `transacao`: cria um lançamento. Com `transacao`: edita o existente. */
export const ModalTransacao = ({ transacao, onFechar }: { transacao?: Transacao; onFechar: () => void }) => {
  const { uid, config, transacoes } = useDadosConfigurados();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);
  const editando = Boolean(transacao);

  const [tipo, setTipo] = useState<TipoTransacao | ''>(transacao?.tipo ?? '');
  const [cartao, setCartao] = useState(transacao?.cartao ?? '');
  const [desc, setDesc] = useState(transacao?.desc ?? '');
  const [val, setVal] = useState(transacao ? String(transacao.val) : '');
  const [cat, setCat] = useState<Categoria>(transacao?.cat ?? 'alimentacao');
  const [data, setData] = useState(transacao?.data ?? hojeIso());
  const [mesFatura, setMesFatura] = useState(transacao?.mesFatura ?? '');
  const [obs, setObs] = useState(transacao?.obs ?? '');
  const [numParcelas, setNumParcelas] = useState('');
  const [aplicarNoGrupo, setAplicarNoGrupo] = useState(true);

  // Outras parcelas da mesma compra (edição de uma parcela).
  const irmas = transacao?.grupoId
    ? transacoes.filter((t) => t.grupoId === transacao.grupoId && t.id !== transacao.id)
    : [];

  const credito = tipo !== '' && TIPOS_CREDITO.includes(tipo);
  // Parcelas só na criação; editar muda uma parcela por vez.
  const parcelando = !editando && tipo === 'parcelado';
  const n = Number(numParcelas);
  const nValido = Number.isInteger(n) && n >= 2 && n <= MAX_PARCELAS;
  const cartaoSel = config.cartoes.find((c) => c.id === cartao);
  // Mês da fatura vazio = automático: pelo melhor dia de compra do cartão, se cadastrado.
  const sugerido = cartaoSel ? mesFaturaSugerido(cartaoSel, data || hojeIso()) : null;
  const mesBase = data.slice(0, 7);
  const proximosMeses = Array.from({ length: MESES_FATURA_A_FRENTE }, (_, i) => somarMeses(mesBase, i + 1));
  // Ao editar, mantém o mês de fatura salvo mesmo que ele não esteja mais entre os próximos meses.
  const opcoesFatura =
    mesFatura && !proximosMeses.includes(mesFatura) ? [mesFatura, ...proximosMeses] : proximosMeses;

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
    if (parcelando && numParcelas && !nValido) return avisar(`⚠️ Parcelas: de 2 a ${MAX_PARCELAS}`);

    const dados = {
      desc: desc.trim(),
      val: valor,
      tipo,
      cartao: credito ? cartao : null,
      cat,
      data: data || hojeIso(),
      mesFatura: credito ? mesFatura || sugerido : null,
      obs: obs.trim(),
      isEntrada: isEntrada(tipo),
    };
    const agora = new Date().toISOString();

    if (parcelando && nValido) {
      const { val: _total, data: dataCompra, mesFatura: primeiroMes, ...base } = dados;
      const parcelas = montarParcelas(
        { ...base, criadoEm: agora },
        valor,
        n,
        dataCompra,
        primeiroMes ?? dataCompra.slice(0, 7),
        crypto.randomUUID(),
      );
      return void enviar(() => criarParcelas(uid, parcelas), `✅ ${n} parcelas lançadas!`);
    }

    if (!transacao)
      return void enviar(() => criarTransacao(uid, { ...dados, criadoEm: agora }), '✅ Lançado!');

    // Mantém os vínculos que o formulário não mostra (recorrência e parcelas).
    const vinculos = {
      ...(transacao.recorrenteId && { recorrenteId: transacao.recorrenteId }),
      ...(transacao.grupoId && { grupoId: transacao.grupoId }),
      ...(transacao.parcela && { parcela: transacao.parcela }),
    };
    void enviar(async () => {
      await atualizarTransacao(uid, transacao.id, {
        ...dados,
        ...vinculos,
        criadoEm: transacao.criadoEm,
        atualizadoEm: agora,
      });
      if (irmas.length && aplicarNoGrupo)
        await atualizarTransacoes(
          uid,
          irmas.map((t) => t.id),
          { desc: dados.desc, cat, cartao: dados.cartao, atualizadoEm: agora },
        );
    }, '✅ Atualizado!');
  };

  return (
    <Modal titulo={editando ? 'Editar lançamento' : 'Lançar transação'} onFechar={onFechar}>
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
          <label htmlFor="tx-val">{parcelando ? 'Valor total (R$)' : 'Valor (R$)'}</label>
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
              <label htmlFor="tx-fatura">{parcelando ? 'Fatura da 1ª parcela' : 'Mês da fatura'}</label>
              <select id="tx-fatura" value={mesFatura} onChange={(e) => setMesFatura(e.target.value)}>
                <option value="">
                  {sugerido ? `Automático: ${rotuloMesLongo(sugerido)}` : 'Mesmo mês do lançamento'}
                </option>
                {opcoesFatura.map((m) => (
                  <option key={m} value={m}>
                    {rotuloMesLongo(m)}
                  </option>
                ))}
              </select>
              {cartaoSel?.melhorDiaCompra && (
                <div className="nota">
                  💡 Melhor dia de compra: {String(cartaoSel.melhorDiaCompra).padStart(2, '0')}
                  {cartaoSel.diaVencimento &&
                    ` · vence dia ${String(cartaoSel.diaVencimento).padStart(2, '0')}`}
                </div>
              )}
            </div>
            {parcelando && (
              <div className="field">
                <label htmlFor="tx-parcelas">Número de parcelas</label>
                <input
                  id="tx-parcelas"
                  type="number"
                  min="2"
                  max={MAX_PARCELAS}
                  inputMode="numeric"
                  placeholder="Ex: 10"
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(e.target.value)}
                />
                <PreviaParcelas
                  total={Number(val)}
                  n={nValido ? n : null}
                  primeiroMes={mesFatura || sugerido || data.slice(0, 7)}
                />
              </div>
            )}
          </>
        )}

        {transacao?.parcela && (
          <div className="nota mb-12">
            Parcela {transacao.parcela.atual}/{transacao.parcela.total}. Valor, data e fatura mudam só nesta
            parcela.
          </div>
        )}
        {irmas.length > 0 && (
          <label className="check">
            <input
              type="checkbox"
              checked={aplicarNoGrupo}
              onChange={(e) => setAplicarNoGrupo(e.target.checked)}
            />
            Aplicar descrição, categoria e cartão às outras {irmas.length} parcelas
          </label>
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
            placeholder="Ex: presente de aniversário"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>

        <AcoesModal onCancelar={onFechar} rotuloSalvar={editando ? 'Salvar' : 'Lançar'} salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};

const PreviaParcelas = ({
  total,
  n,
  primeiroMes,
}: {
  total: number;
  n: number | null;
  primeiroMes: string;
}) => {
  if (!n) return <div className="nota">Vazio = compra à vista na fatura escolhida.</div>;
  if (!Number.isFinite(total) || total <= 0) return <div className="nota">Informe o valor total.</div>;
  const valores = valoresParcelas(total, n);
  const iguais = valores.every((v) => v === valores[0]);
  return (
    <div className="nota">
      {n}x de {fmt(valores.at(-1)!)}
      {!iguais && ` (1ª de ${fmt(valores[0]!)})`} · {rotuloMesCurto(primeiroMes)} a{' '}
      {rotuloMesCurto(somarMeses(primeiroMes, n - 1))}
    </div>
  );
};
