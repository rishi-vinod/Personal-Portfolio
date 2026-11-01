// A public form ID is safe to bundle; recipient emails and credentials are not.
export function contactEndpoint(value: string | undefined): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.hostname !== 'formspree.io'
      || url.port || url.username || url.password || url.search || url.hash
      || !/^\/f\/[a-zA-Z0-9]{6,}$/.test(url.pathname)) return null
    return url.href
  } catch { return null }
}
