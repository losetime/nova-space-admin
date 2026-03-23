import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - returns response.data directly
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// Types - Note: API methods return the data directly due to the interceptor
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<any, ApiResponse<{ user: any; token: string }>>('/auth/login', { username, password }),

  getProfile: () =>
    api.get<any, ApiResponse<any>>('/auth/profile'),
}

// Article API
export interface Article {
  id: number
  title: string
  content: string
  summary?: string
  cover?: string
  category: 'basic' | 'advanced' | 'mission' | 'people'
  type: 'article' | 'video'
  views: number
  likes: number
  duration?: number
  tags?: string[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export const articleApi = {
  getList: (params?: { page?: number; limit?: number; category?: string; keyword?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<Article>>>('/articles', { params }),

  getOne: (id: number) =>
    api.get<any, ApiResponse<Article>>(`/articles/${id}`),

  create: (data: Partial<Article>) =>
    api.post<any, ApiResponse<Article>>('/articles', data),

  update: (id: number, data: Partial<Article>) =>
    api.put<any, ApiResponse<Article>>(`/articles/${id}`, data),

  delete: (id: number) =>
    api.delete<any, ApiResponse<void>>(`/articles/${id}`),

  import: (file: File, format: 'csv' | 'excel') => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<any, ApiResponse<{ success: number; failed: number; errors: string[] }>>(
      `/import/articles?format=${format}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
}

// Intelligence API
export interface Intelligence {
  id: number
  title: string
  content: string
  summary: string
  cover?: string
  category: 'launch' | 'satellite' | 'industry' | 'research' | 'environment'
  level: 'free' | 'advanced' | 'professional'
  views: number
  likes: number
  collects: number
  source: string
  sourceUrl?: string
  tags?: string
  analysis?: string
  trend?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export const intelligenceApi = {
  getList: (params?: { page?: number; limit?: number; category?: string; level?: string; keyword?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<Intelligence>>>('/intelligence', { params }),

  getOne: (id: number) =>
    api.get<any, ApiResponse<Intelligence>>(`/intelligence/${id}`),

  create: (data: Partial<Intelligence>) =>
    api.post<any, ApiResponse<Intelligence>>('/intelligence', data),

  update: (id: number, data: Partial<Intelligence>) =>
    api.put<any, ApiResponse<Intelligence>>(`/intelligence/${id}`, data),

  delete: (id: number) =>
    api.delete<any, ApiResponse<void>>(`/intelligence/${id}`),

  import: (file: File, format: 'csv' | 'excel') => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<any, ApiResponse<{ success: number; failed: number; errors: string[] }>>(
      `/import/intelligence?format=${format}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
}

// User API
export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  nickname?: string
  avatar?: string
  role: 'user' | 'admin' | 'super_admin'
  level: 'basic' | 'advanced' | 'professional'
  points: number
  totalPoints: number
  isVerified: boolean
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export const userApi = {
  getList: (params?: { page?: number; limit?: number; keyword?: string; role?: string; isActive?: boolean }) =>
    api.get<any, ApiResponse<PaginatedResponse<User>>>('/users', { params }),

  getOne: (id: string) =>
    api.get<any, ApiResponse<User>>(`/users/${id}`),

  create: (data: Partial<User> & { password: string }) =>
    api.post<any, ApiResponse<User>>('/users', data),

  update: (id: string, data: Partial<User>) =>
    api.put<any, ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/users/${id}`),

  resetPassword: (id: string, password?: string) =>
    api.post<any, ApiResponse<{ message: string; password: string }>>(`/users/${id}/reset-password`, { password }),
}

// Feedback API
export interface Feedback {
  id: string
  userId?: string
  type: 'bug' | 'feature' | 'suggestion' | 'other'
  title: string
  content: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  createdAt: string
  updatedAt: string
}

export const feedbackApi = {
  getList: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<Feedback>>>('/feedback', { params }),

  getOne: (id: string) =>
    api.get<any, ApiResponse<Feedback>>(`/feedback/${id}`),

  update: (id: string, data: { status: string }) =>
    api.put<any, ApiResponse<Feedback>>(`/feedback/${id}`, data),

  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/feedback/${id}`),
}

// Push Record API
export interface PushRecord {
  id: number
  contentType: 'article' | 'intelligence'
  contentId: number
  title: string
  targetLevel: 'all' | 'basic' | 'advanced' | 'professional'
  status: 'pending' | 'sending' | 'success' | 'failed'
  successCount: number
  failCount: number
  errorMessage?: string
  pushedAt?: string
  createdAt: string
  updatedAt: string
}

export const pushRecordApi = {
  getList: (params?: { page?: number; limit?: number; contentType?: string; status?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<PushRecord>>>('/push-records', { params }),

  getOne: (id: number) =>
    api.get<any, ApiResponse<PushRecord>>(`/push-records/${id}`),

  create: (data: { contentType: string; contentId: number; title: string; targetLevel?: string }) =>
    api.post<any, ApiResponse<PushRecord>>('/push-records', data),

  update: (id: number, data: { status?: string; successCount?: number; failCount?: number; errorMessage?: string }) =>
    api.put<any, ApiResponse<PushRecord>>(`/push-records/${id}`, data),

  delete: (id: number) =>
    api.delete<any, ApiResponse<void>>(`/push-records/${id}`),

  getStatistics: () =>
    api.get<any, ApiResponse<{ total: number; success: number; failed: number; pending: number }>>('/push-records/statistics'),
}

export default api