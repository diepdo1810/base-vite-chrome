import axios from 'axios'

// Create axios instance for Pollinations API
export const pollinationsAxios = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Pollinations-Chrome-Extension',
  },
})

// Request interceptor
pollinationsAxios.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
pollinationsAxios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.')
    }

    return Promise.reject(error)
  },
)

export default pollinationsAxios
