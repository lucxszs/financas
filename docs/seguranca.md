# Segurança

O repositório é público e não contém dados financeiros. A proteção dos dados vem de camadas no Firebase.

## Camadas

| Camada               | Onde                       | O que garante                                                                                                |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Autenticação         | Firebase Auth (Google)     | Nada no Firestore é acessível sem login                                                                      |
| E-mail verificado    | regras (`email_verified`)  | Conta de e-mail e senha só acessa dados depois de confirmar o e-mail; Google já vem verificado               |
| Isolamento           | regras em `users/{uid}/**` | Cada usuário só lê e escreve os próprios dados                                                               |
| Validação            | regras                     | Tipos, tamanhos, formatos de data, valores positivos, `criadoEm` imutável, parcelas                          |
| Imutabilidade        | regras                     | Fechamento mensal só pode ser criado ou apagado, nunca editado; o histórico de alterações só pode ser criado |
| Restrição da API key | Google Cloud Console       | A chave só é aceita a partir dos domínios do app                                                             |
| Cabeçalhos HTTP      | `firebase.json`            | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`                                  |
| XSS                  | React                      | Texto do usuário é sempre escapado (sem `innerHTML`)                                                         |

As regras estão em [`firestore.rules`](../firestore.rules) e são cobertas por
[`tests/firestore.rules.test.ts`](../tests/firestore.rules.test.ts): acesso anônimo, contas sem e-mail verificado, isolamento entre
usuários, validação de campos e edição.

## A `apiKey` do Firebase não é segredo

Ela identifica o projeto e vai para o navegador de qualquer forma. Fica em `.env.local` só para o código ser
genérico. A restrição por domínio é uma camada extra (o cabeçalho `Referer` pode ser forjado fora do navegador); a
proteção real é feita pelas regras.

Configuração recomendada em Google Cloud Console > APIs e serviços > Credenciais > Restrições de sites:

```
https://SEU-PROJETO.web.app/*
https://SEU-PROJETO.firebaseapp.com/*
http://localhost:5173/*
```

Evite `https://*.web.app/*`: libera qualquer site hospedado no Firebase, de qualquer pessoa.

## Contas

- Qualquer pessoa cria conta (Google ou e-mail e senha) e usa o app; não há cadastro manual.
- **Bloquear alguém:** Firebase Console > Authentication > Usuários > desativar a conta. O efeito vale no próximo
  login (o token atual expira em até 1 hora). Os dados em `users/{uid}` continuam lá; apague pelo console se quiser.
- **Custo:** o plano gratuito do Firebase tem cotas diárias de leitura e gravação. Com muitos usuários, acompanhe o
  uso em Firestore > Uso; se for preciso, ative o App Check para barrar acessos fora do app.

## Segredos

| Segredo                    | Onde fica        | Uso                                                                                                                 |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | GitHub > Secrets | Deploy no CI. Papéis mínimos: Firebase Hosting Admin, Firebase Rules Admin, API Keys Viewer, Service Usage Consumer |

Ao gerar uma chave nova da service account, apague a antiga no Google Cloud e o arquivo `.json` baixado.

## Dados pessoais fora do git

- `seed/*.json` (exceto `exemplo.json`), `.env*` (exceto `.env.example` e `.env.emulador`) e `.firebaserc` estão no
  `.gitignore`.
- O CI falha se `seed/dados.local.json` aparecer no repositório.
- Commits removidos com force push **continuam acessíveis pelo hash** no GitHub. Se um dado sensível entrar no
  histórico, a solução segura é apagar e recriar o repositório (ou pedir limpeza ao GitHub Support), não só reescrever
  o histórico.
