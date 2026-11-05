import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export interface WebApiOptions {
  upstream: string
  production: boolean
  webOrigin?: string
  proxySecret?: string
  trustVercelIp?: boolean
  fetch?: typeof fetch
  now?: () => number
}

const MAX_BODY = 64 * 1024
const MAX_SESSION_SECONDS = 8 * 60 * 60
const REFRESH_PATTERN = /^[A-Za-z0-9_-]{43}$/
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const ALLOWED = new Set([
  'POST /auth/login',
  'POST /auth/register',
  'POST /auth/logout',
  'POST /auth/refresh',
  'POST /auth/activity',
  'GET /auth/session',
  'GET /users/me',
  'GET /accounts',
  'GET /categories',
  'GET /dashboard/monthly-summary',
  'PATCH /users/me/monthly-base-income',
  'PATCH /users/me/onboarding-completed',
  'POST /users/me/telegram-link-code',
  'POST /accounts',
  'POST /categories',
])

function headers() {
  return new Headers({
    'Cache-Control': 'private, no-store, max-age=0',
    'CDN-Cache-Control': 'no-store',
    Vary: 'Cookie',
    'X-Content-Type-Options': 'nosniff',
  })
}

function problem(status: number, detail: string, extra = headers()) {
  return Response.json({ status, detail }, { status, headers: extra })
}

export function sessionCookieName(production: boolean) {
  return production ? '__Host-financebot.session' : 'financebot.session'
}

export function refreshCookieName(production: boolean) {
  return production ? '__Host-financebot.refresh' : 'financebot.refresh'
}

function cookie(
  value: string,
  maxAge: number,
  production: boolean,
  refresh = false,
) {
  return `${refresh ? refreshCookieName(production) : sessionCookieName(production)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${production ? '; Secure' : ''}`
}

function readSession(request: Request, production: boolean, refresh = false) {
  const name = `${refresh ? refreshCookieName(production) : sessionCookieName(production)}=`
  const matches = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(name))
  if (matches.length !== 1) return null
  const value = matches[0].slice(name.length)
  return value.length <= 3500 &&
    (refresh ? REFRESH_PATTERN : JWT_PATTERN).test(value)
    ? value
    : null
}

export function hasRefreshCookie(request: Request, production: boolean) {
  return readSession(request, production, true) !== null
}

function clearCookies(responseHeaders: Headers, production: boolean) {
  responseHeaders.append('Set-Cookie', cookie('', 0, production))
  responseHeaders.append('Set-Cookie', cookie('', 0, production, true))
}

function validateOptions(options: WebApiOptions, request: Request) {
  const upstream = new URL(options.upstream)
  if (
    upstream.username ||
    upstream.password ||
    upstream.search ||
    upstream.hash ||
    upstream.pathname !== '/'
  )
    throw new Error('config')
  if (
    upstream.protocol !== 'https:' &&
    !(
      upstream.protocol === 'http:' &&
      !options.production &&
      ['localhost', '127.0.0.1', '[::1]'].includes(upstream.hostname)
    )
  )
    throw new Error('config')
  const origin =
    options.webOrigin ?? (options.production ? '' : new URL(request.url).origin)
  const parsed = new URL(origin)
  if (
    parsed.origin !== origin ||
    (options.production && parsed.protocol !== 'https:')
  )
    throw new Error('config')
  return { upstream, origin }
}

async function readBody(request: Request) {
  if (!request.body) return undefined
  const reader = request.body.getReader()
  const chunks: Array<Uint8Array> = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_BODY) throw new RangeError('body')
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  if (!size) return undefined
  if (
    request.headers.get('content-type')?.split(';')[0].trim() !==
    'application/json'
  )
    throw new TypeError('content-type')
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  const body = new TextDecoder().decode(bytes)
  JSON.parse(body)
  return body
}

function addClientAssertion(
  request: Request,
  path: string,
  options: WebApiOptions,
  outgoing: Headers,
) {
  // Apenas a plataforma confiável fornece esse header; nunca usar X-Forwarded-For do browser.
  if (!options.trustVercelIp) {
    if (options.production) throw new Error('proxy platform')
    return
  }
  const ip = request.headers.get('x-vercel-forwarded-for')?.trim() ?? ''
  const secret = options.proxySecret ?? ''
  const key = Buffer.from(secret, 'base64')
  if (!isIP(ip) || key.length !== 32 || key.toString('base64') !== secret)
    throw new Error('proxy config')
  const timestamp = Math.floor(
    (options.now?.() ?? Date.now()) / 1000,
  ).toString()
  const payload = `${timestamp}\n${ip}\n${request.method}\n${path}`
  outgoing.set('X-FinanceBot-Client-IP', ip)
  outgoing.set('X-FinanceBot-Proxy-Timestamp', timestamp)
  outgoing.set(
    'X-FinanceBot-Proxy-Signature',
    createHmac('sha256', key).update(payload).digest('hex'),
  )
}

