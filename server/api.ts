import type { IncomingMessage, ServerResponse } from 'node:http'
import { createActivityApi } from './activity.ts'
import { createContactApi } from './contact.ts'

export function createPortfolioApi(env: Record<string, string | undefined>) {
  const activity = createActivityApi(env)
  const contact = createContactApi(env)
  return (request: IncomingMessage, response: ServerResponse, next: () => void) =>
    activity(request, response, () => { void contact(request, response, next) })
}
