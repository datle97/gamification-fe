import ky from 'ky'

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
  },
})
