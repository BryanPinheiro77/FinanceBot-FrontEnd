# Changelog

## [Unreleased]

### Added
- Landing page com narrativa visual controlada por rolagem, recursos do produto e dúvidas frequentes (#208 do FinanceBot-BackEnd)
- Comparação da composição anterior em `/?animacao=off`
- Testes de navegador para a landing em desktop, celular e movimento reduzido
- Integração real de autenticação no frontend web
- AuthProvider com sessão baseada em token
- Guards de rota para login, cadastro, onboarding e dashboard
- Integração inicial do onboarding com backend
- Código dinâmico de vínculo com Telegram
- Dashboard inicial com dados reais básicos

### Security
- Atualização do TanStack Start para 1.168.60 e do core de servidor para 1.169.39, corrigindo a CVE-2026-102989 que bloqueava os builds na Vercel

### Changed
- Apresentação da landing, sombras dos cards e transição entre temas claro e escuro
- Textos de segurança alinhados às proteções atualmente implementadas
- Idioma do documento para português brasileiro
- Fluxo de login e cadastro deixou de ser mockado
- Dashboard deixou de usar apenas dados estáticos
