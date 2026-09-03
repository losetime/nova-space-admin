import type { SyncStatus, SyncType, SyncErrorType } from '@/api'

export const SYNC_DIALOG_WIDTH = 1000

export function getStatusText(status: SyncStatus) {
  switch (status) {
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'running': return '运行中'
    default: return '等待中'
  }
}

export function getStatusTheme(status: SyncStatus) {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'running': return 'primary'
    default: return 'default'
  }
}

export function getTypeText(type: SyncType) {
  const map: Record<SyncType, string> = {
    'celestrak': 'CelesTrak',
    'space-track': 'Space-Track',
    'space-track-meta': 'Space-Track 元数据',
    'keeptrack-tle': 'KeepTrack TLE',
    'keeptrack-meta': 'KeepTrack 元数据',
    'discos': 'ESA DISCOS',
  }
  return map[type] || type
}

export function getSourceText(source: string) {
  const map: Record<string, string> = {
    'celestrak': 'CelesTrak',
    'space-track': 'Space-Track',
    'keeptrack': 'KeepTrack',
    'discos': 'ESA DISCOS',
  }
  return map[source] || source
}

export function getErrorTypeTheme(type: SyncErrorType | string) {
  const map: Record<string, string> = {
    'missing_name': 'warning',
    'parse_error': 'danger',
    'duplicate': 'default',
    'database': 'danger',
    'api_error': 'danger',
    'network': 'danger',
    'rate_limit': 'warning',
    'timeout': 'warning',
    'other': 'default',
  }
  return map[type] || 'default'
}

export function getErrorTypeText(type: SyncErrorType | string) {
  const map: Record<string, string> = {
    'missing_name': '缺少名称',
    'parse_error': '解析失败',
    'duplicate': '重复数据',
    'database': '数据库错误',
    'api_error': 'API 错误',
    'network': '网络错误',
    'rate_limit': '频率限制',
    'timeout': '超时',
    'other': '其他错误',
  }
  return map[type] || type
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
