# Transações web — issue #167

A rota `/transactions` permite listar, criar, editar e excluir lançamentos
unitários do usuário autenticado. A navegação financeira conecta o dashboard e a
listagem; ao abrir pelo dashboard, o período selecionado acompanha a navegação.
A interface mantém cores, tipografia, temas e controles existentes da aplicação.

## Consulta e edição

- Filtros por datas inicial/final inclusivas, tipo, conta e categoria, com aplicação
  explícita. A combinação aplicada e a página ficam na URL; recarga e histórico
  do navegador preservam o contexto. Valores e descrições não vão para a URL.
- Paginação real da API, em páginas de 10, 20 ou 50 itens. Ordem fixa por data
  decrescente e ID decrescente para desempatar. Aplicar filtro/tamanho volta à
  primeira página; excluir o último item de uma página consulta a última válida.
- Formulário no próprio conteúdo para criar/editar. A edição consulta novamente
  o lançamento antes de exibi-lo, preserva a origem do Telegram e exige categoria
  compatível com receita/despesa. Campos obrigatórios, datas e centavos são validados
  no cliente; a API continua sendo a autoridade de negócio e autorização.
- Exclusão usa confirmação com descrição, data e valor. Para parcelas, edição e
  exclusão afetam somente o lançamento selecionado, sem alterar o grupo.
- Depois de escrita confirmada, a lista é consultada novamente com os filtros
  atuais. O dashboard busca o resumo novamente quando o usuário navega até ele;
  nenhum saldo é calculado ou corrigido a partir do formulário no navegador.

