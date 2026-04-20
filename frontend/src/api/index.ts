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

  hardDelete: (id: string) =>
    api.delete<any, ApiResponse<{ message: string }>>(`/users/${id}/hard`),

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
export type PushSubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type SubscriptionType = 'space_weather' | 'intelligence'

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

export interface PushSubscription {
  id: string
  userId: string
  user?: { id: string; username: string }
  email: string
  subscriptionTypes: SubscriptionType[]
  enabled: boolean
  status: PushSubscriptionStatus
  lastPushAt?: string
  createdAt: string
  updatedAt: string
}

export const pushRecordApi = {
  getList: (params?: { page?: number; limit?: number; triggerType?: PushTriggerType; status?: PushRecordStatus; userId?: string; email?: string }) =>
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

  getSubscriptions: (params?: { 
    page?: number; 
    limit?: number; 
    status?: PushSubscriptionStatus;
    email?: string;
  }) =>
    api.get<any, ApiResponse<PaginatedResponse<PushSubscription>>>('/push-records/subscriptions', { params }),

  updateSubscription: (id: string, data: { enabled?: boolean; status?: PushSubscriptionStatus }) =>
    api.put<any, ApiResponse<PushSubscription>>(`/push-records/subscriptions/${id}`, data),

  getSubscriptionStatistics: () =>
    api.get<any, ApiResponse<{ total: number; active: number; paused: number }>>('/push-records/subscriptions/statistics'),

  triggerPush: () =>
    api.post<any, ApiResponse<void>>('/push-records/trigger'),
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
  | 'space-track-meta' // Space-Track 元数据同步
  | 'keeptrack-tle'    // KeepTrack TLE 同步（需 API Key）
  | 'keeptrack-meta'   // KeepTrack 元数据同步（需 API Key）
  | 'discos'           // ESA DISCOS 元数据同步
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
  recentErrors?: SyncErrorLogEntry[]
}

// 错误日志摘要（用于实时显示）
export interface SyncErrorLogEntry {
  noradId: string
  name?: string
  errorType: string
  errorMessage: string
  timestamp: string
}

export interface SyncStats {
  tleCount: number
  metadataCount: number
  discosCount: number
  keepTrackMetadataCount: number // KeepTrack 元数据数量
  spaceTrackMetadataCount: number // Space-Track 元数据数量
  discosCoverage: string
  keepTrackCoverage: string
  spaceTrackCoverage: string
  celestrakCount?: number
  keepTrackCount?: number
  spaceTrackTleCount?: number
  lastTleSync?: string
  lastDiscosSync?: string
  lastCelestrakSync?: string
  lastKeepTrackSync?: string
  lastSpaceTrackSync?: string
}

// 同步任务列表项
export interface SyncTaskItem {
  id: string
  type: SyncType
  status: SyncStatus
  total: number
  processed: number
  success: number
  failed: number
  startedAt: string
  completedAt?: string
  error?: string
}

// 错误日志项
export interface SyncErrorLog {
  id: string
  noradId: string
  name?: string
  source: string
  errorType: string
  errorMessage: string
  timestamp: string
}

// TLE 数据项
export interface TleItem {
  noradId: string
  name: string
  source: string
  epoch?: string
  inclination?: number
  raan?: number
  eccentricity?: number
  line1?: string
  line2?: string
}

// 元数据项
export interface MetadataItem {
  noradId: string
  name: string
  countryCode?: string
  launchDate?: string
  objectType?: string
  status?: string
  hasKeepTrackData?: boolean
  hasSpaceTrackData?: boolean
  hasDiscosData?: boolean
}

