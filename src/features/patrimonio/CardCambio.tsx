import { ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { Icone } from '../../components/icones';
import { EmojiItem } from '../../components/marcas';
import { paraBRL } from '../../domain/calculos';
import { rotuloDataHora } from '../../domain/datas';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import type { MoedaEstrangeira } from '../../domain/types';
import { useDadosConfigurados } from '../dados/useDados';

const BANDEIRA: Record<MoedaEstrangeira, string> = { USD: '🇺🇸', EUR: '🇪🇺' }; // desenhadas em SVG por EmojiItem
const MOEDAS: MoedaEstrangeira[] = ['USD', 'EUR'];

export const CardCambio = () => {
  const { config, saldos, cotacoes, statusCotacao, cotacaoAtualizadaEm, recarregarCotacao } =
    useDadosConfigurados();
  const antiga = statusCotacao === 'antiga';

  // Só mostra erro quando não há nem a última cotação guardada.
  if (statusCotacao === 'erro' && !Object.keys(cotacoes).length) {
    return (
      <div className="cambio-card erro">
        <div className="cambio-flag coral">
          <Icone icone={TriangleAlert} tamanho={22} />
        </div>
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
        <div className="cambio-flag muted">
          <Icone icone={ArrowLeftRight} tamanho={22} />
        </div>
        <div className="mono pequeno muted">Buscando cotação...</div>
      </div>
    );
  }

  return (
    <div className="cambio-grid">
      {antiga && (
        <div className="cambio-card erro">
          <div className="flex-1">
            <div className="mono pequeno coral">
              Última cotação disponível
              {cotacaoAtualizadaEm && `: ${rotuloDataHora(cotacaoAtualizadaEm)}`}
            </div>
            <div className="mono pequeno muted">
              AwesomeAPI indisponível; valores podem estar desatualizados.
            </div>
          </div>
          <button className="btn-perigo" onClick={recarregarCotacao}>
            Tentar novamente
          </button>
        </div>
      )}
      {MOEDAS.map((m) => {
        const taxa = cotacoes[m];
        if (!taxa) return null;
        const caixinhas = config.caixinhas.filter((c) => c.moeda === m);
        return (
          <div key={m} className="cambio-card">
            <div className="cambio-flag">
              <EmojiItem emoji={BANDEIRA[m]} tamanho={20} />
            </div>
            <div className="flex-1">
              <div className="mono pequeno muted">
                {m} → BRL ·{' '}
                {antiga ? (
                  <span className="coral">última conhecida</span>
                ) : (
                  <span className="verde">ao vivo</span>
                )}
              </div>
              <div className="cambio-taxa">{fmt(taxa)}</div>
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
      {cotacaoAtualizadaEm && (
        <div className="nota">cotação de {rotuloDataHora(cotacaoAtualizadaEm)} · AwesomeAPI</div>
      )}
    </div>
  );
};
