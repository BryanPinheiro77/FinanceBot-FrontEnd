import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function login(page: Page, email = 'first@example.invalid') {
  const result = await page.request.post('/api/financebot/auth/login', {
    headers: { Origin: 'http://127.0.0.1:3110', 'X-FinanceBot-CSRF': '1' },
    data: { email, password: 'fixture-password' },
  })
  expect(result.status()).toBe(200)
  await page.goto('/dashboard')
  await page.getByLabel('Mês de referência').fill('2026-11')
}

const income = (page: Page) =>
  page
    .locator('.dashboard-metrics > div')
    .filter({ has: page.getByText('Receitas do mês', { exact: true }) })

test('cards, gráficos e tabela usam o mês escolhido; funciona por teclado sem overflow', async ({
  page,
}, testInfo) => {
  await login(page)
  await expect(income(page)).toContainText(/1\.200,30/)
  await expect(
    page.getByRole('heading', { name: 'Movimentação do mês' }),
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: /Receitas e despesas diárias/ }),
  ).toBeVisible()
  await expect(page.getByText('Alimentação', { exact: true })).toBeVisible()
  const focus = page.getByText('Ver valores por dia', { exact: true })
  await focus.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(31)
  await expect(page.getByRole('table')).toContainText(/200,30/)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('dashboard-light.png'),
    fullPage: true,
  })
  await focus.press('Enter')
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({
    path: testInfo.outputPath('dashboard-dark.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Mês anterior' }).click()
  await expect(page.getByLabel('Mês de referência')).toHaveValue('2026-10')
  await expect(income(page)).toContainText(/100,00/)
  await expect(income(page)).not.toContainText(/1\.200,30/)
  await page.getByRole('button', { name: 'Próximo mês' }).click()
  await expect(income(page)).toContainText(/1\.200,30/)
})

test('mês vazio informa ausência de lançamentos com valores reais zerados', async ({
  page,
}) => {
  await login(page, 'empty@example.invalid')
  await expect(
    page.getByRole('heading', { name: 'Nenhum lançamento neste mês' }),
  ).toBeVisible()
  await expect(income(page)).toContainText(/0,00/)
  await expect(
    page.getByRole('heading', { name: 'Movimentação do mês' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Abrir o bot no Telegram' }),
  ).toHaveAttribute('href', 'https://t.me/YourFinanceAssistence_Bot')
})

test('falha não mostra zero como dado real e permite tentar novamente', async ({
  page,
}) => {
  let fail = true
  await page.route(
    '**/api/financebot/dashboard/monthly-summary?*',
    async (route) => {
      if (fail)
        await route.fulfill({
          status: 503,
          json: { detail: 'Fixture indisponível' },
        })
      else await route.continue()
    },
  )
  await login(page)
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar',
  )
  await expect(page.locator('.dashboard-metrics')).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(income(page)).toContainText(/1\.200,30/)
})

test('troca rápida de mês oculta dados antigos e ignora resposta atrasada', async ({
  page,
}) => {
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  let started: () => void = () => {}
  const intercept = new Promise<void>((resolve) => {
    started = resolve
  })
  await page.route(
    '**/api/financebot/dashboard/monthly-summary?month=2026-10',
    async (route) => {
      const response = await route.fetch()
      started()
      await pending
      await route.fulfill({ response })
    },
  )
  await login(page)
  await expect(income(page)).toContainText(/1\.200,30/)
  await page.getByRole('button', { name: 'Mês anterior' }).click()
  await intercept
  await expect(page.getByRole('status')).toContainText('Carregando dados')
  await expect(page.locator('.dashboard-metrics')).toHaveCount(0)
  await page.getByRole('button', { name: 'Mês anterior' }).click()
  await expect(page.getByLabel('Mês de referência')).toHaveValue('2026-09')
  await expect(income(page)).toContainText(/100,00/)
  release()
  await expect(page.getByLabel('Mês de referência')).toHaveValue('2026-09')
  await expect(income(page)).toContainText(/100,00/)
})

test('sessão expirada redireciona ao login e remove os dados financeiros', async ({
  page,
}) => {
  await login(page)
  await expect(income(page)).toContainText(/1\.200,30/)
  await page.context().clearCookies()
  await page.getByRole('button', { name: 'Mês anterior' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('.dashboard-metrics')).toHaveCount(0)
})

test('logout e novo login exibem apenas as finanças da nova pessoa', async ({
  page,
}) => {
  await login(page)
  await expect(page.getByText('Alimentação', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await login(page, 'second@example.invalid')
  await expect(income(page)).toContainText(/900,00/)
  await expect(
    page.getByText('Categoria da segunda pessoa', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Alimentação', { exact: true })).toHaveCount(0)
  await expect(page.locator('.dashboard-metrics')).not.toContainText(
    /1\.200,30/,
  )
})
