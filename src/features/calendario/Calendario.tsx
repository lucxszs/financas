import { Secao, Vazio } from '../../components/ui';
import {
  eventosDoPeriodo,
  saldoPrevisto,
  type EventoCalendario,
  type TipoEvento,
} from '../../domain/calendario';
import { dataNoMes, diasNoMes, hojeIso, rotuloDiaMes, rotuloMesLongo, somarDias } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import { useDadosConfigurados } from '../dados/useDados';

const ICONE: Record<TipoEvento, string> = { entrada: '💰', saida: '🧾', aporte: '🐷', fatura: '💳' };
const DIAS = 7;

const Linha = ({ e, hoje }: { e: EventoCalendario; hoje: string }) => (
  <div className={`evento${e.feito ? ' feito' : ''}`}>
    <span className="evento-dia">{e.data === hoje ? 'hoje' : rotuloDiaMes(e.data)}</span>
    <span className="evento-desc">
      {ICONE[e.tipo]} {e.desc}
      {e.feito && ' ✓'}
    </span>
    <span className={`evento-valor ${e.tipo === 'entrada' ? 'verde' : ''}`}>
      {e.tipo === 'entrada' ? '+ ' : '− '}
      {fmt(e.valor)}
    </span>
  </div>
);

/** Dashboard: o que entra e sai nos próximos 7 dias e o saldo disso. */
export const ProximosDias = () => {
  const { config, transacoes, cotacoes } = useDadosConfigurados();
  const hoje = hojeIso();
  const eventos = eventosDoPeriodo(
    config,
    transacoes,
    cotacoes,
    hoje,
    somarDias(hoje, DIAS - 1),
    hoje,
  ).filter((e) => !e.feito);
  const saldo = saldoPrevisto(eventos);

  return (
    <Secao titulo={`📅 Próximos ${DIAS} dias`}>
      <div className="card">
        {eventos.length === 0 ? (
          <Vazio>Nada previsto. Cadastre contas fixas e salário em ⚙️ Configurações &gt; Recorrentes.</Vazio>
        ) : (
          <>
            {eventos.map((e) => (
              <Linha key={`${e.data}${e.desc}`} e={e} hoje={hoje} />
            ))}
            <div className={`brow total ${saldo >= 0 ? 'positivo' : 'deficit'}`}>
              <span className="bname">Saldo previsto</span>
              <span className="bval">
                {saldo < 0 ? '− ' : '+ '}
                {fmt(Math.abs(saldo))}
              </span>
            </div>
          </>
        )}
      </div>
    </Secao>
  );
};

/** Gastos: todas as entradas e saídas previstas do mês, por dia. */
export const CalendarioMes = () => {
  const { config, transacoes, cotacoes } = useDadosConfigurados();
  const hoje = hojeIso();
  const mes = hoje.slice(0, 7);
  const eventos = eventosDoPeriodo(
    config,
    transacoes,
    cotacoes,
    dataNoMes(mes, 1),
    dataNoMes(mes, diasNoMes(mes)),
    hoje,
  );

  return (
    <Secao titulo={`📅 Calendário · ${rotuloMesLongo(mes)}`}>
      <div className="card">
        {eventos.length === 0 ? (
          <Vazio>Sem recorrências nem faturas com vencimento neste mês.</Vazio>
        ) : (
          eventos.map((e) => <Linha key={`${e.data}${e.desc}`} e={e} hoje={hoje} />)
        )}
      </div>
      <div className="nota">
        Recorrências (✓ = já lançada) e vencimentos das faturas. Recorrências no cartão aparecem dentro da
        fatura.
      </div>
    </Secao>
  );
};
