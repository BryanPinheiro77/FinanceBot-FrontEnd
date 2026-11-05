import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function login(page: Page) {
  const response = await page.request.post('/api/financebot/auth/login', {
    headers: { Origin: 'http://127.0.0.1:3111', 'X-FinanceBot-CSRF': '1' },
    data: {
      email: `${randomUUID()}@example.invalid`,
      password: 'fixture-password',
    },
  })
  expect(response.status()).toBe(200)
  await page.goto('/transactions')
  await expect(
    page.getByText('21 transações encontradas', { exact: true }),
  ).toBeVisible({ timeout: 20_000 })
  return (await (
    await page.request.get('/api/financebot/users/me')
  ).json()) as { id: number }
}

async function fillCreate(page: Page, description = 'Registro novo de teste') {
  await page
    .getByRole('button', { name: 'Nova transação', exact: true })
    .click()
  await page.getByLabel('Descrição', { exact: true }).fill(description)
  await page.getByLabel(/^Valor \(R\$\)/).fill('0,29')
  await page
    .getByLabel('Data do lançamento', { exact: true })
    .fill('2026-11-30')
  await page
    .getByRole('combobox', { name: 'Categoria', exact: true })
    .selectOption({ label: 'Alimentação' })
}

const save = (page: Page) =>
  page.getByRole('button', { name: 'Salvar transação', exact: true }).click()

