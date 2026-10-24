import { test, expect } from '@playwright/test'

test('troca os exemplos sem enviar dados para a API', async ({ page }) => {
  const mutations: string[] = []
  page.on('request', (request) => {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) &&
      !new URL(request.url()).pathname.startsWith('/__tsd/')
    )
      mutations.push(request.url())
  })
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  const demo = page.locator('.hero-demo')
  await demo.getByRole('button', { name: 'Transporte', exact: true }).click()
  await demo
    .getByRole('button', { name: 'Enviar exemplo', exact: true })
    .click()
  await expect(demo.getByText('R$ 24,00', { exact: true })).toBeVisible()
  await expect(
    demo.getByRole('button', { name: 'Transporte', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await demo.getByRole('button', { name: 'Recebimento', exact: true }).click()
  await demo
    .getByRole('button', { name: 'Enviar exemplo', exact: true })
    .click()
  await expect(demo.getByText('R$ 500,00', { exact: true })).toBeVisible()
  expect(mutations).toEqual([])
})

test('demonstração funciona pelo teclado e reduz movimento', async ({
  page,
}, testInfo) => {
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  const control = page.getByRole('button', { name: 'Transporte', exact: true })
  await expect(control).toBeEnabled()
  await control.focus()
  await page.keyboard.press('Enter')
  const send = page.getByRole('button', { name: 'Enviar exemplo', exact: true })
  await send.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.locator('.hero-demo').getByText('R$ 24,00', { exact: true }),
  ).toBeVisible()
  if (testInfo.project.name === 'reduced-motion') {
    await expect(control).toHaveCSS('transition-duration', '0s')
  }
})

test('rolagem contínua mantém conteúdo e seleção da demonstração', async ({
  page,
}) => {
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Recebimento', exact: true }).click()
  await page
    .getByRole('button', { name: 'Enviar exemplo', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'Linguagem natural', exact: true })
    .scrollIntoViewIfNeeded()
  await expect(
    page.getByRole('heading', {
      name: 'Seus registros organizados',
      exact: true,
    }),
  ).toBeAttached()
  await expect(
    page.getByRole('heading', { name: 'Setup simples', exact: true }),
  ).toBeAttached()
  await page
    .getByRole('heading', { name: 'Como funciona', exact: true })
    .scrollIntoViewIfNeeded()
  await expect(
    page.getByRole('heading', { name: 'Conecte o Telegram', exact: true }),
  ).toBeVisible()
  await page.locator('.hero-demo').scrollIntoViewIfNeeded()
  await expect(
    page.locator('.hero-demo').getByText('R$ 500,00', { exact: true }),
  ).toBeVisible()
  expect(
    await page
      .locator('.landing')
      .evaluate((element) =>
        [...element.querySelectorAll('[data-reveal]')].some(
          (node) => getComputedStyle(node).position === 'sticky',
        ),
      ),
  ).toBe(false)
})

test('layout, temas e destinos de navegação', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await expect(
    page.getByRole('link', { name: 'Criar minha conta' }).first(),
  ).toHaveAttribute('href', '/cadastro')
  await expect(
    page.getByRole('link', { name: 'Entrar', exact: false }).first(),
  ).toHaveAttribute('href', '/login')
  await page.screenshot({
    path: `test-results/landing-${testInfo.project.name}-light.png`,
    fullPage: true,
    caret: 'initial',
  })
  const feature = page.locator('.feature-card').first()
  await expect(feature).not.toHaveCSS('box-shadow', 'none')
  if (testInfo.project.name === 'desktop') {
    await expect(
      page.getByRole('button', { name: 'Ativar tema escuro' }),
    ).toBeEnabled()
    await expect(feature).toHaveAttribute(
      'data-motion-state',
      /outside|transitioning|visible/,
    )
    await feature.evaluate((element) => {
      let top = 0
      let node: HTMLElement | null = element as HTMLElement
      while (node) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      window.scrollTo({ top: top - innerHeight / 3, behavior: 'instant' })
    })
    await expect(feature).toHaveAttribute('data-motion-state', 'visible')
    await page.mouse.move(0, 0)
    await feature.hover({ position: { x: 40, y: 40 } })
    await expect
      .poll(async () =>
        feature.evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue('--card-tilt-x'),
        ),
      )
      .not.toBe('')
    await page.mouse.move(0, 0)
    await expect
      .poll(async () =>
        feature.evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue('--card-tilt-x'),
        ),
      )
      .toBe('')
  }
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: `test-results/landing-${testInfo.project.name}-dark.png`,
    fullPage: true,
    caret: 'initial',
  })
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(errors).toEqual([])
})

