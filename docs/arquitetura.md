# Arquitetura

## Visão geral

```
Navegador (React SPA)
 ├─ Firebase Auth (Google) ............ identidade
 ├─ Cloud Firestore ................... dados, protegidos por firestore.rules
 ├─ AwesomeAPI ........................ cotações USD/EUR → BRL
 └─ Banco Central (SGS) ............... CDI e IPCA mensais
Firebase Hosting ...................... serve o build estático (dist/)
GitHub Actions ........................ CI (qualidade + regras) e CD (preview e produção)
```

Não há backend próprio: toda a regra de acesso fica nas **regras do Firestore**, que rodam no servidor do Google e
são testadas no emulador a cada PR.

## Stack

| Camada    | Tecnologia                                                 |
| --------- | ---------------------------------------------------------- |
| UI        | React 19, TypeScript (strict), CSS puro                    |
| Build     | Vite 8 (Rolldown), chunks separados para React e Firebase  |
| Dados     | Firebase Auth, Cloud Firestore (SDK modular v12)           |
| Testes    | Vitest (domínio) e `@firebase/rules-unit-testing` (regras) |
| Qualidade | ESLint (typescript-eslint, react-hooks), Prettier          |
| CI/CD     | GitHub Actions, Firebase Hosting, Dependabot               |

## Pastas

```
src/
  domain/          regras de negócio puras, sem React nem Firebase
    types.ts         tipos do modelo de dados
    calculos.ts      conversão de moedas, progresso de metas, uso de cartão, competência, totais
    cartoes.ts       mês da fatura, parcelas, resumo de cada cartão e comprometimento futuro
    resumo.ts        resumo do mês, avisos e limite de gastos
    historico.ts     série mensal e orçamento por categoria
    patrimonio.ts    ativos, dívidas dos cartões e patrimônio líquido
    fechamento.ts    foto do mês e qual mês sugerir fechar
    metas.ts         ritmo das metas: necessário × atual e previsão
    saude.ts         os 5 sinais da saúde financeira
    simulacao.ts     simulações "e se..." e valor futuro
    compra.ts        análise "Posso comprar?"
    auditoria.ts     histórico de alterações: resumo, campos alterados e restauração
    rentabilidade.ts rendimento por caixinha, alocação e CDI/IPCA acumulados
    calendario.ts    entradas e saídas previstas por dia
    recorrentes.ts   o que lançar em cada mês e como montar cada lançamento
    ids.ts           ids legíveis a partir do nome
    instituicoes.ts  bancos: cor oficial, iniciais e detecção pelo nome
    datas.ts         datas no fuso local, rótulos de mês
    formatadores.ts  moeda (BRL/USD/EUR) com Intl
    catalogos.ts     tipos de transação e categorias
    validacao.ts     validação do JSON de importação
    *.test.ts        testes unitários
  services/        acesso a dados externos
    repositorio.ts   leitura/escrita no Firestore (CRUD e listeners em tempo real)
    cotacao.ts       AwesomeAPI + última cotação guardada
    indicadores.ts   CDI e IPCA do Banco Central, com cache de 24h
  hooks/           useCotacoes (polling de 5 min), useIndicadores (CDI/IPCA), useEnvio (estado de formulários)
  features/        telas, uma pasta por funcionalidade
    auth/            AuthProvider, login (Google e e-mail/senha), confirmação de e-mail
    dados/           DadosProvider: assina as coleções do usuário e expõe via contexto
    dashboard/ gastos/ patrimonio/ metas/ analises/ calendario/ onboarding/
    configuracoes/   formulários de caixinhas, cartões, objetivos, orçamento e recorrentes
    modais/          formulários de saldos, transação e aporte (criar e editar)
  components/      UI compartilhada (Modal, ModalConfirmacao, AcoesItem, Barra...), gráficos em SVG,
                   ícones (lucide), logos dos bancos e bandeiras em SVG
  lib/firebase.ts  inicialização; conecta nos emuladores quando VITE_USE_EMULATORS=true
  styles/global.css
tests/             testes das firestore.rules (emulador)
scripts/           seed-emulador.mjs
seed/              exemplo.json (público) e dados reais *.json (ignorados pelo git)
docs/              esta documentação
```

## Fluxo de dados

1. `AuthProvider` observa o login. Conta Google ou com e-mail confirmado entra; e-mail não confirmado fica na tela de
   confirmação.
2. `DadosProvider` abre listeners (`onSnapshot`) em `users/{uid}/...` e mantém tudo em estado React. Qualquer
   gravação (inclusive de outro dispositivo) chega em tempo real. Transações: só dos últimos 12 meses em diante.
   Quando a config chega, ele também lança as recorrências vencidas.
3. As telas leem o contexto com `useDadosConfigurados()` e calculam o que mostram com funções de `domain/`.
4. Formulários gravam via `services/repositorio.ts`. Não há estado otimista: a tela atualiza quando o listener do
   Firestore recebe a mudança (o SDK aplica gravações locais imediatamente, então a resposta é instantânea).

## Decisões

| Decisão                                    | Motivo                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Sem backend                                | App pessoal de um usuário; as regras do Firestore dão controle de acesso suficiente e testável.                   |
| Contas abertas com e-mail verificado       | Qualquer pessoa usa o app sem cadastro manual; exigir e-mail verificado nas regras barra contas com e-mail falso. |
| Dados em `users/{uid}/...`                 | Isolamento por usuário simples de expressar e testar nas regras.                                                  |
| Config no Firestore, não no código         | Permite repo público sem dados pessoais.                                                                          |
| Snapshot mensal com cotação                | O total histórico usa o câmbio daquele mês, não o de hoje.                                                        |
| Datas `YYYY-MM-DD` como string, fuso local | Evita o bug de UTC (`toISOString`) que jogava lançamentos noturnos para o dia seguinte.                           |
| Domínio sem dependências                   | Cálculos testáveis sem mock de Firebase nem React.                                                                |
| Sem biblioteca de UI/estado                | O app é pequeno; Context + hooks bastam e mantêm o bundle leve.                                                   |
| Ícones e bandeiras em SVG                  | `lucide-react` na interface, `country-flag-icons` nas bandeiras e logos do Simple Icons (CC0).                    |
| Última cotação no `localStorage`           | Se a AwesomeAPI cair, o câmbio mostra o último valor conhecido com data e hora.                                   |
| Histórico de alterações imutável           | Cada operação grava, no mesmo batch, um registro com o antes e o depois; as regras só deixam criar.               |
