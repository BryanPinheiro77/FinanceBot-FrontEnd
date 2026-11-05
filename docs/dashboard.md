# Dashboard mensal — issue #164

## Estado anterior e escopo

Antes desta mudança, `/dashboard` exibia renda cadastrada, uma conta e vínculo com
Telegram, além de uma mensagem permanente de onboarding concluído. Não havia
seletor de mês, receitas/despesas agregadas nem gráficos.

A implementação preserva a tipografia, cores e temas da aplicação e adiciona:
seleção mensal, receitas, despesas, resultado, movimentação diária e despesas por
categoria. O gráfico diário oferece tabela expansível operável por teclado; os
valores das categorias aparecem como texto. Valores são formatados em reais.

O resultado mensal é a diferença entre receitas e despesas registradas no período,
calculada pela API; não representa saldo bancário nem projeção. A renda cadastrada
aparece separadamente, como referência. Parcelas entram pela data do lançamento;
recorrências ainda não materializadas não entram. A API entrega todos os dias do
mês, incluindo dias zerados.

## Contrato e sessão

O navegador consulta `GET /api/financebot/dashboard/monthly-summary?month=AAAA-MM`.
O proxy adiciona o Bearer obtido do cookie HttpOnly, mantém `private, no-store` e
`Vary: Cookie` e aceita somente GET nessa rota. O JavaScript não recebe o JWT.
As contas continuam usando `GET /api/financebot/accounts`.

O resumo retorna `month`, `startDate`, `endDate`, `totalIncome`, `totalExpense`,
`balance`, `transactionCount`, `daily` e `expensesByCategory`. Não são calculados
saldos ou agrupamentos financeiros no navegador: apenas formatação e escala visual.
[Contrato da API](https://github.com/BryanPinheiro77/FinanceBot-BackEnd/blob/main/docs/dashboard.md).

A mudança exige publicar primeiro a API que implementa esse contrato. O backend
anterior não tem o endpoint de resumo. Não há mudanças de migrations, autenticação
ou contrato de criação de transações. A publicação ainda depende de revisão e
autorização do mantenedor.

## Estados e privacidade

- Carregamento identificado por `role=status` e `aria-busy`; os controles de período
  continuam disponíveis.
- Meses vazios mostram zero e orientação para registrar lançamentos ou trocar o mês.
- Falhas mostram erro e botão de nova tentativa; não são tratadas como zero.
- Troca de período ou usuário oculta imediatamente o resultado anterior. Consultas
  antigas são canceladas/ignoradas e não sobrescrevem o mês atual.
- `401` usa o fluxo existente de expiração: limpa a identidade e abre o login.
- Nenhum dado financeiro é persistido em armazenamento do navegador. Logout e novo
  login não compartilham o estado do dashboard.
- Ajustes responsivos atendem celular e desktop, com temas claro/escuro. A preferência
  de redução de movimento desativa animações e transições nessa superfície.

## Como validar

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e:dashboard
npm run test:e2e:session
```

A suíte de dashboard inicia API fictícia e frontend em loopback nas portas
3998/3110, sem banco ou dados de produção. Cobre conteúdo, período, tabela por
teclado, ausência de overflow, mês vazio, falha/retry, resposta atrasada, expiração
de sessão e isolamento após logout/login. Executa nos projetos desktop, mobile e
reduced-motion. Cada projeto grava capturas dos temas claro e escuro em
`test-results/`; traces são preservados em falhas. O CI executa essa suíte além
das suítes já existentes.

São dados de fixture, não evidência de integração com uma instalação real. Testes
H2/JWT do contrato e isolamento pertencem ao backend. Não foi realizado deploy.

## Capturas locais

Antes: [desktop](evidence/issue-164/before-desktop.png) e
[celular](evidence/issue-164/before-mobile.png).
Depois: [desktop claro](evidence/issue-164/desktop-light.png),
[desktop escuro](evidence/issue-164/desktop-dark.png),
[celular claro](evidence/issue-164/mobile-light.png) e
[celular escuro](evidence/issue-164/mobile-dark.png).
As capturas usam somente nomes, valores e identidades fictícias da suíte.

## Resultado desta implementação — 05/11/2026

- `npm test`: 22 testes aprovados.
- `npm run typecheck` e `npm run build`: aprovados.
- ESLint dos arquivos TypeScript alterados e verificação Prettier: aprovados.
- `npm run test:e2e:dashboard`: 18 testes aprovados nos três projetos.
- `npm run test:e2e:session`: 4 testes aprovados.
- Capturas regeneradas em uma rodada específica dos três projetos: 3 testes
  aprovados. Cópias selecionadas preservadas nos links acima.
- `git diff --check`: aprovado.

O detector Impeccable reportou somente a tipografia Plus Jakarta Sans já adotada
pela aplicação. Ela foi preservada para manter a identidade da landing page.
Os testes de navegador usam Chromium local; não foi feito teste manual em Safari
ou Firefox nem auditoria completa WCAG por ferramenta especializada.
