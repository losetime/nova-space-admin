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
    // 401 错误只清除 localStorage，让路由守卫处理跳转
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
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
export type PushTriggerType = 'scheduled' | 'manual'
export type PushRecordStatus = 'sent' | 'failed'

export interface PushRecordUser {
  id: string
  username: string
}

export interface PushRecord {
  id: string
  userId: string
  user?: PushRecordUser
  subscriptionEmail?: string
  triggerType: PushTriggerType
  subject: string
  content: string
  sentAt: string
  status: PushRecordStatus
  errorMessage?: string
  createdAt: string
}

export const pushRecordApi = {
  getList: (params?: { page?: number; limit?: number; triggerType?: PushTriggerType; status?: PushRecordStatus; userId?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<PushRecord>>>('/push-records', { params }),

  getOne: (id: string) =>
    api.get<any, ApiResponse<PushRecord>>(`/push-records/${id}`),

  create: (data: { userId: string; triggerType?: PushTriggerType; subject: string; content: string; sentAt: string }) =>
    api.post<any, ApiResponse<PushRecord>>('/push-records', data),

  update: (id: string, data: { status?: PushRecordStatus; errorMessage?: string }) =>
    api.put<any, ApiResponse<PushRecord>>(`/push-records/${id}`, data),

  delete: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/push-records/${id}`),

  getStatistics: () =>
    api.get<any, ApiResponse<{ total: number; sent: number; failed: number }>>('/push-records/statistics'),

  testPush: (email: string) =>
    api.post<any, ApiResponse<{ success: boolean; message: string }>>('/push-records/test', { email }),

  testDigestPush: (email: string) =>
    api.post<any, ApiResponse<{ success: boolean; message: string }>>('/push-records/test-digest', { email }),
}

// Upload API
export interface UploadResult {
  url: string
  filename: string
  originalname: string
  size: number
  mimetype: string
}

export const uploadApi = {
  uploadImage: (formData: FormData) =>
    api.post<any, ApiResponse<UploadResult>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

// Quiz API
export interface Quiz {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  category: 'basic' | 'advanced' | 'mission' | 'people'
  points: number
  createdAt: string
  updatedAt: string
}

export const quizApi = {
  getList: (params?: { page?: number; limit?: number; category?: string; keyword?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<Quiz>>>('/quiz', { params }),

  getOne: (id: number) =>
    api.get<any, ApiResponse<Quiz>>(`/quiz/${id}`),

  create: (data: Partial<Quiz>) =>
    api.post<any, ApiResponse<Quiz>>('/quiz', data),

  update: (id: number, data: Partial<Quiz>) =>
    api.put<any, ApiResponse<Quiz>>(`/quiz/${id}`, data),

  delete: (id: number) =>
    api.delete<any, ApiResponse<void>>(`/quiz/${id}`),

  getStats: () =>
    api.get<any, ApiResponse<{ total: number; byCategory: { category: string; count: string }[] }>>('/quiz/stats'),
}

// Satellite Sync API
export type SyncType =
  | 'celestrak'        // CelesTrak TLE 同步
  | 'space-track'      // Space-Track TLE 同步
  | 'keeptrack-tle'    // KeepTrack TLE 同步（需 API Key）
  | 'keeptrack-meta'   // KeepTrack 元数据同步（需 API Key）
  | 'discos'           // ESA DISCOS 元数据同步
  | 'all'              // 完整同步
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface SyncProgress {
  total: number
  processed: number
  success: number
  failed: number
  percentage: number
  estimatedTimeRemaining?: string
}

export interface SyncTask {
  taskId: string
  type: SyncType
  status: SyncStatus
  startedAt: string
  completedAt?: string
  progress: SyncProgress
  error?: string
}

export interface SyncStats {
  tleCount: number
  metadataCount: number
  discosCount: number
  discosCoverage: string
  celestrakCount?: number
  keepTrackCount?: number
  lastTleSync?: string
  lastDiscosSync?: string
  lastCelestrakSync?: string
  lastKeepTrackSync?: string
}

export const satelliteSyncApi = {
  startSync: (type: SyncType, force?: boolean) =>
    api.post<any, ApiResponse<SyncTask>>('/satellite-sync', { type, force }),

  getStatus: () =>
    api.get<any, ApiResponse<SyncTask | null>>('/satellite-sync/status'),

  getStats: () =>
    api.get<any, ApiResponse<SyncStats>>('/satellite-sync/stats'),
}

export default api