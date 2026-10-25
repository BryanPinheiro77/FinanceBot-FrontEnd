import { expect, test } from '@playwright/test'

test('login, recarga e logout usam cookie HttpOnly e removem o token antigo', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('fixture.seeded')) {
      localStorage.setItem('financebot.auth.token', 'legacy-fixture-token')
      sessionStorage.setItem('fixture.seeded', '1')
    }
  })
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeEnabled()
  await page.getByPlaceholder('joao@email.com').fill('session@example.invalid')
  await page.getByPlaceholder('Sua senha').fill('fixture-password')
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/financebot/auth/login') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const response = await responsePromise
  expect(await response.json()).toEqual({ authenticated: true })
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeVisible()
  let cookies = await context.cookies()
  expect(
    cookies.find((cookie) => cookie.name === 'financebot.session'),
  ).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' })
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'financebot.session',
  )
  expect(
    await page.evaluate(() => localStorage.getItem('financebot.auth.token')),
  ).toBeNull()
  expect(
    await page.evaluate(() => Object.values(sessionStorage).join('')),
  ).not.toContain('eyJ')
  await page.reload()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  cookies = await context.cookies()
  expect(cookies.some((cookie) => cookie.name === 'financebot.session')).toBe(
    false,
  )
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('cadastro também cria cookie e não devolve JWT no JSON', async ({
  request,
}) => {
  const response = await request.post('/api/financebot/auth/register', {
    headers: { Origin: 'http://127.0.0.1:3109', 'X-FinanceBot-CSRF': '1' },
    data: {
      name: 'Pessoa de teste',
      email: 'session@example.invalid',
      password: 'fixture-password',
    },
  })
  expect(response.status()).toBe(201)
  expect(await response.json()).toEqual({ authenticated: true })
  expect(response.headers()['set-cookie']).toContain('HttpOnly')
})

test('bloqueia CSRF e acesso interno pelo proxy', async ({ request }) => {
  const candidates: Array<Record<string, string>> = [
    { Origin: 'https://attacker.invalid', 'X-FinanceBot-CSRF': '1' },
    { Origin: 'http://127.0.0.1:3109' },
  ]
  for (const headers of candidates) {
    const response = await request.post('/api/financebot/auth/login', {
      headers,
      data: { email: 'session@example.invalid', password: 'fixture-password' },
    })
    expect(response.status()).toBe(403)
    expect(response.headers()['set-cookie']).toBeUndefined()
  }
  expect((await request.get('/api/financebot/actuator/env')).status()).toBe(404)
  expect(
    (await request.get('/api/financebot/telegram/users/me')).status(),
  ).toBe(404)
})

test('sessões de dois navegadores não compartilham identidade', async ({
  playwright,
}) => {
  const first = await playwright.request.newContext({
    baseURL: 'http://127.0.0.1:3109',
  })
  const second = await playwright.request.newContext({
    baseURL: 'http://127.0.0.1:3109',
  })
  try {
    for (const [client, email] of [
      [first, 'first@example.invalid'],
      [second, 'second@example.invalid'],
    ] as const) {
      const login = await client.post('/api/financebot/auth/login', {
        headers: { Origin: 'http://127.0.0.1:3109', 'X-FinanceBot-CSRF': '1' },
        data: { email, password: 'fixture-password' },
      })
      expect(login.status()).toBe(200)
    }
    expect(
      (await (await first.get('/api/financebot/users/me')).json()).email,
    ).toBe('first@example.invalid')
    expect(
      (await (await second.get('/api/financebot/users/me')).json()).email,
    ).toBe('second@example.invalid')
  } finally {
    await first.dispose()
    await second.dispose()
  }
})
