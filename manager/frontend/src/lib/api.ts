import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('showstack-auth')
  if (authData) {
    try {
      const { state } = JSON.parse(authData)
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch (e) {
      // Invalid auth data, ignore
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('showstack-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
