import { test, expect } from '@playwright/test'

test('cena acompanha digitação, envio, categorias e resumo ao rolar', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'reduced-motion',
    'Movimento reduzido usa navegação manual, validada em outro teste.',
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const story = page.getByRole('region', {
    name: 'Uma mensagem se transforma em organização financeira',
  })
  await expect(story.getByRole('button', { name: '1 Mensagem' })).toBeEnabled()
  const go = async (position: number) => {
    await story.evaluate((element, progress) => {
      let top = 0
      let node: HTMLElement | null = element as HTMLElement
      while (node) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      window.scrollTo({
        top:
          top +
          ((element as HTMLElement).offsetHeight - innerHeight) * progress,
        behavior: 'instant',
      })
    }, position)
  }
  await go(0.1)
  await expect(story).toHaveAttribute('data-chapter', '0')
  await expect
    .poll(
      async () =>
        (await story.locator('.story-composer > span').innerText()).length,
    )
    .toBeGreaterThan(2)
  await expect(story.locator('.story-user-bubble')).toHaveCount(0)
  const typed = await story.locator('.story-composer > span').innerText()
  expect(typed.length).toBeGreaterThan(2)
  expect(typed.length).toBeLessThan('Gastei 85 no mercado'.length)
  await go(0.44)
  await expect(story).toHaveAttribute('data-chapter', '1')
  await expect(story.locator('.story-paper')).toHaveCSS('opacity', '1')
  await expect(story.locator('.story-copy > p')).toHaveText(
    'O gasto vira um registro com valor, descrição e categoria.',
  )
  await expect(story.locator('.story-user-bubble')).toHaveCSS('opacity', '1')
  await go(0.68)
  await expect(story).toHaveAttribute('data-chapter', '2')
  await expect(story.locator('.story-categories')).toHaveCSS('opacity', '1')
  await go(0.96)
  await expect(story).toHaveAttribute('data-chapter', '3')
  await expect(story.locator('.story-overview')).toHaveCSS('opacity', '1')
  await expect(story.locator('.story-copy > p')).toContainText(
    'Veja suas entradas e saídas do mês',
  )
  await expect(story.locator('.story-copy > p')).not.toContainText('câmera')
  await expect(story.locator('.story-phone')).toHaveCSS('opacity', '1')
  await expect(story.locator('.story-categories')).toHaveCSS('opacity', '0')
  await expect(story.locator('.story-user-bubble')).toHaveCSS('opacity', '1')
  await go(0.1)
  await expect(story).toHaveAttribute('data-chapter', '0')
  await expect(story.locator('.story-overview')).toHaveCSS('opacity', '0')
  await expect(story.locator('.story-user-bubble')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('etapas acessíveis e alternativa com movimento reduzido', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const story = page.getByRole('region', {
    name: 'Uma mensagem se transforma em organização financeira',
  })
  await expect(story.locator('.story-stage')).toHaveCSS('position', 'relative')
  const summary = story.getByRole('button', { name: '4 Visão do mês' })
  await expect(summary).toBeEnabled()
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(story).toHaveAttribute('data-chapter', '3')
  await expect(
    story.getByRole('heading', { name: 'O dia a dia vira perspectiva.' }),
  ).toBeVisible()
  await story.getByRole('button', { name: '1 Mensagem' }).click()
  await expect(story).toHaveAttribute('data-chapter', '0')
})

test('link de comparação mantém a landing aprovada sem a nova cena', async ({
  page,
}) => {
  await page.goto('/?animacao=off', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.finance-story')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page
    .getByRole('link', { name: 'Experimente uma conversa abaixo' })
    .click()
  await page
    .getByRole('button', { name: 'Enviar exemplo', exact: true })
    .click()
  await expect(page.getByText('R$ 85,00', { exact: true })).toBeVisible()
})

test('botões percorrem as etapas devagar e permitem interromper', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'reduced-motion',
    'A preferência de movimento reduzido preserva a troca imediata.',
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const story = page.locator('.finance-story')
  await expect(story.getByRole('button', { name: '2 Registro' })).toBeEnabled()
  await story.evaluate((element) => {
    let top = 0
    let node: HTMLElement | null = element as HTMLElement
    while (node) {
      top += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    window.scrollTo({
      top: top + ((element as HTMLElement).offsetHeight - innerHeight) * 0.1,
      behavior: 'instant',
    })
  })
  await expect(story).toHaveAttribute('data-chapter', '0')
  const started = Date.now()
  await story.getByRole('button', { name: '2 Registro' }).click()
  await expect(story).toHaveAttribute('data-playing', 'true')
  await expect(story).toHaveAttribute('data-playing', 'false', {
    timeout: 12000,
  })
  expect(Date.now() - started).toBeGreaterThan(3500)
  await expect(story).toHaveAttribute('data-chapter', '1')
  await expect(story.locator('.story-paper')).toHaveCSS('opacity', '1')
  await story.getByRole('button', { name: '4 Visão do mês' }).click()
  await expect(story).toHaveAttribute('data-playing', 'true')
  await story.getByRole('button', { name: 'Pausar percurso' }).click()
  await expect(story).toHaveAttribute('data-playing', 'false')
  await story.getByRole('button', { name: '4 Visão do mês' }).click()
  await expect(story).toHaveAttribute('data-playing', 'true')
  await page.mouse.wheel(0, 120)
  await expect(story).toHaveAttribute('data-playing', 'false')
})

test('landing usa uma única demonstração e o atalho leva à cena', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: '1 Mensagem' })).toBeEnabled()
  await expect(page.locator('.hero-demo')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Enviar exemplo', exact: true }),
  ).toHaveCount(0)
  const shortcut = page.getByRole('link', {
    name: 'Veja a história em movimento',
  })
  await expect(shortcut).toHaveAttribute('href', '#historia-financebot')
  await shortcut.click()
  await expect
    .poll(async () =>
      Math.abs(
        await page
          .locator('.story-stage')
          .evaluate((element) => element.getBoundingClientRect().top),
      ),
    )
    .toBeLessThan(4)
  const explore = page.getByRole('link', { name: 'Explorar recursos' })
  await expect(explore).toHaveAttribute('href', '#recursos')
  await explore.click()
  await expect(
    page.getByRole('heading', { name: 'Linguagem natural', exact: true }),
  ).toBeVisible()
})