test('demonstração aparece ao rolar e repete entrada e saída', async ({
  page,
}, testInfo) => {
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: 'Mercado', exact: true }),
  ).toBeEnabled()
  const demo = page.locator('.hero-demo')
  expect(
    await demo.evaluate(
      (element) => element.getBoundingClientRect().top >= innerHeight,
    ),
  ).toBe(true)
  if (testInfo.project.name !== 'reduced-motion') {
    await expect(demo).toHaveAttribute('data-motion-state', 'outside')
    await expect(demo).toHaveCSS('opacity', '0')
    await demo.evaluate((element) =>
      window.scrollTo({
        top:
          window.scrollY +
          element.getBoundingClientRect().top -
          innerHeight +
          80,
        behavior: 'instant',
      }),
    )
    await expect(demo).toHaveAttribute('data-motion-state', 'transitioning')
    // Com o topo do bloco a 62% da janela, a entrada ainda deve estar em curso.
    await demo.evaluate((element) =>
      window.scrollTo({
        top:
          window.scrollY +
          element.getBoundingClientRect().top -
          innerHeight * 0.62,
        behavior: 'instant',
      }),
    )
    await expect(demo).toHaveAttribute('data-motion-state', 'transitioning')
    await expect
      .poll(async () =>
        Number(
          await demo.evaluate((element) => getComputedStyle(element).opacity),
        ),
      )
      .toBeLessThan(0.85)
    expect(
      Number(
        await demo.evaluate((element) => getComputedStyle(element).opacity),
      ),
    ).toBeGreaterThan(0.1)
    await demo.evaluate((element) =>
      window.scrollTo({
        top: (element as HTMLElement).offsetTop - 40,
        behavior: 'instant',
      }),
    )
    await expect(demo).toHaveAttribute('data-motion-state', 'visible')
    await demo.evaluate((element) =>
      window.scrollTo({
        top:
          (element as HTMLElement).offsetTop +
          (element as HTMLElement).offsetHeight -
          60,
        behavior: 'instant',
      }),
    )
    await expect(demo).toHaveAttribute('data-motion-state', 'transitioning')
    await demo.evaluate((element) =>
      window.scrollTo({
        top: (element as HTMLElement).offsetTop - 40,
        behavior: 'instant',
      }),
    )
    await expect(demo).toHaveAttribute('data-motion-state', 'visible')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(demo).toHaveAttribute('data-motion-state', 'reduced')
  await expect(demo).toHaveCSS('opacity', '1')
  await expect(demo).toHaveCSS('transform', 'none')
})

test('personaliza valor, envia e limpa a simulação', async ({ page }) => {
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  const slider = page.getByRole('slider', { name: 'Valor do exemplo' })
  await slider.fill('150')
  await expect(
    page.getByText('Gastei 150 no mercado', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Da conversa ao controle.', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Enviar exemplo', exact: true })
    .click()
  await expect(
    page.locator('.hero-demo').getByText('R$ 150,00', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Limpar simulação', exact: true })
    .click()
  await expect(
    page.getByText('Da conversa ao controle.', { exact: true }),
  ).toBeVisible()
  await expect(slider).toHaveValue('85')
  await expect(
    page.locator('.hero-demo').getByText('R$ 150,00', { exact: true }),
  ).toHaveCount(0)
})

test('arrastar mensagem envia exemplo no desktop', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Gesto de mouse no desktop; controles equivalentes cobrem celular e movimento reduzido.',
  )
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  const message = page.getByRole('button', {
    name: 'Enviar exemplo: Gastei 85 no mercado',
  })
  await expect(message).toBeEnabled()
  await page
    .locator('.hero-demo')
    .evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    )
  await expect(page.locator('.hero-demo')).toHaveAttribute(
    'data-motion-state',
    'visible',
  )
  const box = await message.boundingBox()
  if (!box) throw new Error('Mensagem fora do layout')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, {
    steps: 12,
  })
  await page.mouse.up()
  await expect(
    page.locator('.hero-demo').getByText('R$ 85,00', { exact: true }),
  ).toBeVisible()
})

test('atalho da abertura centraliza a demonstração', async ({ page }) => {
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: 'Mercado', exact: true }),
  ).toBeEnabled()
  await page
    .getByRole('link', { name: 'Experimente uma conversa abaixo' })
    .click()
  await expect
    .poll(async () =>
      page.locator('.hero-demo').evaluate((element) => {
        const box = element.getBoundingClientRect()
        const expectedTop = Math.max(
          24,
          (innerHeight - (element as HTMLElement).offsetHeight) / 2,
        )
        return Math.abs(box.top - expectedTop)
      }),
    )
    .toBeLessThan(4)
})

test('explora recursos pelo teclado e abre dúvidas', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const tabs = page.getByRole('tablist', { name: 'Recursos do Finance Bot' })
  await tabs.getByRole('tab', { name: 'Parcelas', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText(
    'Consulta de parcelas ativas',
  )
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: 'Lembretes' })).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText(
    'Resumos semanais e mensais',
  )
  await expect(page.getByRole('tabpanel')).toContainText(
    'Me lembre dia 10 de pagar a fatura do cartão.',
  )
  await page.keyboard.press('Home')
  await expect(page.getByRole('tabpanel')).toContainText(
    'Totais de despesas e receitas do mês',
  )
  const question = page.locator('summary', {
    hasText: 'Como meus dados financeiros são protegidos?',
  })
  await question.click()
  await expect(page.locator('details[open]')).toContainText(
    'separa os registros por usuário',
  )
  await expect(page.locator('details[open]')).toContainText(
    'A criptografia ainda não abrange todos os dados financeiros',
  )
})

test('troca tema com transição e mantém alternativa sem View Transitions', async ({
  page,
}, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(
    page.getByRole('button', { name: 'Ativar tema claro' }),
  ).toBeEnabled()
  await expect(page.locator('html')).not.toHaveClass(/theme-reveal-active/)
  if (testInfo.project.name === 'reduced-motion') {
    expect(
      await page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement === '::view-transition-new(root)',
          ),
      ),
    ).toBe(false)
  }
  await page.evaluate(() =>
    Object.defineProperty(document, 'startViewTransition', {
      value: undefined,
      configurable: true,
    }),
  )
  await page.getByRole('button', { name: 'Ativar tema claro' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(
    page.getByRole('button', { name: 'Ativar tema escuro' }),
  ).toBeEnabled()
})
