# Funcionalidades

## Acesso

- Qualquer pessoa cria a própria conta: **Continuar com Google** ou **e-mail e senha**.
- Conta de e-mail e senha: o app envia um link de confirmação e só libera os dados depois que o e-mail é confirmado
  ("Já confirmei" / "Reenviar e-mail"). "Esqueci a senha" envia um link para criar outra.
- Cada conta só vê os próprios dados.
- **Sair** e **Configurações** são os ícones no canto superior direito.

## Primeiro acesso

Sem configuração, o app abre **Configurar plano**:

- **Começar do zero**: cria um plano com uma conta corrente; renda, cartões, metas e o resto se cadastram em
  Configurações.
- **Importar JSON**: carrega caixinhas, objetivos, cartões, saldos, histórico e fechamentos. Arquivo com erro não
  grava nada e mostra a lista de problemas.
- **Usar dados de exemplo**: carrega dados fictícios.

Formato do arquivo: [modelo de dados](modelo-de-dados.md#arquivo-de-importação).

## Navegação

- **Cabeçalho**: título à esquerda; à direita, "Lançar gasto" (botão principal), "Lançar aporte", "Atualizar saldos"
  e os ícones de Configurações e Sair.
- **Abas**: Início, Gastos, Patrimônio, Metas e Análises. No celular, as abas ficam numa barra fixa embaixo e as três
  ações ficam no botão "+" flutuante.

| Aba           | O que tem                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Início        | Fechamento do mês (quando há um para fechar), resumo, saúde financeira, próximos 7 dias e quanto ainda dá para gastar |
| Gastos        | Lançamentos, calendário do mês, cartões e gastos por categoria × orçamento                                            |
| Patrimônio    | Patrimônio líquido e evolução, investimentos, rentabilidade × CDI e IPCA, e câmbio                                    |
| Metas         | Contagem regressiva com ritmo (necessário × atual), câmbio quando a meta usa moeda estrangeira, metas e alocação      |
| Análises      | Histórico mensal com gráficos, meses fechados, "Posso comprar?", simulações, aportes e evolução dos investimentos     |
| Configurações | Renda, caixinhas, cartões, objetivos, orçamento, recorrentes e limpeza dos dados antigos da v1                        |

**Ícones e marcas**: a interface usa ícones em SVG. Caixinhas e cartões mostram o logo do banco na cor oficial
(Nubank, Mercado Pago e Wise com logo; Itaú e Inter com as iniciais). Bandeiras (ex.: 🇦🇷 no emoji de um objetivo)
são desenhadas em SVG, inclusive no Windows.

**Nomes**: caixinhas e cartões aparecem pelo nome atual em todas as abas; renomear em Configurações vale no app
inteiro. Nomes e descrições de objetivos e recorrências são texto livre: se citarem uma caixinha, edite lá também.

Se a cotação não carregar, o app usa a última conhecida e mostra a data e a hora dela.

## Início

**Resumo do mês**

- Renda, gastos, investimentos e saldo livre, com taxa de poupança (investido ÷ renda) e gastos ÷ renda.
- Renda = entradas do mês. Enquanto o salário não entra, usa a renda mensal das Configurações e mostra "(prevista)".
- Avisos: gastos comparados com a média dos 3 meses anteriores, aporte comparado com o planejado, quanto do limite dos cartões está comprometido (faturas vencidas contam como pagas, como na Saúde financeira) e o progresso das metas com data.

**Saúde financeira**: cinco sinais, cada um com o motivo, em vez de uma nota única.

| Sinal            | 🟢                          | 🟡                                   | 🔴                             |
| ---------------- | --------------------------- | ------------------------------------ | ------------------------------ |
| 💰 Gastos        | limite de gastos seguro     | gastando acima do planejado          | mês termina negativo           |
| 📈 Investimentos | aporte do mês ≥ planejado   | aportou parte, ou ainda até o dia 15 | nada aportado depois do dia 15 |
| 💳 Cartões       | até 50% do limite em aberto | até 80%                              | acima de 80%                   |
| 🎯 Metas         | todas no ritmo              | a pior até 10% abaixo do necessário  | a pior mais de 10% abaixo      |
| 💵 Reserva       | cobre 6+ meses de gastos    | 3 a 6 meses                          | menos de 3                     |

A reserva soma os objetivos marcados como "reserva de emergência" em Configurações (sem marcação, todos os que
tiverem "emergência" ou "reserva" no nome). Sinais sem dados (ex.: nenhum cartão) não aparecem.

**Limite de gastos**

- Disponível = renda − já gasto − investimentos − contas fixas a pagar.
  - Investimentos: o maior entre o planejado (recorrentes de aporte ou, sem elas, o aporte mensal dos objetivos) e o já feito.
  - Contas fixas a pagar: recorrentes que ainda vão cair este mês.
- Mostra quanto dá por dia até o fim do mês e um status:
  - 🟢 Seguro: gastos variáveis dentro do planejado.
  - 🟡 Atenção: gastos variáveis por dia acima do planejado (orçamento por categoria ou, sem ele, o que sobra da renda).
  - 🔴 Cuidado: o mês já está negativo ou, no ritmo atual, termina negativo.

Compras no cartão contam no mês da fatura, em todo o app.

## Cartões

Em Gastos, um card por cartão:

- Melhor dia de compra (e em quantos dias ele chega) e vencimento.
- Fatura atual, próxima fatura e parcelamentos futuros. Depois do dia do vencimento, a fatura do mês conta como paga
  e a "atual" passa a ser a do mês seguinte.
- Limite disponível: o que o app do banco mostra, informado no "Atualizar saldos", menos as compras lançadas no app
  depois disso. Sem informação, é o limite menos tudo o que está lançado em aberto (como o banco faz com parcelas).
- Com o limite informado, o card mostra quanto está "em uso no banco, não lançado no app" (compras e parcelas que
  faltam lançar). Atualize o limite depois de pagar a fatura, para ele voltar a subir.

**Comprometimento futuro**: soma das faturas de todos os cartões nos próximos 6 meses, com as parcelas já lançadas.

Compras parceladas lançadas antes desta versão continuam como um lançamento único e não entram nas parcelas futuras.

## Fechamento mensal

- O Início mostra "Fechamento de <mês>" quando há mês para fechar: meses passados com movimento e ainda abertos
  (até 12 para trás, o mais antigo primeiro, com seletor quando há mais de um) e o mês atual, no último dia dele.
- A prévia traz renda, gastos, investimentos, saldo, taxa de poupança, maior categoria, maior gasto, aporte em cada
  meta e patrimônio com a variação sobre o mês anterior.
- **Fechar** grava uma foto imutável do mês. O histórico mensal passa a usar essa foto (🔒 na tabela), mesmo que os
  lançamentos mudem depois.
- Em Análises > Meses fechados: ver cada fechamento e **Reabrir mês** (apaga a foto; os lançamentos não mudam).
- Mês passado fechado depois: o patrimônio vem da foto do "Atualizar saldos" daquele mês, se existir.

## Metas por ritmo

Na contagem regressiva de cada meta com data:

- **Necessário**: quanto falta ÷ meses até a data alvo.
- **Atual**: média dos aportes nas caixinhas da meta nos 3 meses anteriores; sem aportes, o aporte mensal planejado.
- Aviso: "⚠️ faltam R$ 25/mês para chegar na data" ou "✅ no ritmo".
- Previsão de conclusão no ritmo atual, também exibida na lista de metas.

## Calendário financeiro

- **Próximos 7 dias** (Início): recorrências que ainda vão cair e vencimentos de fatura, com o saldo previsto
  (entradas − contas, aportes e faturas).
- **Calendário do mês** (Gastos): tudo o que entra e sai no mês, por dia; marcado = recorrência já lançada, fatura já
  vencida aparece apagada.
- Recorrências no cartão não aparecem sozinhas: já estão dentro da fatura.

## Rentabilidade

Em Patrimônio:

- Por caixinha de investimento: saldo, participação no total, rentabilidade e quanto rendeu.
- Rendimentos = soma do "rendimento do mês" informado no "Atualizar saldos" (mês sem rendimento informado conta
  zero). Investido = saldo atual − rendimentos. Depósitos não lançados como aporte não viram rendimento.
- Total com a rentabilidade desde o primeiro rendimento informado, comparada com o CDI e o IPCA do período (séries mensais do Banco
  Central, compostas mês a mês). A comparação é aproximada: os depósitos entram ao longo do período.
- CDI e IPCA ficam guardados no navegador por 24h; se o Banco Central cair, usa os últimos guardados.

## Posso comprar?

Em Análises: valor, forma de pagamento (à vista, crédito à vista ou parcelado) e cartão. O app responde 🟢 cabe,
🟡 apertado ou 🔴 não recomendado, com os motivos:

- **Este mês**: a compra sai do "disponível para gastar" do Início.
- **Meses seguintes** (fatura ou parcelas): sai da sobra típica = renda − média de gastos − aportes planejados.
- **Cartão**: o limite disponível precisa cobrir o valor total (o banco bloqueia tudo, mesmo parcelado).
- 🔴 se faltar limite ou algum mês ficar negativo; 🟡 se algum mês ficar com menos de 10% da renda.
- Dicas: esperar o melhor dia do cartão para cair na fatura seguinte e em quantos meses dá para juntar e pagar à vista.

## Simulações

Em Análises, "Simulações: e se...":

- **Ganhar mais**: nova renda mensal. **Gastar menos**: quanto a menos por mês. **Aportar mais**: novo aporte mensal.
- Mostra o extra por mês, quanto ele vira em 1 e 3 anos (guardado e investindo, com o rendimento estimado das
  Configurações) e quantos meses adianta a meta escolhida.

## Gastos por categoria

Gasto real do mês em cada categoria. Com orçamento definido em Configurações, mostra real ÷ meta e o status:
🟢 dentro (até 100%), 🟡 no limite (até 110%), 🔴 estourou.

## Patrimônio líquido

- Ativos (investimentos + contas) − dívidas = patrimônio líquido.
- Dívidas: o limite em uso de cada cartão. Com o limite informado no "Atualizar saldos", vale o do banco (inclui o
  que não foi lançado no app); sem ele, as faturas lançadas ainda não vencidas, incluindo as futuras.
- Evolução dos últimos 6 meses: meses anteriores pela foto do "Atualizar saldos" (que passa a gravar as dívidas do
  dia); mês atual pelo valor de agora.

## Histórico mensal

Em Análises: renda, gastos, investimentos, saldo, taxa de poupança e patrimônio dos últimos 6 meses, em tabela e em
gráficos (gastos, investimentos e taxa de poupança por mês). Passe o mouse ou toque numa coluna para ver o valor.

## Lançamentos

- **Criar**: "Lançar gasto" no cabeçalho (no celular, no botão "+") ou "+ Novo" na lista.
- **Crédito**: pede o cartão. O mês da fatura vem automático pelo melhor dia de compra do cartão; dá para trocar.
- **Parcelado**: valor total + número de parcelas (2 a 48). O app cria uma parcela por mês de fatura, a partir da
  fatura escolhida, e mostra a prévia ("10x de R$ 150,00 · Out/26 a Jul/27"). Centavos que sobram da divisão vão
  na 1ª parcela. Sem número de parcelas, vira compra à vista.
- **Navegar**: ‹ › troca o mês; o topo mostra entradas, saídas e saldo. O app carrega os últimos 12 meses. Compra no cartão aparece no mês da fatura, com o selo "fatura Out/26".
- **Editar**: ✏️ na linha. Numa parcela, valor, data e fatura mudam só nela; descrição, categoria e cartão podem ir
  para todas as parcelas.
- **Excluir**: 🗑 na linha, com confirmação. Numa parcela: "Só esta parcela" ou "Todas as parcelas".

## Aportes

Em Análises: criar (🐷 Novo aporte), editar e excluir. O valor é na moeda da caixinha.

## Configurações

- **Geral**: renda mensal e rendimento estimado ao ano.
- **Caixinhas**: conta (dinheiro disponível) ou investimento, moeda, rendimento e cor. A moeda não muda depois de
  criada. Caixinha usada por objetivo ou recorrência não pode ser excluída.
- **Cartões**: limite, melhor dia de compra e vencimento.
- **Objetivos**: meta, caixinhas que contam, aporte mensal e datas. Com data alvo, ganha contagem regressiva. Um deles
  pode ser marcado como reserva de emergência.
- **Orçamento**: limite mensal por categoria; vazio = sem limite. Cada campo mostra a média dos últimos meses, e
  "Preencher com a média" usa essas médias (arredondadas para cima) como ponto de partida.
- **Recorrentes**: contas fixas, salário e aportes que o app lança sozinho todo mês, no dia escolhido.
  - Se o dia deste mês já passou, a recorrência começa no mês seguinte, a menos que você marque "lançar também este
    mês".
  - **Valor variável** (ex.: financiamento): o lançamento automático usa o último valor confirmado, aparece com "≈"
    e o selo "confirmar valor" até você editá-lo. Contas fixas a pagar, próximos 7 dias e calendário usam essa
    estimativa.
  - Pausar não apaga; ao reativar, os meses da pausa não são lançados.
  - Lançamento automático excluído à mão não volta.
  - "Criar aportes a partir da alocação mensal" transforma o aporte planejado de cada objetivo em recorrência.

## Atualizar saldos

"Atualizar saldos" grava o saldo de cada caixinha e o rendimento do mês (opcional), e atualiza a evolução do mês.
Os campos já vêm com o que foi salvo naquele mês.

- **Mês atual**: atualiza os saldos de agora e a foto do mês. Também recebe o limite disponível de cada cartão, como
  aparece no app do banco (vazio mantém o último informado). Também recebe o limite disponível de cada cartão, como
  aparece no app do banco (vazio mantém o último informado).
- **Mês passado** (até 12 meses): grava só a foto daquele mês, para preencher buracos no histórico e no gráfico de
  patrimônio. Pede também a cotação do dólar/euro no fim do mês (se houver caixinha nessas moedas) e as faturas em
  aberto (opcional). Os saldos de hoje não mudam.
