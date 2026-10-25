import { createFileRoute } from '@tanstack/react-router'
import { handleWebApi, runtimeOptions } from '@/server/web-api.server'

export const Route = createFileRoute('/api/financebot/$')({
  server: {
    handlers: {
      ANY: ({ request, params }) =>
        handleWebApi(request, `/${params._splat ?? ''}`, runtimeOptions()),
    },
  },
})
