// API isolada de testes: identidades fictícias, sem secrets, banco ou produção.
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
const tokens = new Map()
const users = new Map()
let nextUser = 1

function seed(email) {
  const id = nextUser++
  const account = {
    id: id * 10,
    name: `Conta ${id}`,
    type: 'CHECKING_ACCOUNT',
    initialBalance: 0,
    currentBalance: 0,
    createdAt: '2026-01-01T00:00:00Z',
  }
  const categories = [
    { id: id * 10 + 1, name: 'Moradia', type: 'EXPENSE' },
    { id: id * 10 + 2, name: 'Alimentação', type: 'EXPENSE' },
    { id: id * 10 + 3, name: 'Salário', type: 'INCOME' },
  ].map((category) => ({ ...category, createdAt: '2026-01-01T00:00:00Z' }))
  const state = {
    id,
    email,
    name: `Pessoa ${id}`,
    monthlyBaseIncome: 5000,
    onboardingCompleted: true,
    telegramId: null,
    telegramLinked: false,
    telegramLinkCode: null,
    telegramLinkCodeExpiresAt: null,
    account,
    categories,
    records: [],
    keys: new Map(),
    next: id * 1000 + 22,
  }
  for (let index = 0; index < 21; index++) {
    const income = index === 1
    const category = categories[income ? 2 : index === 0 ? 0 : 1]
    state.records.push({
      id: id * 1000 + index + 1,
      amount: index === 0 ? 1200 : income ? 3000 : 15.1,
      description:
        index === 0
          ? 'Parcela de teste'
          : income
            ? 'Salário de teste'
            : `Mercado de teste ${String(index - 1).padStart(2, '0')}`,
      date:
        index === 0
          ? '2026-11-30'
          : income
            ? '2026-11-29'
            : `2026-11-${String(index - 1).padStart(2, '0')}`,
      type: income ? 'INCOME' : 'EXPENSE',
      sourceType: index === 0 ? 'BOT_AUDIO' : 'WEB',
      installment: index === 0,
      installmentNumber: index === 0 ? 2 : null,
      totalInstallments: index === 0 ? 3 : null,
      installmentGroupId: index === 0 ? `fixture-${id}` : null,
      accountId: account.id,
      accountName: account.name,
      categoryId: category.id,
      categoryName: category.name,
      createdAt: '2026-11-01T12:00:00',
    })
  }
  return state
}

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  const send = (status, data) => {
    response.writeHead(status)
    response.end(data === undefined ? undefined : JSON.stringify(data))
  }
  const url = new URL(request.url, 'http://fixture.invalid')
  if (url.pathname === '/health') return send(200, {})
  let body
  if (request.method === 'POST' || request.method === 'PUT') {
    let raw = ''
    for await (const chunk of request) raw += chunk
    try {
      body = JSON.parse(raw)
    } catch {
      return send(400, { detail: 'Corpo inválido.' })
    }
  }
  if (request.method === 'POST' && url.pathname === '/auth/login') {
    if (body.password !== 'fixture-password')
      return send(401, { detail: 'Credenciais inválidas.' })
    if (!users.has(body.email)) users.set(body.email, seed(body.email))
    const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: body.email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.Zml4dHVyZS1vbmx5`
    tokens.set(token, users.get(body.email))
    return send(200, {
      token,
      type: 'Bearer',
      refreshToken: randomBytes(32).toString('base64url'),
      sessionExpiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(),
    })
  }
  const user = tokens.get(
    request.headers.authorization?.replace(/^Bearer /, ''),
  )
  if (!user) return send(401, { detail: 'Entre novamente.' })
  if (url.pathname === '/auth/session' || url.pathname === '/auth/activity') {
    return send(200, {
      lastActivityAt: new Date().toISOString(),
      idleWarningAt: new Date(Date.now() + 3600_000).toISOString(),
      idleExpiresAt: new Date(Date.now() + 3660_000).toISOString(),
      sessionExpiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(),
    })
  }
  if (request.method === 'GET' && url.pathname === '/users/me') {
    const {
      id,
      email,
      name,
      monthlyBaseIncome,
      onboardingCompleted,
      telegramId,
      telegramLinked,
      telegramLinkCode,
      telegramLinkCodeExpiresAt,
    } = user
    return send(200, {
      id,
      email,
      name,
      monthlyBaseIncome,
      onboardingCompleted,
      telegramId,
      telegramLinked,
      telegramLinkCode,
      telegramLinkCodeExpiresAt,
    })
  }
  if (request.method === 'GET' && url.pathname === '/accounts')
    return send(200, [user.account])
  if (request.method === 'GET' && url.pathname === '/categories')
    return send(200, user.categories)
  if (request.method === 'GET' && url.pathname === '/transactions') {
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    let records = user.records.filter(
      (record) =>
        (!url.searchParams.get('startDate') ||
          record.date >= url.searchParams.get('startDate')) &&
        (!url.searchParams.get('endDate') ||
          record.date <= url.searchParams.get('endDate')) &&
        ['type', 'accountId', 'categoryId'].every(
          (field) =>
            !url.searchParams.get(field) ||
            String(record[field]) === url.searchParams.get(field),
        ),
    )
    records = records.toSorted(
      (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
    )
    const totalElements = records.length
    const totalPages = Math.ceil(totalElements / size)
    return send(200, {
      content: records.slice(page * size, (page + 1) * size),
      number: page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    })
  }
  const match = /^\/transactions\/(\d+)$/.exec(url.pathname)
  const record = match
    ? user.records.find((item) => item.id === Number(match[1]))
    : null
  if (match && !record) return send(404, { detail: 'Transaction not found' })
  if (match && request.method === 'GET') return send(200, record)
  if (match && request.method === 'DELETE') {
    user.records = user.records.filter((item) => item.id !== record.id)
    return send(204)
  }
  if (
    (url.pathname === '/transactions' && request.method === 'POST') ||
    (match && request.method === 'PUT')
  ) {
    const category = user.categories.find(
      (item) => item.id === body.categoryId && item.type === body.type,
    )
    if (
      !category ||
      body.accountId !== user.account.id ||
      !(body.amount > 0) ||
      !body.description?.trim()
    )
      return send(400, { detail: 'Dados inválidos.' })
    const key = request.headers['idempotency-key']
    if (request.method === 'POST' && key && user.keys.has(key)) {
      const cached = user.keys.get(key)
      if (cached.body !== JSON.stringify(body))
        return send(409, { detail: 'Idempotency conflict' })
      return send(201, cached.response)
    }
    const fields = {
      ...body,
      accountName: user.account.name,
      categoryName: category.name,
    }
    if (record) {
      Object.assign(record, fields)
      return send(200, record)
    }
    const created = {
      ...fields,
      id: user.next++,
      installment: false,
      installmentNumber: null,
      totalInstallments: null,
      installmentGroupId: null,
      createdAt: '2026-11-05T12:00:00',
    }
    user.records.push(created)
    const result = { transaction: created, analysis: { riskDetected: false } }
    if (key)
      user.keys.set(key, {
        body: JSON.stringify(body),
        response: structuredClone(result),
      })
    return send(201, result)
  }
  if (
    request.method === 'GET' &&
    url.pathname === '/dashboard/monthly-summary'
  ) {
    const month = url.searchParams.get('month')
    const days = new Date(`${month}-01T12:00:00Z`)
    days.setUTCMonth(days.getUTCMonth() + 1, 0)
    const count = days.getUTCDate()
    const records = user.records.filter((item) => item.date.startsWith(month))
    const cents = (value) => BigInt(value.toFixed(2).replace('.', ''))
    const sum = (items) =>
      Number(items.reduce((total, item) => total + cents(item.amount), 0n)) /
      100
    const totalIncome = sum(records.filter((item) => item.type === 'INCOME'))
    const totalExpense = sum(records.filter((item) => item.type === 'EXPENSE'))
    return send(200, {
      month,
      startDate: `${month}-01`,
      endDate: `${month}-${count}`,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: records.length,
      daily: Array.from({ length: count }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, '0')}`
        const filtered = records.filter((item) => item.date === date)
        return {
          date,
          totalIncome: sum(filtered.filter((item) => item.type === 'INCOME')),
          totalExpense: sum(filtered.filter((item) => item.type === 'EXPENSE')),
        }
      }),
      expensesByCategory: user.categories
        .filter((item) => item.type === 'EXPENSE')
        .map((category) => ({
          categoryId: category.id,
          categoryName: category.name,
          totalExpense: sum(
            records.filter((item) => item.categoryId === category.id),
          ),
        }))
        .filter((item) => item.totalExpense > 0),
    })
  }
  send(404, {})
})
server.listen(Number(process.env.FIXTURE_PORT ?? 3997), '127.0.0.1')
