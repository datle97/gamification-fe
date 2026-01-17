import ky, { HTTPError } from 'ky'
import { toast } from 'sonner'

// TODO: Replace with proper auth flow
const DEV_TOKEN = 'q7YVQIHsOVWkbqJwzuy7tuNlbdHrrRkcH9hbdeJdpj1eP6051J'

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token') || DEV_TOKEN
        request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        try {
          const body = await response.clone().json()
          if (response.ok) {
            // Show success toast for mutations (non-GET) if backend returns message
            if (request.method !== 'GET' && body.message) {
              toast.success(body.message)
            }
          } else {
            // Show error toast
            const message = body.message || body.error || `Error ${response.status}`
            toast.error(message)
          }
        } catch {
          // Non-JSON response or parse error
          if (!response.ok) {
            toast.error(`Error ${response.status}`)
          }
        }
        return response
      },
    ],
  },
})

/**
 * Extract error message from HTTPError
 */
export async function getErrorMessage(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json()
      return body.message || body.error || error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unknown error'
}