export const satelliteSyncApi = {
  startSync: (type: SyncType, force?: boolean) =>
    api.post<any, ApiResponse<SyncTask>>('/satellite-sync', { type, force }),

  getStatus: () =>
    api.get<any, ApiResponse<SyncTask | null>>('/satellite-sync/status'),

  stopSync: () =>
    api.post<any, ApiResponse<{ taskId: string; status: SyncStatus }>>('/satellite-sync/stop'),

  getStats: () =>
    api.get<any, ApiResponse<SyncStats>>('/satellite-sync/stats'),

  getTaskList: (params?: { page?: number; limit?: number; status?: SyncStatus; type?: SyncType }) =>
    api.get<any, ApiResponse<PaginatedResponse<SyncTaskItem>>>('/satellite-sync/tasks', { params }),

  getTaskById: (taskId: string) =>
    api.get<any, ApiResponse<SyncTaskItem | null>>(`/satellite-sync/tasks/${taskId}`),

  getTaskErrors: (taskId: string) =>
    api.get<any, ApiResponse<{ data: SyncErrorLog[]; total: number }>>(`/satellite-sync/tasks/${taskId}/errors`),

  getTleList: (params?: { page?: number; limit?: number; search?: string; source?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<TleItem>>>('/satellite-sync/tle', { params }),

  getMetadataList: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<MetadataItem>>>('/satellite-sync/metadata', { params }),

  getCronStatus: () =>
    api.get<any, ApiResponse<{ enabled: boolean }>>('/satellite-sync/cron/status'),

  toggleCron: (enabled: boolean) =>
    api.post<any, ApiResponse<{ enabled: boolean; message: string }>>('/satellite-sync/cron/toggle', { enabled }),
}

export interface MediaItem {
  type: 'image' | 'video'
  url: string
  caption?: string
}

export interface Milestone {
  id: number
  title: string
  description: string
  content?: string
  eventDate: string
  category: 'launch' | 'recovery' | 'orbit' | 'mission' | 'other'
  cover?: string
  media?: MediaItem[]
  relatedSatelliteNoradId?: string
  importance: number
  location?: string
  organizer?: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface MilestoneQueryParams {
  page?: number
  pageSize?: number
  category?: Milestone['category']
  importance?: number
  isPublished?: boolean
  search?: string
  sortBy?: 'eventDate' | 'importance' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}

export const milestoneApi = {
  getList: (params?: MilestoneQueryParams) =>
    api.get<any, ApiResponse<PaginatedResponse<Milestone>>>('/milestones', { params }),

  getOne: (id: number) =>
    api.get<any, ApiResponse<Milestone>>(`/milestones/${id}`),

  create: (data: Partial<Milestone>) =>
    api.post<any, ApiResponse<Milestone>>('/milestones', data),

  update: (id: number, data: Partial<Milestone>) =>
    api.put<any, ApiResponse<Milestone>>(`/milestones/${id}`, data),

  delete: (id: number) =>
    api.delete<any, ApiResponse<void>>(`/milestones/${id}`),

  togglePublish: (id: number) =>
    api.patch<any, ApiResponse<Milestone>>(`/milestones/${id}/publish`),
}

// Company API
export interface Company {
  id: number
  name: string
  country?: string
  foundedYear?: number
  website?: string
  description?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export const companyApi = {
  getList: (params?: { page?: number; limit?: number; name?: string; country?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<Company>>>('/companies', { params }),

  getOne: (id: number) =>
    api.get<any, ApiResponse<Company>>(`/companies/${id}`),

  create: (data: Partial<Company>) =>
    api.post<any, ApiResponse<Company>>('/companies', data),

  update: (id: number, data: Partial<Company>) =>
    api.put<any, ApiResponse<Company>>(`/companies/${id}`, data),

  delete: (id: number) =>
    api.delete<any, ApiResponse<void>>(`/companies/${id}`),

  getStatistics: () =>
    api.get<any, ApiResponse<{ total: number; countries: any[] }>>('/companies/statistics'),
}

// Membership API
export interface MembershipPlan {
  id: string
  name: string
  planCode: string
  durationMonths: number
  level: string
  price: string | number
  pointsPrice: number | null
  description: string | null
  features: Record<string, any> | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 权益（新结构）
export interface Benefit {
  id: string
  name: string
  description: string | null
  valueType: 'number' | 'text' | 'boolean'
  unit: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 会员等级
export interface MemberLevel {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  benefits?: {
    id: string
    name: string
    description: string | null
    valueType: string
    unit: string | null
    value: string
    displayText?: string | null
  }[]
  userCount?: number
}

export interface MembershipSubscription {
  id: string
  userId: string
  plan: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  price: number
  startDate: string
  endDate: string
  paymentMethod: string | null
  paymentId: string | null
  autoRenew: boolean
  cancelledAt: string | null
  cancelReason: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    username: string
    email: string | null
    nickname: string | null
    level: string
  }
}

export interface MembershipStatistics {
  total: number
  active: number
  expired: number
  planStats: { plan: string; count: number }[]
  levelStats: { level: string; count: number }[]
}

export const membershipApi = {
  // Plans
  getPlans: (params?: { page?: number; limit?: number; isActive?: boolean; level?: string }) =>
    api.get<any, ApiResponse<PaginatedResponse<MembershipPlan>>>('/membership/plans', { params }),

  getPlan: (id: string) =>
    api.get<any, ApiResponse<MembershipPlan>>(`/membership/plans/${id}`),

  createPlan: (data: Partial<MembershipPlan>) =>
    api.post<any, ApiResponse<MembershipPlan>>('/membership/plans', data),

  updatePlan: (id: string, data: Partial<MembershipPlan>) =>
    api.put<any, ApiResponse<MembershipPlan>>(`/membership/plans/${id}`, data),

  deletePlan: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/membership/plans/${id}`),

  // Benefits
  getBenefits: (params?: { page?: number; limit?: number }) =>
    api.get<any, ApiResponse<PaginatedResponse<Benefit>>>('/membership/benefits', { params }),

  getBenefit: (id: string) =>
    api.get<any, ApiResponse<Benefit>>(`/membership/benefits/${id}`),

  createBenefit: (data: Partial<Benefit>) =>
    api.post<any, ApiResponse<Benefit>>('/membership/benefits', data),

  updateBenefit: (id: string, data: Partial<Benefit>) =>
    api.put<any, ApiResponse<Benefit>>(`/membership/benefits/${id}`, data),

  deleteBenefit: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/membership/benefits/${id}`),

  // Member Levels
  getLevels: (params?: { page?: number; limit?: number }) =>
    api.get<any, ApiResponse<PaginatedResponse<MemberLevel>>>('/membership/levels', { params }),

  getLevel: (id: string) =>
    api.get<any, ApiResponse<MemberLevel>>(`/membership/levels/${id}`),

  createLevel: (data: Partial<MemberLevel>) =>
    api.post<any, ApiResponse<MemberLevel>>('/membership/levels', data),

  updateLevel: (id: string, data: Partial<MemberLevel>) =>
    api.put<any, ApiResponse<MemberLevel>>(`/membership/levels/${id}`, data),

  deleteLevel: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/membership/levels/${id}`),

  configureLevelBenefits: (id: string, data: { benefits: { benefitId: string; value: string; displayText?: string }[] }) =>
    api.put<any, ApiResponse<MemberLevel>>(`/membership/levels/${id}/benefits`, data),

  addLevelBenefit: (id: string, data: { benefitId: string; value: string; displayText?: string }) =>
    api.post<any, ApiResponse<MemberLevel>>(`/membership/levels/${id}/benefits`, data),

  removeLevelBenefit: (id: string, benefitId: string) =>
    api.delete<any, ApiResponse<void>>(`/membership/levels/${id}/benefits/${benefitId}`),

  // Subscriptions
  getSubscriptions: (params?: {
    page?: number
    limit?: number
    userId?: string
    username?: string
    status?: string
    plan?: string
  }) =>
    api.get<any, ApiResponse<PaginatedResponse<MembershipSubscription>>>('/membership/subscriptions', { params }),

  getSubscription: (id: string) =>
    api.get<any, ApiResponse<MembershipSubscription>>(`/membership/subscriptions/${id}`),

  activateUser: (userId: string, data: { plan: string; startDate?: string; endDate?: string; reason?: string }) =>
    api.post<any, ApiResponse<MembershipSubscription>>(`/membership/users/${userId}/activate`, data),

  extendSubscription: (id: string, months: number, reason?: string) =>
    api.post<any, ApiResponse<MembershipSubscription>>(`/membership/subscriptions/${id}/extend`, { months, reason }),

  cancelSubscription: (id: string, reason?: string) =>
    api.post<any, ApiResponse<MembershipSubscription>>(`/membership/subscriptions/${id}/cancel`, { reason }),

  // Statistics
  getStatistics: () =>
    api.get<any, ApiResponse<MembershipStatistics>>('/membership/statistics'),
}

export default api