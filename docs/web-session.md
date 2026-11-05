# Configuração da sessão web

## Variáveis de servidor

| Variável                      | Uso                                                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FINANCEBOT_API_BASE_URL`     | Origem HTTPS da API, sem path/query/credenciais. HTTP é permitido apenas para loopback no desenvolvimento.                                           |
| `FINANCEBOT_WEB_ORIGIN`       | Origem exata do frontend, incluindo protocolo e porta quando local, sem barra final. Obrigatória em produção.                                        |
| `FINANCEBOT_WEB_PROXY_SECRET` | Base64 canônico de 32 bytes aleatórios, compartilhado somente entre o runtime web e a API para assinar a origem da cota de login/cadastro.           |
| `VERCEL`                      | Marcador fornecido pela plataforma; somente `1` habilita a leitura do IP de origem fornecido pela Vercel. Não simular produção fora dessa fronteira. |

A chave do proxy é exclusiva: não reutilizar segredo JWT, chave de dados, senha
Restic ou token Telegram. Gerar/guardar/configurar em ambiente privado, sem enviar
valores por chat/PR/log. A variável `VITE_API_BASE_URL` antiga serve apenas como
fallback de compatibilidade no servidor; o navegador agora usa caminho relativo.
Preferir a variável de servidor e remover o fallback configurado após a migração.

Produção exige origem web HTTPS e provedor confiável do IP. Fora da Vercel,
implementar a cadeia de confiança do novo host antes de habilitar login via proxy;
o código não confia em headers públicos arbitrários como substituto.

## Cookie e CSRF

- Produção: `__Host-financebot.session`, `Path=/`, `HttpOnly`, `Secure`,
  `SameSite=Lax`, sem `Domain`, até 8 horas e nunca além do `exp` da API.
- Desenvolvimento local: `financebot.session`, sem `Secure`, demais atributos
  mantidos. Não usar esse modo em uma publicação pública.
- Cookie de access contém o JWT assinado pela API, com vida de até 15 minutos.
  O cookie `__Host-financebot.refresh` contém refresh opaco rotativo, também host-only,
  HttpOnly, Secure, SameSite=Lax e Path=/, até a expiração absoluta de 8 horas.
  Desenvolvimento usa `financebot.refresh`, sem Secure, em loopback apenas.
  A API mantém a sessão revogável e valida assinatura, expiração e autorização.
  Nenhuma chave de assinatura JWT fica no frontend.
- POST/PATCH exigem `Origin` exatamente igual à configuração e
  `X-FinanceBot-CSRF: 1`. Solicitações com Fetch Metadata de outra origem/site
  são rejeitadas. Não liberar CORS no proxy nem trocar a comparação por wildcard.
- O token antigo é removido do Web Storage; não é convertido em cookie a partir de
  um valor fornecido por JavaScript. Usuários entram novamente após a publicação.
- Logout é POST com CSRF: primeiro revoga a sessão na API e então limpa os dois
  cookies. Em indisponibilidade, informa a falha e mantém a credencial para tentar
  novamente. `401` limpa ambos os cookies. Cópias dos tokens da sessão revogada são
  rejeitadas pela API, sem encerrar outros dispositivos do usuário.
- XSS ainda pode executar ações pela página. HttpOnly reduz leitura/exfiltração do
  token, mas não substitui prevenção de XSS, autorização ou controle de dependências.

## Fronteira do proxy

Somente os endpoints já consumidos pelo web estão na allowlist: login/cadastro,
logout/refresh/atividade/consulta da sessão, perfil, renda/onboarding, código de vínculo, contas e categorias.
Adicionar endpoints exige revisar método/path, validação e testes; não abrir
`/telegram`, `/actuator`, Swagger ou uma URL arbitrária. APIs não consumidas pelo
web continuam acessíveis diretamente pelos clientes Bearer autorizados.

A requisição do browser não escolhe host/Authorization/Cookie do upstream. O proxy
repassa somente os headers necessários e preserva `Retry-After`, sem cookies/CORS
do upstream. Conteúdo de requisição é limitado a 64 KiB, timeout do upstream é de
15s e redirects são rejeitados. Não repetir automaticamente criações após timeout:
reconciliar estado e preservar a mesma `Idempotency-Key` quando aplicável.
Respostas autenticadas e de login usam `private, no-store`.

O servidor web assina o IP da Vercel com timestamp, método e caminho. A API precisa
suportar e validar esse contrato antes da publicação web; sem isso, usuários podem
compartilhar a cota do IP de saída. Referência do contrato e ordem de implantação:
[API: sessão web](https://github.com/BryanPinheiro77/FinanceBot-BackEnd/blob/develop/docs/security/web-session.md).
O IP só influencia a cota; não concede autenticação.

## Preparar a publicação

1. Revisar PRs dos dois repositórios e executar build, testes e smoke de navegador.
2. Configurar a chave exclusiva primeiro no backend e no ambiente web privado,
   além das origens. Não expor secrets de produção a previews/branches não confiáveis.
3. Promover o backend compatível, validar saúde e cotas. Não substituir CIDRs por
   redes amplas para fazer a assinatura parecer funcionar.
4. Obter autorização do rollout antes de merge/publicação na branch de produção.
   Conferir cookies e headers com dados de teste autorizados; não gerar cadastro
   ou tráfego de força bruta contra produção sem autorização.
5. Validar login/cadastro, reload de página protegida, logout, 401, 429/503,
   CSRF e separação das cotas por IP. Registrar resultado sem tokens/dados pessoais.

Rollback exige decisão coordenada: voltar ao frontend antigo reintroduz Web
Storage; não tratá-lo como recuperação neutra de segurança. Preservar versão e
configuração anteriores e definir a ação para o incidente concreto.

Referências: [CSRF OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
[headers da Vercel](https://vercel.com/docs/headers/request-headers).

## Renovação e aviso de ociosidade

`SessionTimeout` consulta os prazos da API, informa interação real (pointer, teclado,
scroll e toque) a cada no máximo 30 segundos, incluindo envio final após uma sequência
de eventos, e solicita refresh a cada 15 minutos. Foco, consulta e refresh não contam
como interação. A API impõe 1 hora sem atividade mais 60 segundos de aviso. O modal
“Você será desconectado” mostra a contagem, “Continuar conectado” e “Sair agora”.
Continuar depende da confirmação do servidor; não fecha o aviso em caso de falha.
O limite absoluto de 8 horas exige novo login mesmo se houver atividade.

`apiRequest` tenta refresh em `401` de chamada protegida e só então repete essa
chamada. Renovação é POST com CSRF, usa somente cookie HttpOnly no servidor e não
entrega tokens ao browser. Web Locks serializa abas; uma Promise agrupa chamadas da
mesma aba. Sem Web Locks, concorrência entre abas pode ser interpretada como replay
pela API, exigindo novo login. O proxy pula rotação quando o access já tem mais de
30 segundos de validade, evitando consumir novamente o refresh renovado por outra aba.

O guard SSR não renova em GET: se access expirou e há cookie refresh, encaminha para
`/renovar-sessao`. Essa página restaura por POST no browser e segue ao dashboard ou
onboarding; falhas de serviço permitem tentar novamente. Nenhuma credencial é
colocada em URL, HTML, localStorage ou sessionStorage. BroadcastChannel compartilha
apenas prazos de atividade e aviso de logout entre abas. Retorno de suspensão verifica
relógio e prazo do servidor, sem renovar a ociosidade por foco.

Requer a API com V18 e o contrato descrito em
[web-session.md do backend](https://github.com/BryanPinheiro77/FinanceBot-BackEnd/blob/main/docs/security/web-session.md).
Publicação coordenada e novo login para sessões antigas. A preparação local não faz
commit, push ou deploy.
