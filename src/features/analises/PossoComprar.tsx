import { useState } from 'react';
import { Lightbulb, ShoppingBag } from 'lucide-react';
import { Icone } from '../../components/icones';
import { opcoesMarcas } from '../../components/opcoes';
import { GradeOpcoes, Secao, StatusPonto } from '../../components/ui';
import { analisarCompra, type FormaPagamento } from '../../domain/compra';
import { hojeIso, rotuloMesCurto } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import { useDadosConfigurados } from '../dados/useDados';

const FORMAS: { id: FormaPagamento; rotulo: string }[] = [
  { id: 'avista', rotulo: 'À vista (PIX/débito)' },
  { id: 'credito', rotulo: 'Crédito à vista' },
  { id: 'parcelado', rotulo: 'Parcelado' },
];

const ROTULO_SINAL = { verde: 'cabe', amarelo: 'apertado', vermelho: 'não recomendado' } as const;

/** "Posso comprar isso?": compara a compra com o limite de gastos, a sobra típica e o limite do cartão. */
export const PossoComprar = () => {
  const { config, transacoes, aportes, cotacoes, saldos } = useDadosConfigurados();
  const [desc, setDesc] = useState('');
  const [valor, setValor] = useState('');
  const [forma, setForma] = useState<FormaPagamento>('avista');
  const [cartaoId, setCartaoId] = useState(config.cartoes[0]?.id ?? '');
  const [parcelas, setParcelas] = useState('3');

  const v = Number(valor.replace(',', '.'));
  const n = Number(parcelas);
  const usaCartao = forma !== 'avista';
  const valido =
    Number.isFinite(v) &&
    v > 0 &&
    (!usaCartao || Boolean(cartaoId)) &&
    (forma !== 'parcelado' || (Number.isInteger(n) && n >= 2 && n <= 48));

  const r = valido
    ? analisarCompra(
        { valor: v, forma, parcelas: n, cartaoId: usaCartao ? cartaoId : undefined },
        { config, transacoes, aportes, cotacoes, limitesInformados: saldos.cartoes, hoje: hojeIso() },
      )
    : null;

  return (
    <Secao titulo="Posso comprar?" icone={ShoppingBag}>
      <div className="card card-pad">
        <div className="field-row">
          <div className="field">
            <label htmlFor="compra-desc">O que (opcional)</label>
            <input
              id="compra-desc"
              maxLength={60}
              placeholder="Ex: fone de ouvido"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="compra-valor">Valor total (R$)</label>
            <input
              id="compra-valor"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Como pagar</label>
          <GradeOpcoes opcoes={FORMAS} valor={forma} onChange={setForma} />
        </div>
        {usaCartao && (
          <div className="field-row">
            <div className="field">
              <label>Cartão</label>
              {config.cartoes.length ? (
                <GradeOpcoes
                  colunas={2}
                  opcoes={opcoesMarcas(config.cartoes)}
                  valor={cartaoId}
                  onChange={setCartaoId}
                />
              ) : (
                <div className="nota">Cadastre um cartão em Configurações.</div>
              )}
            </div>
            {forma === 'parcelado' && (
              <div className="field">
                <label htmlFor="compra-parcelas">Parcelas</label>
                <input
                  id="compra-parcelas"
                  type="number"
                  min="2"
                  max="48"
                  inputMode="numeric"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {r && (
          <div className={`compra-resultado ${r.sinal}`}>
            <div className="linha-entre">
              <span className="negrito">
                {desc.trim() ? `${desc.trim()}: ` : ''}
                {r.titulo}
              </span>
              <StatusPonto sinal={r.sinal} rotulo={ROTULO_SINAL[r.sinal]} mostrarRotulo />
            </div>
            <ul className="compra-lista">
              {r.motivos.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            {r.impactos.length > 1 && (
              <div className="compra-meses mono mini">
                {r.impactos.map((i) => (
                  <span key={i.mes} className={i.margem < 0 ? 'coral' : 'muted'}>
                    {rotuloMesCurto(i.mes)}: sobra {fmt(i.margem)}
                  </span>
                ))}
              </div>
            )}
            {r.dicas.length > 0 && (
              <ul className="compra-lista compra-dicas">
                {r.dicas.map((d) => (
                  <li key={d} className="icone-texto">
                    <Icone icone={Lightbulb} tamanho={14} /> {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="nota">
        Este mês: compara com o &quot;disponível para gastar&quot; do Início. Meses seguintes: com a sobra
        típica (renda − média de gastos dos últimos meses − aportes planejados). No crédito, o cartão precisa
        ter limite para o valor total.
      </div>
    </Secao>
  );
};
