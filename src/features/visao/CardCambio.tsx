import { paraBRL } from '../../domain/calculos';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import type { MoedaEstrangeira } from '../../domain/types';
import { useDadosConfigurados } from '../dados/useDados';

const BANDEIRA: Record<MoedaEstrangeira, string> = { USD: '🇺🇸', EUR: '🇪🇺' };
const MOEDAS: MoedaEstrangeira[] = ['USD', 'EUR'];

export const CardCambio = () => {
  const { config, saldos, cotacoes, statusCotacao, cotacaoAtualizadaEm, recarregarCotacao } =
    useDadosConfigurados();

  if (statusCotacao === 'erro') {
    return (
      <div className="cambio-card erro">
        <div className="cambio-flag">⚠️</div>
        <div className="flex-1">
          <div className="mono pequeno coral">Erro ao buscar cotação</div>
          <div className="mono pequeno muted">AwesomeAPI indisponível</div>
        </div>
        <button className="btn-perigo" onClick={recarregarCotacao}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (statusCotacao === 'loading' && !Object.keys(cotacoes).length) {
    return (
      <div className="cambio-card">
        <div className="cambio-flag">💱</div>
        <div className="mono pequeno muted">Buscando cotação...</div>
      </div>
    );
  }

  return (
    <div className="cambio-grid">
      {MOEDAS.map((m) => {
        const taxa = cotacoes[m];
        if (!taxa) return null;
        const caixinhas = config.caixinhas.filter((c) => c.moeda === m);
        return (
          <div key={m} className="cambio-card">
            <div className="cambio-flag">{BANDEIRA[m]}</div>
            <div className="flex-1">
              <div className="mono pequeno muted">
                {m} → BRL · <span className="verde">ao vivo</span>
              </div>
              <div className="cambio-taxa">R$ {taxa.toFixed(4)}</div>
            </div>
            {caixinhas.map((c) => {
              const valor = saldos.valores[c.id] ?? 0;
              return (
                <div key={c.id} className="texto-direita">
                  <div className="mono pequeno muted">
                    {c.nome} {formatarMoeda(valor, m)} vale
                  </div>
                  <div className="cambio-conv">{fmt(paraBRL(valor, m, cotacoes) ?? 0)}</div>
                </div>
              );
            })}
          </div>
        );
      })}
      {cotacaoAtualizadaEm && <div className="nota">cotação de {cotacaoAtualizadaEm} · AwesomeAPI</div>}
    </div>
  );
};
