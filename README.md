# FinanceBot Web

Frontend do FinanceBot com React, TypeScript, TanStack Start/Router, Vite e Tailwind.
API e bot são mantidos em [FinanceBot-BackEnd](https://github.com/BryanPinheiro77/FinanceBot-BackEnd).
Este projeto possui runtime de servidor; não deve ser publicado como SPA estática.

## Desenvolvimento

Requer Node compatível com Vite 8 (o CI usa Node 22), npm e API acessível.

```bash
npm ci
cp .env.example .env
npm run dev
```

Abrir `http://localhost:3000`. Não usar dados pessoais ou credenciais de produção
nos testes. Configurações locais ficam fora do Git.

## Sessão web

O navegador chama `/api/financebot/*` na própria origem. O servidor web recebe o
Bearer da API e guarda em cookie `HttpOnly`, `SameSite=Lax`, host-only e `Secure`
em produção, sem devolver JWT no JSON. JavaScript não lê o cookie nem mantém
JWT em localStorage/sessionStorage. Tokens antigos são descartados, exigindo
novo login. Logout limpa a sessão local; não revoga um JWT já copiado por terceiro.

Mutações exigem origem exata e header próprio; o proxy tem allowlist de rotas,
não encaminha headers arbitrários, bloqueia redirects do upstream e evita cache
de dados autenticados. [Configuração, limites e publicação](docs/web-session.md).

## Validação

```bash
npm test
npm run build
npm run test:e2e:session
```

O smoke de sessão inicia API fictícia em loopback e cobre login/cadastro,
recarga autenticada, logout, descarte do token antigo e CSRF sem acessar produção.
Os testes de landing continuam em `npm run test:e2e` (configuração original).
`npm run lint`, `npm run check` e `npx tsc --noEmit` são verificações adicionais;
problemas de componentes legados devem ser tratados sem ocultar novas regressões.

## Publicação

A produção é hospedada na Vercel. Cada PR deve ser revisado/testado antes de merge
na branch de produção; a integração Git pode publicar automaticamente esse merge.
Configurar variáveis **de servidor**, HTTPS e compatibilidade com a API antes de
publicar a migração de sessão. Não colocar `JWT_SECRET` ou chaves privadas em
variáveis `VITE_`. Previews devem usar fixtures ou ambiente isolado.

```bash
npm run build
```

O adapter Nitro gera o output para a plataforma configurada. Em ambiente Node
compatível, o build padrão pode ser validado com `node .output/server/index.mjs`.
A publicação e os testes de produção exigem autorização do mantenedor.
