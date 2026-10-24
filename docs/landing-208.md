# Landing page do Finance Bot

Implementação no repositório **FinanceBot-FrontEnd**, relacionada à [issue #208 do backend](https://github.com/BryanPinheiro77/FinanceBot-BackEnd/issues/208). A API e o bot não são alterados por esta entrega.

## Experiência

A landing apresenta o produto, suas funcionalidades e o vínculo com o Telegram. Inclui cadastro e login pelas rotas existentes, cards de recursos, abas de consultas/parcelas/lembretes, etapas de configuração, dúvidas frequentes e acesso ao repositório do projeto.

Uma cena contínua acompanha a rolagem: digitação de mensagem, envio, transformação em registro, organização por categorias e resumo mensal. O celular e a conversa permanecem visíveis ao final; as categorias intermediárias desaparecem. Ao voltar para antes do envio, o balão sai do histórico e o texto volta a ser digitado no campo.

Os objetos são interfaces e formas em CSS com perspectiva e sombras, sem modelos 3D ou vídeos externos. Valores e mensagens da cena são fictícios; nenhuma interação cria transações ou escreve na API. Não há ciclos automáticos de animação.

Os botões das etapas percorrem a sequência em 2,4 a 8,4 segundos conforme a distância. É possível pausar ou interromper com rolagem, toque ou teclas de navegação. A abertura leva diretamente à cena e o link da cena segue para os recursos.

## Acessibilidade e temas

- A navegação e as abas funcionam por teclado, com foco visível e link de salto.
- A ilustração é decorativa para leitores de tela; o texto da etapa e seus controles permanecem acessíveis.
- Com `prefers-reduced-motion`, a sequência é navegada pelos botões, sem percurso automático. Janelas com menos de 600px de altura também usam a apresentação manual.
- A troca de tema preserva a preferência existente. Com View Transitions, uma revelação circular parte do botão; sem a API, há uma transição de cores. Movimento reduzido faz a troca imediata.
- Cards e painéis têm sombras apropriadas para os dois temas. A inclinação ao ponteiro fica restrita ao mouse e é desativada com movimento reduzido.

## Conteúdo e proteção de dados

Os recursos descritos foram conferidos no README e na documentação da API, do bot e dos alertas do backend. A mensagem de lembrete usa o formato de linguagem natural documentado: “Me lembre dia 10 de pagar a fatura do cartão.”.

A FAQ explica autenticação, separação por usuário, proteção de senhas e criptografia da renda mensal cadastrada, sem prometer criptografia integral. Informa que a proteção está sendo ampliada. Os detalhes operacionais de servidor e backups pertencem à documentação técnica do backend. Não há promessas de planos, preços ou oferta de hospedagem.

## Comparação com a composição anterior

A rota `/?animacao=off` mantém a composição anterior com o card de envio interativo, para comparação durante a revisão. A página padrão usa apenas a cena animada. O componente anterior e seus testes permanecem necessários para essa rota.

O ponto aprovado anterior também foi preservado em backup local externo ao repositório, com arquivo de fontes, manifesto SHA-256 e patch. Esse backup, arquivos pessoais, capturas e dependências instaladas não são versionados.

## Desenvolvimento e validação

```bash
npm ci
npm run dev
npx playwright install chromium
npm run test:e2e -- --workers=2
npm run build
```

O Vite informa a porta utilizada. Os testes iniciam um servidor próprio em `127.0.0.1:3108` e usam Chromium nos projetos desktop, celular e movimento reduzido. Capturas e traces ficam em `test-results/`, ignorado pelo Git. A captura preserva o caret para não modificar estilos do formulário durante a hidratação.

A suíte verifica rolagem em ambos os sentidos, digitação, permanência e remoção da mensagem no momento correto, recibo/categorias/resumo, navegação lenta e interrupção, movimento reduzido, atalhos, abas, FAQ, temas e alternativa sem View Transitions. A composição anterior conserva cobertura para valor ajustável, envio por clique/teclado, arraste no desktop e limpeza.

A validação executada e seus resultados são registrados no PR. Limites conhecidos:

- Não foi feita auditoria completa de acessibilidade nem medição de Core Web Vitals.
- Testes automatizados usam Chromium; não substituem validação em aparelhos físicos, Safari e Firefox.
- A checagem global `npx tsc --noEmit` tem erros preexistentes em `src/components/ui/calendar.tsx`, `chart.tsx` e `pagination.tsx`, fora do escopo desta alteração.

## Referências visuais

- [Collect UI](https://collectui.com/): composição e hierarquia de interfaces.
- [Referência de narrativa visual](https://collectui.com/designs/landing-page-ui-design-inspiration/0fa6362f-9c6e-4278-954e-4970248de2e7): sequência contínua com profundidade. A adaptação é própria do Finance Bot, sem copiar imagens ou código.
- [Awwwards — Animation](https://www.awwwards.com/websites/animation/): referência inicial de movimento.
- [MDN — startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition): API usada na troca de tema.