Contas/categorias vêm dos endpoints existentes. Seus CRUDs completos (#165/#166),
criação de parcelamento, exclusão em grupo e gerenciamento de recorrências não
integram esta entrega. Registros podem deixar de aparecer depois de uma edição
que os tire dos filtros selecionados.

## Contratos e precisão

| Método | Proxy web                           | Uso                                                                                    |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------- |
| GET    | `/api/financebot/transactions`      | Página com `content`, `number`, `size`, `totalElements`, `totalPages`, `first`, `last` |
| POST   | `/api/financebot/transactions`      | Criação unitária; `201` com `transaction` e `analysis`                                 |
| GET    | `/api/financebot/transactions/{id}` | Abrir dados atuais para edição                                                         |
| PUT    | `/api/financebot/transactions/{id}` | Alterar um lançamento                                                                  |
| DELETE | `/api/financebot/transactions/{id}` | Excluir um lançamento; `204` sem corpo                                                 |

O proxy permite apenas esses métodos/paths adicionais e IDs positivos canônicos
compatíveis com Java Long. Caminhos internos, IDs inválidos, PATCH e criação de
parcelamentos não foram liberados. Cookies protegidos, verificação de origem/header
nas mutações e `private, no-store` permanecem. Bearer não é entregue ao JavaScript.
IDs recebidos como números que não possam ser representados com segurança no
navegador são recusados para evitar operar sobre uma referência arredondada.

Valores monetários são mantidos em texto decimal no cliente, incluindo a leitura
do literal numérico JSON da API. A serialização envia um número JSON exato,
compatível com BigDecimal, sem conversão por Number e sem arredondar frações de
centavo. A formatação em reais usa o inteiro/casas decimais, sem somar lançamentos.
O campo aceita até 17 dígitos inteiros e duas casas, coerente com o armazenamento
`numeric(19,2)` da API; não aceita separadores de milhares nem notação exponencial.

[Contrato da API e limites](https://github.com/BryanPinheiro77/FinanceBot-BackEnd/blob/main/docs/frontend-transactions.md).
A mudança não exige endpoint, migration, dependência ou secret novo no backend.

## Resultados incertos e privacidade

POST usa um UUID em `Idempotency-Key`, gerado por tentativa lógica. Em falha de
rede/5xx ou resposta não confirmada, o formulário congela e preserva dados/chave
em memória. O reenvio explícito é permitido somente com o mesmo corpo/chave por
até 45 segundos da primeira tentativa, abaixo da menor retenção configurável da
API (60s). Não há repetição automática de criação.

Após 45 segundos, 409 ou saída/recarregamento da página, conferir os lançamentos
antes de cadastrar outra vez. A aplicação não persiste chave, formulário ou dados
financeiros em Web Storage. A proteção não promete retomada depois de fechar a aba.
Falhas 400/403/404 permitem corrigir dados; 401 usa o fluxo existente de expiração.
PUT/DELETE sem confirmação exigem conferir a lista, sem replay automático.

A API não oferece ETag/versionamento otimista nessa operação: a última escrita
aceita prevalece. Buscar novamente ao abrir a edição não elimina alterações
concorrentes depois dessa consulta.

Troca de filtros, página ou identidade cancela/ignora consultas antigas. Dados
anteriores não ficam visíveis enquanto outro contexto carrega. A lista distingue
vazio de falha; contas/categorias indisponíveis bloqueiam escrita sem esconder a
consulta. O isolamento real continua na API, independentemente dos IDs enviados.

## Validação local

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e:transactions
npm run test:e2e:dashboard
npm run test:e2e:session
```

A suíte dedicada usa API fictícia em loopback (3997), frontend local (3111) e
identidades exclusivas por teste. Não acessa produção. Cobre CRUD, filtros,
paginação/recarga, vazio, retry, validação, resposta atrasada, resultado incerto,
expiração da janela de reenvio, sessão expirada e isolamento. Executa Chromium em
desktop, celular e modo de movimento reduzido. Mede contraste de texto secundário,
navegação ativa e ação principal no tema escuro; não é uma auditoria WCAG completa.

Capturas da lista: [desktop claro](evidence/issue-167/list-desktop-light.png),
[desktop escuro](evidence/issue-167/list-desktop-dark.png),
[celular claro](evidence/issue-167/list-mobile-light.png) e
[celular escuro](evidence/issue-167/list-mobile-dark.png). Todos os dados são fixtures.
Os templates preservam a tipografia existente; o detector Impeccable reportou
somente essa escolha de fonte já adotada pelo produto.

Publicação autorizada para a v1.14.0, pela integração Git da Vercel após CI e
merge na main. As notas da release registram os SHAs, PRs e a confirmação do
deploy. Não foi feito smoke autenticado com dados reais, validação Safari/Firefox
ou teste de concorrência contra produção.

### Resultado executado

- 73 testes unitários/proxy aprovados, incluindo dinheiro exato, calendário,
  normalização, allowlist, CSRF e encaminhamento do corpo/chave.
- 36 cenários Playwright de transações aprovados (12 por projeto), incluindo
  criação com renovação de sessão sem duplicar.
- Regressões: 18 cenários de dashboard e 8 de sessão aprovados; landing com
  41 aprovados e 4 skips preexistentes.
- Typecheck, build, ESLint dos arquivos alterados e whitespace aprovados.
- Não houve alteração de Java; a suíte Maven não foi reexecutada nesta issue.

A primeira execução no worktree final teve dois timeouts durante o carregamento
inicial de módulos do Vite. A espera inicial do teste passou de 5 para 20 segundos;
a suíte foi reexecutada integralmente, sem alterar as verificações do CRUD.
No CI, a leitura de contraste precisou aguardar a transição de cores ao trocar
para o tema escuro; usa polling da condição original de pelo menos 4,5:1.

A implementação usa worktree próprio. A main com sessões revogáveis foi integrada
antes da publicação: cliente HTTP mantém o decoder decimal após renovação, proxy
preserva cookies e endpoints de sessão, e os guards e o aviso de ociosidade
permanecem ativos. As suítes acima foram reexecutadas nessa base conjunta.

### Revisão pré-publicação

- Segurança: autenticação, CSRF, allowlist, cookie protegido e no-store preservados;
  sem credenciais ou conteúdo financeiro em logs/armazenamento web.
- Banco e IA: sem mudanças nesta entrega; regras financeiras continuam na API.
- Código e interface: testes de erros, paginação, identidade, valores e acessibilidade
  descritos acima. Capturas usam somente fixtures.
- Dependências: npm audit com zero high/critical e nove moderate já existentes;
  package-lock e dependências permanecem iguais à main.
- Deploy: mesmo projeto Vercel e variáveis existentes; reversão pode republicar o
  SHA anterior compatível. Não há migrations novas ou rollback automático.
- Observabilidade: tratamento de falhas e logs da plataforma mantidos; sem novo
  monitoramento de erros no browser. Backup contínuo permanece na #220 do backend,
  sem alteração de banco ou infraestrutura pela #167.
