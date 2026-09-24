# Arquitetura

## Visão geral

```
Navegador (React SPA)
 ├─ Firebase Auth (Google) ............ identidade
 ├─ Cloud Firestore ................... dados, protegidos por firestore.rules
 └─ AwesomeAPI ........................ cotações USD/EUR → BRL
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
    calculos.ts      conversão de moedas, progresso de metas, score, uso de cartão, totais
    datas.ts         datas no fuso local, rótulos de mês
    formatadores.ts  moeda (BRL/USD/EUR) com Intl
    catalogos.ts     tipos de transação e categorias
    validacao.ts     validação do JSON de importação
    *.test.ts        testes unitários
  services/        acesso a dados externos
    repositorio.ts   leitura/escrita no Firestore (CRUD e listeners em tempo real)
    cotacao.ts       AwesomeAPI
  hooks/           useCotacoes (polling de 5 min), useEnvio (estado de formulários)
  features/        telas, uma pasta por funcionalidade
    auth/            AuthProvider, login, allowlist
    dados/           DadosProvider: assina as coleções do usuário e expõe via contexto
    visao/ lancamentos/ historico/ gastos/ onboarding/
    modais/          formulários de saldos, transação e aporte (criar e editar)
  components/      UI compartilhada (Modal, ModalConfirmacao, AcoesItem, Barra...)
  lib/firebase.ts  inicialização; conecta nos emuladores quando VITE_USE_EMULATORS=true
  styles/global.css
tests/             testes das firestore.rules (emulador)
scripts/           seed-emulador.mjs
seed/              exemplo.json (público) e dados reais *.json (ignorados pelo git)
docs/              esta documentação
```

## Fluxo de dados

1. `AuthProvider` observa o login. Com usuário logado, lê `acessos/{uid}` para saber se ele está liberado.
2. `DadosProvider` abre listeners (`onSnapshot`) em `users/{uid}/...` e mantém tudo em estado React. Qualquer
   gravação (inclusive de outro dispositivo) chega em tempo real.
3. As telas leem o contexto com `useDadosConfigurados()` e calculam o que mostram com funções de `domain/`.
4. Formulários gravam via `services/repositorio.ts`. Não há estado otimista: a tela atualiza quando o listener do
   Firestore recebe a mudança (o SDK aplica gravações locais imediatamente, então a resposta é instantânea).

## Decisões

| Decisão                                    | Motivo                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Sem backend                                | App pessoal de um usuário; as regras do Firestore dão controle de acesso suficiente e testável.  |
| Allowlist em `acessos/{uid}`               | Login Google aceita qualquer conta; a allowlist impede que desconhecidos criem dados no projeto. |
| Dados em `users/{uid}/...`                 | Isolamento por usuário simples de expressar e testar nas regras.                                 |
| Config no Firestore, não no código         | Permite repo público sem dados pessoais.                                                         |
| Snapshot mensal com cotação                | O total histórico usa o câmbio daquele mês, não o de hoje.                                       |
| Datas `YYYY-MM-DD` como string, fuso local | Evita o bug de UTC (`toISOString`) que jogava lançamentos noturnos para o dia seguinte.          |
| Domínio sem dependências                   | Cálculos testáveis sem mock de Firebase nem React.                                               |
| Sem biblioteca de UI/estado                | O app é pequeno; Context + hooks bastam e mantêm o bundle leve.                                  |
