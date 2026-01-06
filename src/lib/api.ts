import ky from 'ky'

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token')
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return response
      },
    ],
  },
})
