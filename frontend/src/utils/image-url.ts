/**
 * 图片 URL 工具函数
 * 将相对路径拼接为完整 URL（管理端使用公网 IP）
 */

// 从环境变量获取 MinIO 基础 URL
const MINIO_BASE_URL = import.meta.env.VITE_MINIO_BASE_URL || 'http://8.160.178.247:8081'

/**
 * 获取完整图片 URL
 * @param url 图片 URL（相对路径或完整 URL）
 * @returns 完整 URL
 */
export function getFullImageUrl(url: string | undefined | null): string {
  if (!url) return ''

  // MinIO 相对路径 -> 拼接公网 IP URL
  if (url.startsWith('/minio/')) {
    return `${MINIO_BASE_URL}${url}`
  }

  // 其他 URL（外链图片等） -> 不处理
  return url
}