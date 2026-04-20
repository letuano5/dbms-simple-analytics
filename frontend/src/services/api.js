import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const dashboardApi = {
  kpis: () => api.get('/dashboard/kpis'),
}

export const customersApi = {
  list: (params) => api.get('/customers', { params }),
  top: (limit = 10) => api.get('/customers/top', { params: { limit } }),
  byCountry: () => api.get('/customers/by-country'),
}

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  overTime: (granularity = 'month') => api.get('/orders/over-time', { params: { granularity } }),
  statusDistribution: () => api.get('/orders/status-distribution'),
}

export const salesApi = {
  revenue: (granularity = 'month') => api.get('/sales/revenue', { params: { granularity } }),
  byProductLine: () => api.get('/sales/by-product-line'),
  repPerformance: () => api.get('/sales/rep-performance'),
}

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  topSelling: (limit = 10) => api.get('/products/top-selling', { params: { limit } }),
  stockLevels: () => api.get('/products/stock-levels'),
}

export const pivotApi = {
  productLineByMonth: () => api.get('/pivot/productline-by-month'),
  countryByProductLine: () => api.get('/pivot/country-by-productline'),
}

export const chatApi = {
  send: (question) => api.post('/chat', { question }),
  keyStatus: () => api.get('/chat/key-status'),
}
