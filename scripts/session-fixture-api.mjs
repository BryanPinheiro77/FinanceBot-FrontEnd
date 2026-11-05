// Servidor exclusivamente de testes: sem banco, secrets ou dados reais.
import { createServer } from 'node:http'
const issued = new Map()
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
    const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: payload.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.Zml4dHVyZS1vbmx5`
    issued.set(token, {
      ...user,
      id: payload.email.startsWith('second') ? 2 : 1,
      email: payload.email,
    })
    response.writeHead(request.url === '/auth/register' ? 201 : 200)
    return response.end(JSON.stringify({ token, type: 'Bearer', userId: 1 }))
  }
  if (!issued.has(request.headers.authorization?.replace(/^Bearer /, ''))) {
    response.writeHead(401)
    return response.end('{}')
  }
  if (request.url === '/users/me')
    return response.end(
      JSON.stringify(
        issued.get(request.headers.authorization?.replace(/^Bearer /, '')),
      ),
    )
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
    ).email
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