export async function handleWebApi(
  request: Request,
  path: string,
  options: WebApiOptions,
): Promise<Response> {
  if (!ALLOWED.has(`${request.method} ${path}`))
    return problem(404, 'Recurso não disponível.')
  let configured: ReturnType<typeof validateOptions>
  try {
    configured = validateOptions(options, request)
  } catch {
    return problem(503, 'Serviço temporariamente indisponível.')
  }
  const unsafe = !['GET', 'HEAD'].includes(request.method)
  if (
    unsafe &&
    (request.headers.get('origin') !== configured.origin ||
      request.headers.get('X-FinanceBot-CSRF') !== '1' ||
      ['cross-site', 'same-site'].includes(
        request.headers.get('sec-fetch-site') ?? '',
      ))
  ) {
    return problem(403, 'Origem da solicitação não permitida.')
  }
  const authentication = path === '/auth/login' || path === '/auth/register'
  const token = readSession(request, options.production)
  const refresh = readSession(request, options.production, true)
  const refreshing = path === '/auth/refresh'
  const logout = path === '/auth/logout'
  if (logout && !refresh) {
    const responseHeaders = headers()
    clearCookies(responseHeaders, options.production)
    return new Response(null, { status: 204, headers: responseHeaders })
  }
  if (!authentication && !(refreshing || logout ? refresh : token)) {
    const responseHeaders = headers()
    if (refreshing) clearCookies(responseHeaders, options.production)
    else responseHeaders.append('Set-Cookie', cookie('', 0, options.production))
    return problem(401, 'Entre novamente para continuar.', responseHeaders)
  }
  let body: string | undefined
  try {
    body = unsafe ? await readBody(request) : undefined
  } catch (error) {
    return problem(
      error instanceof RangeError ? 413 : 400,
      'Conteúdo da solicitação inválido.',
    )
  }
  if (refreshing || logout) body = JSON.stringify({ refreshToken: refresh })
  const outgoing = new Headers({ Accept: 'application/json' })
  if (body !== undefined) outgoing.set('Content-Type', 'application/json')
  if (!authentication && token) outgoing.set('Authorization', `Bearer ${token}`)
  const idempotencyKey = request.headers.get('Idempotency-Key')
  if (idempotencyKey && idempotencyKey.length <= 255)
    outgoing.set('Idempotency-Key', idempotencyKey)
  try {
    if (authentication) addClientAssertion(request, path, options, outgoing)
    // Abas aguardam o mesmo Web Lock. A segunda já recebe os cookies renovados.
    if (refreshing && token) {
      const claims = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString(),
      ) as { exp?: number }
      if (
        typeof claims.exp === 'number' &&
        claims.exp * 1000 > (options.now?.() ?? Date.now()) + 30_000
      )
        return Response.json({ authenticated: true }, { headers: headers() })
    }
    const upstreamUrl = new URL(path, configured.upstream)
    upstreamUrl.search = new URL(request.url).search
    const response = await (options.fetch ?? fetch)(upstreamUrl, {
      method: request.method,
      headers: outgoing,
      body,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    const responseHeaders = headers()
    for (const name of ['Content-Type', 'Retry-After']) {
      const value = response.headers.get(name)
      if (value) responseHeaders.set(name, value)
    }
    if (response.status === 401) {
      if (authentication || refreshing || logout)
        clearCookies(responseHeaders, options.production)
      else
        responseHeaders.append('Set-Cookie', cookie('', 0, options.production))
    }
    if (logout && response.ok) {
      clearCookies(responseHeaders, options.production)
      return new Response(null, { status: 204, headers: responseHeaders })
    }
    if ((authentication || refreshing) && response.ok) {
      const result = (await response.json()) as Record<string, unknown>
      const jwt = result.token
      const refreshToken = result.refreshToken
      const sessionExpiry =
        typeof result.sessionExpiresAt === 'string'
          ? Date.parse(result.sessionExpiresAt)
          : NaN
      if (
        typeof refreshToken !== 'string' ||
        !REFRESH_PATTERN.test(refreshToken) ||
        !Number.isFinite(sessionExpiry)
      )
        throw new Error('session')
      if (
        typeof jwt !== 'string' ||
        jwt.length > 3500 ||
        !JWT_PATTERN.test(jwt)
      )
        throw new Error('token')
      // A API assinou o token recebido por TLS. A validação criptográfica continua na API.
      const claims = JSON.parse(
        Buffer.from(jwt.split('.')[1], 'base64url').toString(),
      ) as { exp?: number }
      const now = Math.floor((options.now?.() ?? Date.now()) / 1000)
      if (typeof claims.exp !== 'number' || !Number.isSafeInteger(claims.exp))
        throw new Error('expiration')
      const maxAge = Math.min(claims.exp - now, MAX_SESSION_SECONDS)
      if (maxAge <= 0) throw new Error('expired token')
      const refreshAge = Math.min(
        Math.floor(sessionExpiry / 1000) - now,
        MAX_SESSION_SECONDS,
      )
      if (refreshAge <= 0) throw new Error('expired session')
      responseHeaders.append(
        'Set-Cookie',
        cookie(jwt, maxAge, options.production),
      )
      responseHeaders.append(
        'Set-Cookie',
        cookie(refreshToken, refreshAge, options.production, true),
      )
      // O JWT nunca integra JSON/HTML/estado JavaScript do navegador.
      return Response.json(
        { authenticated: true },
        { status: response.status, headers: responseHeaders },
      )
    }
    return new Response(response.status === 204 ? null : response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch {
    return problem(503, 'Não foi possível concluir a solicitação agora.')
  }
}

export function runtimeOptions(): WebApiOptions {
  return {
    upstream:
      process.env.FINANCEBOT_API_BASE_URL ??
      import.meta.env.VITE_API_BASE_URL ??
      'http://localhost:8080',
    production: process.env.NODE_ENV === 'production',
    webOrigin: process.env.FINANCEBOT_WEB_ORIGIN,
    proxySecret: process.env.FINANCEBOT_WEB_PROXY_SECRET,
    trustVercelIp: process.env.VERCEL === '1',
  }
}
