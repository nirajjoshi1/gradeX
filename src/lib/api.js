const isProd = import.meta.env.PROD
const API_BASE = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:4000/api')

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error ?? 'Request failed')
  }

  if (response.status === 204) return null
  return response.json()
}

export const apiBase = API_BASE
