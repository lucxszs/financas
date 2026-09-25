# Funcionalidades

Guia de uso do app, tela por tela.

## Login e acesso

- Login com conta Google.
- Só contas liberadas usam o app (documento `acessos/{uid}` no Firestore). Uma conta não liberada vê a tela
  "Acesso não liberado" com o próprio `uid`, para facilitar a liberação.
- **Sair** fica no cabeçalho.

## Primeiro acesso (onboarding)

Enquanto não existe configuração, o app mostra **Configurar plano**:

- **Importar JSON**: carrega caixinhas, objetivos, cartões, saldos, histórico e fechamentos de uma vez. O arquivo é
  validado antes de gravar; se houver erro, nada é salvo e a lista de problemas aparece na tela.
- **Usar dados de exemplo**: carrega `seed/exemplo.json` (fictício).

Formato do arquivo: [modelo de dados](modelo-de-dados.md#arquivo-de-importação).

## Visão geral

| Bloco               | O que mostra                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Contagem regressiva | Para cada objetivo com `dataAlvo`: meses e dias restantes, valor guardado, quanto falta e progresso financeiro e temporal |
| Câmbio              | USD e EUR ao vivo (atualiza a cada 5 min), data e hora da cotação e quanto valem as caixinhas em moeda estrangeira        |
| Score do mês        | 🟢 / 🟡 / 🔴 a partir das respostas "pagou as contas", "fechou positivo" e "fez o aporte"                                 |
| Investimentos       | Total em BRL, rendimento mensal estimado e um card por caixinha com progresso no objetivo                                 |
| Cartões de crédito  | Limite, utilizado e disponível na fatura do mês (usa o "mês da fatura" dos lançamentos)                                   |
| Metas               | Progresso de cada objetivo, previsão e quanto falta                                                                       |
| Alocação mensal     | Aporte mensal planejado por objetivo e o total                                                                            |

### Câmbio: quando a cotação falha

1. Se a AwesomeAPI falhar, tenta de novo mais 2 vezes (espera de 2s e 4s).
2. Ainda sem resposta: usa a última cotação boa guardada no navegador e mostra "⚠️ Última cotação disponível: dd/mm/aaaa
   às hh:mm", com o botão "Tentar novamente".
3. Só mostra erro se nunca houve cotação guardada naquele navegador.

## Lançamentos (CRUD)

- **Criar**: "+ Lançar gasto" no cabeçalho ou "+ Novo" na lista. Tipos: débito, PIX, crédito, parcelado, dinheiro,
  emprestei, recebi, salário, outro. Crédito e parcelado pedem o cartão e, opcionalmente, o mês da fatura.
- **Listar**: por mês, com setas ‹ › para navegar entre meses, e o resumo de entradas, saídas e saldo.
- **Editar**: ✏️ na linha abre o mesmo formulário preenchido. A data de criação original é preservada.
- **Excluir**: 🗑 na linha pede confirmação antes de apagar.

## Histórico

- **Aportes (CRUD)**: lista de aportes com ✏️ editar e 🗑 excluir; "🐷 Novo aporte" cria. O valor é na moeda da
  caixinha (BRL, USD ou EUR).
- **Evolução dos investimentos**: uma linha por mês com o saldo de cada caixinha e o total em BRL, calculado com a
  cotação gravada naquele mês.
- **Gastos mensais**: fechamentos manuais por mês, com itens pagos ✅ / pendentes ❌, total, sobra ou déficit e notas.

## Gastos

- Gastos do mês atual por categoria, a partir dos lançamentos.
- Média histórica de referência (definida na configuração).

## Atualizar saldos

"✏️ Atualizar saldos" grava o saldo atual de cada caixinha, o rendimento do mês (opcional) e o score do mês. Cada
gravação também cria ou atualiza a foto do mês em **Evolução dos investimentos**.

- Campo vazio mantém o saldo anterior; `0` zera.

## Celular

O layout se adapta a telas pequenas:

- Botões do cabeçalho em grade 2×2 e menu fixo no topo, com rolagem horizontal.
- Lançamentos e aportes com descrição e valor empilhados e botões de ação com área de toque de 40px.
- Formulários abrem de baixo para cima (bottom sheet), com os botões de salvar sempre visíveis.
- Campos com fonte de 16px, para o iPhone não dar zoom ao focar.
- Respeita o notch e a barra inferior (safe area).

## Bandeiras

Bandeiras emoji (🇦🇷 🇺🇸 🇪🇺) aparecem em todos os sistemas. O Windows não desenha bandeiras emoji; nele, o app carrega
uma fonte só com as bandeiras (Twemoji Country Flags, servida pelo próprio site).
