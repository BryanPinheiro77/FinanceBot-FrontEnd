import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { handleWebApi, sessionCookieName } from './web-api.server'
import type { WebApiOptions } from './web-api.server'

const now = 1_800_000_000_000
const key = Buffer.alloc(32).toString('base64') // Exclusivo da fixture.
const jwt = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ exp: now / 1000 + 86400 })).toString('base64url')}.Zml4dHVyZQ`
const base: WebApiOptions = {
  upstream: 'https://api.example.invalid',
  production: true,
  webOrigin: 'https://web.example.invalid',
  proxySecret: key,
  trustVercelIp: true,
  now: () => now,
}
function request(
  path = '/auth/login',
  method = 'POST',
  extra: Record<string, string> = {},
) {
  return new Request(`https://web.example.invalid/api/financebot${path}`, {
    method,
    headers: {
      Origin: base.webOrigin!,
      'X-FinanceBot-CSRF': '1',
      'x-vercel-forwarded-for': '203.0.113.8',
      ...extra,
    },
  })
}
function options(result = Response.json({ token: jwt, type: 'Bearer' })) {
  return { ...base, fetch: vi.fn<typeof fetch>().mockResolvedValue(result) }
}

describe('sessão web no servidor', () => {
  it('login envia cookie host-only HttpOnly/Secure e omite JWT do JSON', async () => {
    const config = options()
    const response = await handleWebApi(request(), '/auth/login', config)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"authenticated":true}')
    const cookie = response.headers.get('Set-Cookie')!
    expect(cookie).toContain(`__Host-financebot.session=${jwt};`)
    for (const attribute of [
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Secure',
      'Max-Age=28800',
    ])
      expect(cookie).toContain(attribute)
    expect(cookie).not.toContain('Domain=')
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('cadastro também cria sessão sem expor o token', async () => {
    const response = await handleWebApi(
      request('/auth/register'),
      '/auth/register',
      options(Response.json({ token: jwt }, { status: 201 })),
    )
    expect(response.status).toBe(201)
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly')
    expect(await response.text()).not.toContain(jwt)
  })

  it.each([
    'https://attacker.invalid',
    'null',
    'https://web.example.invalid.attacker.invalid',
  ])('bloqueia origem %s antes de chamar a API', async (origin) => {
    const config = options()
    expect(
      (
        await handleWebApi(
          request('/auth/login', 'POST', { Origin: origin }),
          '/auth/login',
          config,
        )
      ).status,
    ).toBe(403)
    expect(config.fetch).not.toHaveBeenCalled()
  })

  it('rejeita falta de Origin ou header de intenção e solicitações de outro site', async () => {
    for (const header of ['Origin', 'X-FinanceBot-CSRF']) {
      const req = request()
      req.headers.delete(header)
      expect((await handleWebApi(req, '/auth/login', options())).status).toBe(
        403,
      )
    }
    expect(
      (
        await handleWebApi(
          request('/auth/login', 'POST', { 'Sec-Fetch-Site': 'same-site' }),
          '/auth/login',
          options(),
        )
      ).status,
    ).toBe(403)
  })

  it('não usa token/headers de autenticação enviados pelo JavaScript', async () => {
    const config = options(Response.json({ id: 1 }))
    expect(
      (
        await handleWebApi(
          request('/users/me', 'GET', { Authorization: `Bearer ${jwt}` }),
          '/users/me',
          config,
        )
      ).status,
    ).toBe(401)
    expect(config.fetch).not.toHaveBeenCalled()
    const req = request('/users/me', 'GET', {
      Cookie: `__Host-financebot.session=${jwt}`,
      Authorization: 'Bearer attacker',
      'X-FinanceBot-Proxy-Signature': 'attacker',
    })
    expect((await handleWebApi(req, '/users/me', config)).status).toBe(200)
    const outgoing = config.fetch.mock.calls[0][1]!
    expect(new Headers(outgoing.headers).get('Authorization')).toBe(
      `Bearer ${jwt}`,
    )
    expect(new Headers(outgoing.headers).get('Cookie')).toBeNull()
    expect(
      new Headers(outgoing.headers).get('X-FinanceBot-Proxy-Signature'),
    ).toBeNull()
    expect(outgoing.redirect).toBe('error')
  })

  it('não aceita cookies duplicados ou malformados', async () => {
    for (const value of [
      'malformed',
      `${jwt}; __Host-financebot.session=${jwt}`,
    ]) {
      const config = options()
      expect(
        (
          await handleWebApi(
            request('/users/me', 'GET', {
              Cookie: `__Host-financebot.session=${value}`,
            }),
            '/users/me',
            config,
          )
        ).status,
      ).toBe(401)
      expect(config.fetch).not.toHaveBeenCalled()
    }
  })

  it('assina IP, timestamp, método e caminho sem encaminhar headers arbitrários', async () => {
    const config = options()
    await handleWebApi(
      request('/auth/login', 'POST', {
        'X-Forwarded-For': 'attacker',
        'X-FinanceBot-Client-IP': '198.51.100.99',
      }),
      '/auth/login',
      config,
    )
    const outgoing = new Headers(config.fetch.mock.calls[0][1]!.headers)
    const payload = `${now / 1000}\n203.0.113.8\nPOST\n/auth/login`
    expect(outgoing.get('X-FinanceBot-Client-IP')).toBe('203.0.113.8')
    expect(outgoing.get('X-FinanceBot-Proxy-Signature')).toBe(
      createHmac('sha256', Buffer.alloc(32)).update(payload).digest('hex'),
    )
    expect(outgoing.get('X-Forwarded-For')).toBeNull()
    expect([...outgoing.values()]).not.toContain(key)
  })

  it('falha em produção sem IP confiável, chave própria ou origem configurada', async () => {
    for (const patch of [
      { proxySecret: undefined },
      { trustVercelIp: false },
      { webOrigin: undefined },
    ]) {
      const config = { ...options(), ...patch }
      expect(
        (await handleWebApi(request(), '/auth/login', config)).status,
      ).toBe(503)
      expect(config.fetch).not.toHaveBeenCalled()
    }
    expect(
      (
        await handleWebApi(
          request('/auth/login', 'POST', {
            'x-vercel-forwarded-for': 'example.com',
          }),
          '/auth/login',
          options(),
        )
      ).status,
    ).toBe(503)
  })

  it.each([
    '/telegram/users/me',
    '/actuator/env',
    '/auth/refresh',
    '//attacker.invalid',
    '/../auth/login',
  ])('não oferece proxy para %s', async (path) => {
    const config = options()
    expect((await handleWebApi(request(), path, config)).status).toBe(404)
    expect(config.fetch).not.toHaveBeenCalled()
  })

  it('preserva Retry-After e limpa sessão em 401 sem repassar Set-Cookie/CORS do upstream', async () => {
    for (const status of [401, 429, 503]) {
      const config = options(
        Response.json(
          { detail: 'fixture' },
          {
            status,
            headers: {
              'Retry-After': '5',
              'Set-Cookie': 'untrusted=1',
              'Access-Control-Allow-Origin': '*',
            },
          },
        ),
      )
      const response = await handleWebApi(request(), '/auth/login', config)
      expect(response.status).toBe(status)
      expect(response.headers.get('Retry-After')).toBe('5')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
      expect(response.headers.get('Set-Cookie')).toBe(
        status === 401
          ? '__Host-financebot.session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure'
          : null,
      )
    }
  })

  it('logout exige CSRF, limpa cookie e não chama a API', async () => {
    const config = options()
    const response = await handleWebApi(
      request('/auth/logout'),
      '/auth/logout',
      config,
    )
    expect(response.status).toBe(204)
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0')
    expect(config.fetch).not.toHaveBeenCalled()
    expect(
      (
        await handleWebApi(
          request('/auth/logout', 'POST', {
            Origin: 'https://attacker.invalid',
          }),
          '/auth/logout',
          config,
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await handleWebApi(
          request('/auth/logout', 'GET'),
          '/auth/logout',
          config,
        )
      ).status,
    ).toBe(404)
  })

  it('não cria sessão para token vencido, inválido ou sem expiração', async () => {
    const expired = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ exp: 1 })).toString('base64url')}.Zml4dHVyZQ`
    for (const token of ['malformed', expired, 'e30.e30.Zml4dHVyZQ']) {
      const response = await handleWebApi(
        request(),
        '/auth/login',
        options(Response.json({ token })),
      )
      expect(response.status).toBe(503)
      expect(response.headers.get('Set-Cookie')).toBeNull()
      expect(await response.text()).not.toContain(token)
    }
  })

  it('limita corpo e recusa formatos de formulário', async () => {
    const config = options()
    const req = new Request(
      'https://web.example.invalid/api/financebot/auth/login',
      {
        method: 'POST',
        headers: {
          Origin: base.webOrigin!,
          'X-FinanceBot-CSRF': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 'x'.repeat(65536) }),
      },
    )
    expect((await handleWebApi(req, '/auth/login', config)).status).toBe(413)
    const form = new Request(req.url, {
      method: 'POST',
      headers: { Origin: base.webOrigin!, 'X-FinanceBot-CSRF': '1' },
      body: 'password=fixture',
    })
    expect((await handleWebApi(form, '/auth/login', config)).status).toBe(400)
    expect(config.fetch).not.toHaveBeenCalled()
  })

  it('recusa upstream sem TLS em produção e não revela falhas internas', async () => {
    expect(
      (
        await handleWebApi(request(), '/auth/login', {
          ...options(),
          upstream: 'http://localhost:8080',
        })
      ).status,
    ).toBe(503)
    const config = options()
    config.fetch.mockRejectedValue(new Error('private-secret-and-address'))
    const response = await handleWebApi(request(), '/auth/login', config)
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private-secret-and-address')
  })

  it('permite cookie sem Secure apenas no desenvolvimento local', async () => {
    const config = { ...options(), production: false, trustVercelIp: false }
    const response = await handleWebApi(request(), '/auth/login', config)
    expect(response.headers.get('Set-Cookie')).toContain(
      `${sessionCookieName(false)}=`,
    )
    expect(response.headers.get('Set-Cookie')).not.toContain('Secure')
  })
})