test('lista, paginação, filtros e URL funcionam em celular e desktop', async ({
  page,
}, info) => {
  const user = await login(page)
  await page.getByRole('combobox', { name: /Por página/ }).selectOption('10')
  await expect(page.getByText('Página 1 de 3', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: info.outputPath('transactions-light.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click()
  const contrast = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const rgb = Array.from(context.getImageData(0, 0, 1, 1).data)
        .slice(0, 3)
        .map((value) => {
          const srgb = value / 255
          return srgb <= 0.04045
            ? srgb / 12.92
            : ((srgb + 0.055) / 1.055) ** 2.4
        })
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    }
    return [
      ['.transaction-origin', '.transaction-records'],
      ['.finance-nav a[aria-current]', '.dashboard-header'],
      [
        '.transactions-heading-actions button:last-child',
        '.transactions-heading-actions button:last-child',
      ],
    ].map(([foreground, background]) => {
      const a = luminance(
        getComputedStyle(document.querySelector(foreground)!).color,
      )
      const b = luminance(
        getComputedStyle(document.querySelector(background)!).backgroundColor,
      )
      return {
        selector: foreground,
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      }
    })
  })
  for (const result of contrast)
    expect(result.ratio, result.selector).toBeGreaterThanOrEqual(4.5)
  await page.screenshot({
    path: info.outputPath('transactions-dark.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page.getByText('Página 2 de 3', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Página 2 de 3', { exact: true })).toBeVisible()
  await page.getByLabel('Data inicial', { exact: true }).fill('2026-11-01')
  await page.getByLabel('Data final', { exact: true }).fill('2026-11-30')
  await page
    .getByRole('combobox', { name: 'Tipo de transação', exact: true })
    .selectOption('INCOME')
  await page
    .getByRole('combobox', { name: 'Filtrar por conta', exact: true })
    .selectOption(String(user.id * 10))
  await page
    .getByRole('combobox', { name: 'Filtrar por categoria', exact: true })
    .selectOption({ label: 'Salário' })
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url().includes('/api/financebot/transactions?') &&
      request.url().includes('type=INCOME'),
  )
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  const query = new URL((await requestPromise).url()).searchParams
  expect(query.get('page')).toBe('0')
  expect(query.get('accountId')).toBe(String(user.id * 10))
  expect(query.get('categoryId')).toBe(String(user.id * 10 + 3))
  expect(query.getAll('sort')).toEqual(['date,desc', 'id,desc'])
  await expect(
    page.getByText('1 transação encontrada', { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Tipo de transação', exact: true }),
  ).toHaveValue('INCOME')
  await expect(
    page.getByText('1 transação encontrada', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(
    page.getByText('21 transações encontradas', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Data inicial', { exact: true }).fill('2027-01-01')
  await page.getByLabel('Data final', { exact: true }).fill('2027-01-31')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(
    page.getByRole('heading', { name: 'Nenhuma transação encontrada' }),
  ).toBeVisible()
  await expect(
    page.getByText('0 transações encontradas', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Próxima página' }),
  ).toBeDisabled()
})

test('cria com centavos, atualiza dashboard e abre a lista pelo período selecionado', async ({
  page,
}) => {
  await login(page)
  const before = await (
    await page.request.get(
      '/api/financebot/dashboard/monthly-summary?month=2026-11',
    )
  ).json()
  await fillCreate(page)
  const posted = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/financebot/transactions') &&
      request.method() === 'POST',
  )
  await save(page)
  const request = await posted
  expect(request.postData()).toContain('"amount":0.29,')
  expect(request.headers()['idempotency-key']).toMatch(/^[a-f0-9-]{36}$/)
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Editar Registro novo de teste',
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Visão geral', exact: true }).click()
  await page.getByLabel('Mês de referência').fill('2026-11')
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(before.totalExpense + 0.29)
  await expect(
    page
      .locator('.dashboard-metrics > div')
      .filter({ has: page.getByText('Despesas do mês', { exact: true }) }),
  ).toContainText(formatted)
  await page.getByRole('link', { name: 'Transações', exact: true }).click()
  await expect(page.getByLabel('Data inicial', { exact: true })).toHaveValue(
    '2026-11-01',
  )
  await expect(page.getByLabel('Data final', { exact: true })).toHaveValue(
    '2026-11-30',
  )
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
})

test('edita uma parcela preservando origem Telegram e seus metadados', async ({
  page,
}) => {
  await login(page)
  await page
    .getByRole('button', { name: 'Editar Parcela de teste', exact: true })
    .click()
  await expect(
    page.getByText(/A edição afeta somente este lançamento/),
  ).toBeVisible()
  await page.getByLabel('Descrição', { exact: true }).fill('Parcela ajustada')
  await page.getByLabel(/^Valor \(R\$\)/).fill('1200,01')
  const posted = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      /\/api\/financebot\/transactions\/\d+$/.test(request.url()),
  )
  await save(page)
  expect((await posted).postDataJSON()).toMatchObject({
    amount: 1200.01,
    sourceType: 'BOT_AUDIO',
  })
  await expect(
    page.getByRole('button', { name: 'Editar Parcela ajustada', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.transaction-records')).toContainText(
    'Telegram · áudio · Parcela 2/3',
  )
})

test('exclusão exige confirmação e recua de página quando o último item é removido', async ({
  page,
}) => {
  await login(page)
  await page.getByRole('combobox', { name: /Por página/ }).selectOption('10')
  await expect(page.getByText('Página 1 de 3', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page.getByText('Página 2 de 3', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page.getByText('Página 3 de 3', { exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: 'Excluir Mercado de teste 01', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toContainText(
    'Esta ação não pode ser desfeita',
  )
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(
    page.getByText('21 transações encontradas', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Excluir Mercado de teste 01', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Confirmar exclusão', exact: true })
    .click()
  await expect(
    page.getByText('20 transações encontradas', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Página 2 de 2', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Transações', exact: true }),
  ).toBeFocused()
})

test('falha de criação após commit reutiliza chave e corpo sem duplicar', async ({
  page,
}) => {
  await login(page)
  const attempts: { key: string; body: string | null }[] = []
  await page.route('**/api/financebot/transactions', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    attempts.push({
      key: route.request().headers()['idempotency-key'],
      body: route.request().postData(),
    })
    if (attempts.length === 1) {
      await route.fetch()
      await route.fulfill({
        status: 503,
        json: { detail: 'Resposta perdida.' },
      })
    } else await route.continue()
  })
  await fillCreate(page, 'Confirmação repetida')
  await save(page)
  await expect(page.getByLabel('Descrição', { exact: true })).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText(
    'Não confirmamos se o lançamento foi criado',
  )
  await page.getByRole('button', { name: 'Tentar confirmar novamente' }).click()
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
  expect(attempts).toHaveLength(2)
  expect(attempts[0]).toEqual(attempts[1])
})

test('expiração da janela de retry exige conferência sem nova criação', async ({
  page,
}) => {
  await login(page)
  await page.clock.install()
  let posts = 0
  await page.route('**/api/financebot/transactions', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    posts++
    await route.fetch()
    await route.fulfill({ status: 503, json: { detail: 'Resposta perdida.' } })
  })
  await fillCreate(page, 'Conferir antes de repetir')
  await save(page)
  await expect(
    page.getByRole('button', { name: 'Tentar confirmar novamente' }),
  ).toBeEnabled()
  await page.clock.fastForward(46_000)
  await expect(page.getByRole('alert')).toContainText(
    'A janela segura de reenvio terminou',
  )
  await expect(
    page.getByRole('button', { name: 'Salvar transação', exact: true }),
  ).toBeDisabled()
  expect(posts).toBe(1)
  await page.getByRole('button', { name: 'Conferir lançamentos' }).click()
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
})

test('valida campos e período sem enviar valores fracionários ou requisições inválidas', async ({
  page,
}) => {
  await login(page)
  await page.getByLabel('Data inicial', { exact: true }).fill('2026-12-01')
  await page.getByLabel('Data final', { exact: true }).fill('2026-11-01')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'A data inicial deve ser anterior',
  )
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  let posts = 0
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().endsWith('/api/financebot/transactions')
    )
      posts++
  })
  await fillCreate(page)
  await page.getByLabel(/^Valor \(R\$\)/).fill('1,001')
  await save(page)
  await expect(page.getByRole('alert')).toContainText('até duas casas decimais')
  expect(posts).toBe(0)
  await page.getByLabel(/^Valor \(R\$\)/).fill('0,29')
  await page
    .getByRole('combobox', { name: 'Tipo', exact: true })
    .selectOption('INCOME')
  await expect(
    page.getByRole('combobox', { name: 'Categoria', exact: true }),
  ).toHaveValue('')
  await page
    .getByRole('combobox', { name: 'Categoria', exact: true })
    .selectOption({ label: 'Salário' })
  await save(page)
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
  expect(posts).toBe(1)
})

test('falha de consulta oferece retry e resposta atrasada não sobrescreve filtro atual', async ({
  page,
}) => {
  let fail = true
  await page.route('**/api/financebot/transactions?*', (route) =>
    fail
      ? route.fulfill({ status: 503, json: { detail: 'Indisponível' } })
      : route.continue(),
  )
  const response = await page.request.post('/api/financebot/auth/login', {
    headers: { Origin: 'http://127.0.0.1:3111', 'X-FinanceBot-CSRF': '1' },
    data: {
      email: `${randomUUID()}@example.invalid`,
      password: 'fixture-password',
    },
  })
  expect(response.status()).toBe(200)
  await page.goto('/transactions')
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar as transações',
  )
  await expect(page.locator('.transaction-list-meta')).toHaveCount(0)
  fail = false
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await expect(
    page.getByText('21 transações encontradas', { exact: true }),
  ).toBeVisible()
  await page.unroute('**/api/financebot/transactions?*')
  let release = () => {}
  let started = () => {}
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  const intercepted = new Promise<void>((resolve) => {
    started = resolve
  })
  await page.route(
    '**/api/financebot/transactions?*type=EXPENSE*',
    async (route) => {
      const result = await route.fetch()
      started()
      await wait
      await route.fulfill({ response: result }).catch(() => undefined)
    },
  )
  await page
    .getByRole('combobox', { name: 'Tipo de transação', exact: true })
    .selectOption('EXPENSE')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await intercepted
  await expect(
    page.getByText('Carregando transações…', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.transaction-records')).toHaveCount(0)
  await page
    .getByRole('combobox', { name: 'Tipo de transação', exact: true })
    .selectOption('INCOME')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(
    page.getByText('1 transação encontrada', { exact: true }),
  ).toBeVisible()
  release()
  await expect(
    page.getByText('1 transação encontrada', { exact: true }),
  ).toBeVisible()
})

test('sessão expirada remove a lista e novo usuário não recebe os dados anteriores', async ({
  page,
}) => {
  await login(page)
  await fillCreate(page, 'Somente da primeira pessoa')
  await save(page)
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
  const before = await (
    await page.request.get(
      '/api/financebot/transactions?page=0&size=20&sort=id,desc',
    )
  ).json()
  const privateId = before.content.find(
    (item: { description: string }) =>
      item.description === 'Somente da primeira pessoa',
  ).id
  await page.context().clearCookies()
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
  await expect(page).toHaveURL(/\/login(?:\?|$)/)
  await expect(page.locator('.transaction-records')).toHaveCount(0)
  await login(page)
  await expect(
    page.getByRole('button', {
      name: 'Editar Somente da primeira pessoa',
      exact: true,
    }),
  ).toHaveCount(0)
  expect(
    (
      await page.request.get(`/api/financebot/transactions/${privateId}`)
    ).status(),
  ).toBe(404)
  expect(
    (
      await page.request.put(`/api/financebot/transactions/${privateId}`, {
        headers: { Origin: 'http://127.0.0.1:3111', 'X-FinanceBot-CSRF': '1' },
        data: { amount: 1 },
      })
    ).status(),
  ).toBe(404)
  expect(
    (
      await page.request.delete(`/api/financebot/transactions/${privateId}`, {
        headers: { Origin: 'http://127.0.0.1:3111', 'X-FinanceBot-CSRF': '1' },
      })
    ).status(),
  ).toBe(404)
})

test('validação do servidor mantém o formulário e permite corrigir a criação', async ({
  page,
}) => {
  await login(page)
  const keys: string[] = []
  await page.route('**/api/financebot/transactions', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    keys.push(route.request().headers()['idempotency-key'])
    if (keys.length === 1)
      await route.fulfill({
        status: 400,
        json: { detail: 'Categoria incompatível.' },
      })
    else await route.continue()
  })
  await fillCreate(page, 'Corrigir lançamento')
  await save(page)
  await expect(page.getByRole('alert')).toContainText('Confira os campos')
  await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue(
    'Corrigir lançamento',
  )
  await expect(page.getByLabel('Descrição', { exact: true })).toBeEnabled()
  await page.getByLabel(/^Valor \(R\$\)/).fill('1,23')
  await save(page)
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
  expect(keys).toHaveLength(2)
  expect(keys[0]).not.toBe(keys[1])
})

test('exclusão com resposta perdida exige conferir lista sem repetição automática', async ({
  page,
}) => {
  await login(page)
  let deletions = 0
  await page.route('**/api/financebot/transactions/*', async (route) => {
    if (route.request().method() !== 'DELETE') return route.continue()
    deletions++
    await route.fetch()
    await route.fulfill({ status: 503, json: { detail: 'Resposta perdida.' } })
  })
  await page
    .getByRole('button', { name: 'Excluir Parcela de teste', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toContainText(
    'Somente esta parcela será excluída',
  )
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(page.getByRole('alertdialog').getByRole('alert')).toContainText(
    'Não foi possível confirmar a exclusão',
  )
  expect(deletions).toBe(1)
  await page
    .getByRole('button', { name: 'Conferir lista', exact: true })
    .click()
  await expect(
    page.getByText('20 transações encontradas', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Excluir Parcela de teste', exact: true }),
  ).toHaveCount(0)
  expect(deletions).toBe(1)
})

test('criação renova sessão e preserva corpo e chave sem duplicar', async ({
  page,
}) => {
  await login(page)
  const attempts: { key: string; body: string | null }[] = []
  await page.route('**/api/financebot/transactions', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    attempts.push({
      key: route.request().headers()['idempotency-key'],
      body: route.request().postData(),
    })
    if (attempts.length === 1)
      return route.fulfill({
        status: 401,
        headers: { 'X-FinanceBot-Session-Renewable': '1' },
        json: { detail: 'Renove a sessão.' },
      })
    return route.continue()
  })
  await fillCreate(page, 'Criação com renovação')
  const renewed = page.waitForResponse('**/api/financebot/auth/refresh')
  await save(page)
  expect((await renewed).status()).toBe(200)
  await expect(
    page.getByText('22 transações encontradas', { exact: true }),
  ).toBeVisible()
  expect(attempts).toHaveLength(2)
  expect(attempts[0]).toEqual(attempts[1])
})
