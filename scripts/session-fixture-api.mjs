// Servidor exclusivamente de testes: sem banco, secrets ou dados reais.
import { createServer } from 'node:http'
const issued = new Map()
const user = { id: 1, name: 'Pessoa de teste', email: 'session@example.invalid',
  monthlyBaseIncome: 5000, onboardingCompleted: true, telegramId: null,
  telegramLinked: false, telegramLinkCode: null, telegramLinkCodeExpiresAt: null }
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  if (request.url === '/health') return response.end('{}')
  if (request.method === 'POST' && ['/auth/login', '/auth/register'].includes(request.url)) {
    let body = ''
    for await (const chunk of request) body += chunk
    const payload = JSON.parse(body)
    if (payload.password !== 'fixture-password') {
      response.writeHead(401); return response.end(JSON.stringify({ detail: 'Email ou senha inválidos' }))
    }
    const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: payload.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.Zml4dHVyZS1vbmx5`
    issued.set(token, { ...user, email: payload.email })
    response.writeHead(request.url === '/auth/register' ? 201 : 200)
    return response.end(JSON.stringify({ token, type: 'Bearer', userId: 1 }))
  }
  if (!issued.has(request.headers.authorization?.replace(/^Bearer /, ''))) {
    response.writeHead(401); return response.end('{}')
  }
  if (request.url === '/users/me') return response.end(JSON.stringify(issued.get(request.headers.authorization?.replace(/^Bearer /, ''))))
  if (request.url === '/accounts') return response.end(JSON.stringify([{ id: 1, name: 'Conta de teste', type: 'CHECKING_ACCOUNT', initialBalance: 0, currentBalance: 0, createdAt: '2026-01-01T00:00:00Z' }]))
  if (request.url === '/categories') return response.end('[]')
  response.writeHead(404); response.end('{}')
})
server.listen(3999, '127.0.0.1')
