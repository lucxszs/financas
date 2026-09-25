import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { usoCartao } from '../../domain/calculos';
import { mesAtualIso, rotuloMesCurto } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import { useDadosConfigurados } from '../dados/useDados';

const dia = (n: number) => String(n).padStart(2, '0');

export const CartoesResumo = () => {
  const { config, transacoes } = useDadosConfigurados();
  const mes = mesAtualIso();
  if (!config.cartoes.length) return null;

  return (
    <Secao titulo={`Cartões de crédito · fatura ${rotuloMesCurto(mes)}`}>
      <div className="card">
        {config.cartoes.map((c) => {
          const uso = usoCartao(c, transacoes, mes);
          const cor = uso.pct > 80 ? 'var(--coral)' : uso.pct > 60 ? 'var(--amber)' : corVar(c.cor);
          const datas = [
            c.melhorDiaCompra && `melhor dia ${dia(c.melhorDiaCompra)}`,
            c.diaVencimento && `vence ${dia(c.diaVencimento)}`,
          ].filter(Boolean);
          return (
            <div key={c.id} className="cartao-row">
              <div className="linha-entre">
                <span className="negrito">
                  {c.emoji} {c.nome}
                </span>
                <span className="mono muted pequeno">limite {fmt(c.limite)}</span>
              </div>
              {datas.length > 0 && <div className="mono muted mini">{datas.join(' · ')}</div>}
              <div className="linha-entre mono pequeno">
                <span style={{ color: cor }}>utilizado {fmt(uso.utilizado)}</span>
                <span className="verde">disponível {fmt(uso.disponivel)}</span>
              </div>
              <Barra pct={uso.pct} cor={cor} altura={5} />
            </div>
          );
        })}
      </div>
    </Secao>
  );
};
