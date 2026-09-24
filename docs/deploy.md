# Deploy e CI/CD

## Pipeline

Arquivo: [`.github/workflows/pipeline.yml`](../.github/workflows/pipeline.yml)

```
Pull request ──► qualidade ──┐
             └─► regras ─────┴─► preview (canal temporário, 7 dias, link comentado no PR)

Push na main ──► qualidade ──┐
             └─► regras ─────┴─► produção (hosting + firestore.rules)
```

| Job                             | O que faz                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| **Lint, tipos, testes e build** | `format:check`, `lint`, `typecheck`, `test`, `build`; publica `dist/` como artefato     |
| **Testes das firestore.rules**  | sobe o emulador (Java 21) e roda `tests/`                                               |
| **Deploy de preview**           | só em PRs do próprio repo; pulado em PRs de forks e do Dependabot (não recebem secrets) |
| **Deploy em produção**          | só na `main`; environment `production`; deploy com a service account                    |

## Configuração do GitHub

**Settings > Secrets and variables > Actions**

- **Variables** (públicas, config do app Web): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
  `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
  `VITE_FIREBASE_APP_ID`. Uma variável por nome.
- **Secret** `FIREBASE_SERVICE_ACCOUNT`: conteúdo inteiro do JSON da service account.

**Service account** (Google Cloud > IAM > Contas de serviço), papéis:

- Firebase Hosting Admin
- Firebase Rules Admin
- API Keys Viewer
- Service Usage Consumer

**Settings > Rules > Rulesets**, regra para a branch padrão:

- Restrict deletions
- Block force pushes
- Require a pull request before merging (0 aprovações)
- Require status checks: `Lint, tipos, testes e build` e `Testes das firestore.rules (emulador)`

**Settings > Pages:** desativado (o hosting é o Firebase).

## Previews e login

O preview de um PR mostra a tela de login, mas o login com Google não funciona nele por padrão: o domínio do canal
não está nos domínios autorizados do Auth nem nas restrições da API key. Para testar logado, adicione
temporariamente o domínio exato do canal nos dois lugares. Para testar o app completo localmente, use
`npm run dev:emulador`.

## Deploy manual

```bash
npx firebase login
npm run deploy   # build + firebase deploy --only hosting,firestore:rules
```

## Dependabot

[`.github/dependabot.yml`](../.github/dependabot.yml): npm semanal (produção e desenvolvimento em grupos separados) e
GitHub Actions mensal (um PR agrupado). Majors do TypeScript estão ignorados até o `typescript-eslint` suportar o
TypeScript 7.

Se um PR do Dependabot falhar em `npm ci` com `ERESOLVE`, é incompatibilidade entre pacotes: feche o PR em vez de
forçar com `--legacy-peer-deps`.

## Rollback

Firebase Console > Hosting > histórico de versões > **Reverter** na versão anterior. Para as regras, faça revert do
commit e o pipeline publica de novo.
