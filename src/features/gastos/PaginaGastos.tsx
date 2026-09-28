import { IconeCategoria } from '../../components/icones';
import { Barra, Secao, StatusPonto, Vazio, type Sinal } from '../../components/ui';
import { categoriaPorId } from '../../domain/catalogos';
import { mesAtualIso, rotuloMesLongo } from '../../domain/datas';
import { fmt, fmtPct } from '../../domain/formatadores';
import { orcamentoPorCategoria, type StatusOrcamento } from '../../domain/historico';
import type { Transacao } from '../../domain/types';
import { CalendarioMes } from '../calendario/Calendario';
import { useDadosConfigurados } from '../dados/useDados';
import { CartoesResumo } from './CartoesResumo';
import { ListaLancamentos } from './ListaLancamentos';

export const PaginaGastos = ({
  onNovo,
  onEditar,
}: {
  onNovo: () => void;
  onEditar: (t: Transacao) => void;
}) => {
  const { transacoes, config } = useDadosConfigurados();
  const mes = mesAtualIso();
  const linhas = orcamentoPorCategoria(transacoes, config, mes);
  const maxReal = Math.max(1, ...linhas.map((l) => l.real));
  const totalReal = linhas.reduce((a, l) => a + l.real, 0);
  const totalMeta = linhas.reduce((a, l) => a + (l.meta ?? 0), 0);

  return (
    <>
      <ListaLancamentos onNovo={onNovo} onEditar={onEditar} />
      <CalendarioMes />
      <CartoesResumo />

      <Secao titulo={`Gastos por categoria · ${rotuloMesLongo(mes)}`}>
        <div className="card">
          {linhas.length === 0 ? (
            <Vazio>Nenhum gasto este mês ainda.</Vazio>
          ) : (
            linhas.map((l) => {
              const c = categoriaPorId(l.cat);
              const st = l.status ? STATUS[l.status] : null;
              return (
                <div key={l.cat} className="orc-row">
                  <div className="linha-entre">
                    <span className="icone-texto">
                      <IconeCategoria cat={l.cat} tamanho={16} /> {c?.nome ?? l.cat}
                    </span>
                    <span className="mono">
                      {fmt(l.real)}
                      {l.meta !== null && <span className="muted"> / {fmt(l.meta)}</span>}
                    </span>
                  </div>
                  <Barra pct={l.pct ?? (l.real / maxReal) * 100} cor={st?.cor ?? 'var(--sky)'} altura={6} />
                  {st && (
                    <div className="mono mini muted mt-4 icone-texto">
                      <StatusPonto sinal={st.sinal} rotulo={st.rotulo} mostrarRotulo /> · {fmtPct(l.pct!)} do
                      orçamento
                    </div>
                  )}
                </div>
              );
            })
          )}
          {totalMeta > 0 && (
            <div className="brow total">
              <span className="bname">Total</span>
              <span className="bval">
                {fmt(totalReal)} <span className="muted">/ {fmt(totalMeta)} orçado</span>
              </span>
            </div>
          )}
        </div>
        {totalMeta === 0 && <div className="nota">Defina um orçamento por categoria em Configurações.</div>}
      </Secao>
    </>
  );
};

// Status usa as cores reservadas (verde/amarelo/vermelho) sempre com texto, nunca só a cor.
const STATUS: Record<StatusOrcamento, { sinal: Sinal; rotulo: string; cor: string }> = {
  ok: { sinal: 'verde', rotulo: 'dentro', cor: 'var(--emerald)' },
  atencao: { sinal: 'amarelo', rotulo: 'no limite', cor: 'var(--amber)' },
  estourou: { sinal: 'vermelho', rotulo: 'estourou', cor: 'var(--coral)' },
};
