// Servidor exclusivamente de testes: sem banco, secrets ou dados reais.
import { createServer } from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
const issued = new Map()
const refreshes = new Map()
function describe(session) {
  return {
    lastActivityAt: new Date(session.activity).toISOString(),
    idleWarningAt: new Date(session.activity + 3600_000).toISOString(),
    idleExpiresAt: new Date(session.activity + 3660_000).toISOString(),
    sessionExpiresAt: new Date(session.expiry).toISOString(),
  }
}
function issue(session) {
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: session.user.email, sid: session.id, exp: Math.floor(Date.now() / 1000) + 900, jti: randomUUID() })).toString('base64url')}.Zml4dHVyZS1vbmx5`
  const refreshToken = randomBytes(32).toString('base64url')
  issued.set(token, session)
  refreshes.set(refreshToken, { session, consumed: false })
  return { token, refreshToken, ...describe(session) }
}
const user = {
  id: 1,
  name: 'Pessoa de teste',
  email: 'session@example.invalid',
  monthlyBaseIncome: 5000,
  onboardingCompleted: true,
  telegramId: null,
  telegramLinked: false,
  telegramLinkCode: null,
  telegramLinkCodeExpiresAt: null,
}
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  if (request.url === '/health') return response.end('{}')
  if (
    request.method === 'POST' &&
    ['/auth/login', '/auth/register'].includes(request.url)
  ) {
    let body = ''
    for await (const chunk of request) body += chunk
    const payload = JSON.parse(body)
    if (payload.password !== 'fixture-password') {
      response.writeHead(401)
      return response.end(
        JSON.stringify({ detail: 'Email ou senha inválidos' }),
      )
    }
    const session = {
      id: randomUUID(),
      activity: Date.now(),
      expiry: Date.now() + 8 * 3600_000,
      revoked: false,
      user: {
        ...user,
        id: payload.email.startsWith('second') ? 2 : 1,
        email: payload.email,
      },
    }
    response.writeHead(request.url === '/auth/register' ? 201 : 200)
    return response.end(
      JSON.stringify({
        ...issue(session),
        type: 'Bearer',
        userId: session.user.id,
      }),
    )
  }
  if (
    request.method === 'POST' &&
    ['/auth/refresh', '/auth/logout'].includes(request.url)
  ) {
    let body = ''
    for await (const chunk of request) body += chunk
    const known = refreshes.get(JSON.parse(body).refreshToken)
    if (request.url === '/auth/logout') {
      if (known) known.session.revoked = true
      response.writeHead(204)
      return response.end()
    }
    if (!known || known.session.revoked || known.consumed) {
      if (known) known.session.revoked = true
      response.writeHead(401)
      return response.end('{}')
    }
    known.consumed = true
    return response.end(JSON.stringify(issue(known.session)))
  }
  const session = issued.get(
    request.headers.authorization?.replace(/^Bearer /, ''),
  )
  if (session?.revoked) {
    response.writeHead(401)
    return response.end('{}')
  }
  if (!issued.has(request.headers.authorization?.replace(/^Bearer /, ''))) {
    response.writeHead(401)
    return response.end('{}')
  }
  if (request.url === '/users/me')
    return response.end(JSON.stringify(session.user))
  if (request.url === '/auth/session')
    return response.end(JSON.stringify(describe(session)))
  if (request.url === '/auth/activity' && request.method === 'POST') {
    session.activity = Date.now()
    return response.end(JSON.stringify(describe(session)))
  }
  if (request.url === '/accounts')
    return response.end(
      JSON.stringify([
        {
          id: 1,
          name: 'Conta de teste',
          type: 'CHECKING_ACCOUNT',
          initialBalance: 0,
          currentBalance: 0,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ]),
    )
  if (request.url === '/categories') return response.end('[]')
  const url = new URL(request.url, 'http://fixture.invalid')
  if (url.pathname === '/dashboard/monthly-summary') {
    const email = issued.get(
      request.headers.authorization?.replace(/^Bearer /, ''),
    ).user.email
    const month = url.searchParams.get('month')
    const [year, number] = month.split('-').map(Number)
    const days = new Date(Date.UTC(year, number, 0)).getUTCDate()
    const empty = email.startsWith('empty')
    const second = email.startsWith('second')
    const historical = month !== '2026-11'
    const totalIncome = empty ? 0 : second ? 900 : historical ? 100 : 1200.3
    const totalExpense = empty ? 0 : second ? 88.88 : historical ? 50 : 200.3
    const daily = Array.from({ length: days }, (_, index) => ({
      date: `${month}-${String(index + 1).padStart(2, '0')}`,
      totalIncome: index === 0 ? totalIncome : 0,
      totalExpense: index === 4 ? totalExpense : 0,
    }))
    return response.end(
      JSON.stringify({
        month,
        startDate: `${month}-01`,
        endDate: `${month}-${days}`,
        totalIncome,
        totalExpense,
        balance: empty ? 0 : second ? 811.12 : historical ? 50 : 1000,
        transactionCount: empty ? 0 : 2,
        daily,
        expensesByCategory: empty
          ? []
          : [
              {
                categoryId: second ? 2 : 1,
                categoryName: second
                  ? 'Categoria da segunda pessoa'
                  : 'Alimentação',
                totalExpense,
              },
            ],
      }),
    )
  }
  response.writeHead(404)
  response.end('{}')
})
server.listen(Number(process.env.FIXTURE_PORT ?? 3999), '127.0.0.1')
