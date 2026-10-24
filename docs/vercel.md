# Vercel — frontend

O projeto existente `financebot`, da equipe `bryans-projects-c2eef6e3`, está conectado ao repositório FinanceBot-FrontEnd. O backend continua em repositório e infraestrutura separados.

## Configuração conferida

- Diretório raiz: `.`.
- Runtime configurado no projeto: Node.js 24.x.
- Preset: Vite; comando de build: `npm run build`.
- A integração GitHub/Vercel publica alterações na branch `main`.
- O diretório local está vinculado pelo arquivo ignorado `.vercel/project.json`.
- `.env.local` e `.vercel/` não devem ser versionados. O vínculo local pode gerar credenciais OIDC nesses arquivos.

## Bloqueio de segurança

Os logs do deploy do commit `6db40e0` mostraram bloqueio da versão `@tanstack/react-start@1.168.0` pela CVE-2026-102989, antes da compilação. A atualização preparada fixa `@tanstack/react-start@1.168.60` e resolve `@tanstack/start-server-core@1.169.39` no lockfile. Não usar a variável de bypass de vulnerabilidade sugerida no erro da plataforma.

Referência: [aviso oficial do TanStack](https://tanstack.com/blog/tanstack-start-security-update-cve-2026-102989).

Validação local após a atualização: `npm run build` passou; `npm run test:e2e -- --workers=2` teve 41 casos aprovados e 4 ignorados conforme dispositivo/movimento reduzido. A atualização ainda precisa ser enviada e validada em um novo deploy da Vercel.

`npm audit` ainda reporta outras dependências vulneráveis; esta correção específica não equivale a uma auditoria completa da árvore de dependências.

## Acesso do agente

A CLI Vercel 65.2.0 foi instalada globalmente e autenticada. As skills oficiais de `vercel-labs/agent-skills` foram instaladas no escopo do usuário, como alternativa ao plugin indisponível no catálogo deste Codex.

O servidor MCP global `vercel` usa exclusivamente `https://mcp.vercel.com`, com OAuth autenticado. A sessão corrente pode precisar ser reiniciada para disponibilizar as ferramentas recém-configuradas. As chamadas MCP `search_vercel_documentation` e `list_teams` ainda precisam ser verificadas quando as ferramentas estiverem carregadas; a consulta equivalente de equipes via CLI já funcionou.

Guia seguido: [onboarding oficial da Vercel para agentes](https://vercel.com/get-started.md).
