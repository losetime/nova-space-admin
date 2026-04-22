<template>
  <t-dialog
    :visible="visible"
    header="错误详情"
    :footer="false"
    mode="full-screen"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="error-detail-dialog">
      <t-form labelWidth="100">
        <t-form-item label="NORAD ID">
          <span class="field-value">{{ error.noradId }}</span>
        </t-form-item>
        <t-form-item label="名称">
          <span class="field-value">{{ error.name || '-' }}</span>
        </t-form-item>
        <t-form-item label="错误类型">
          <t-tag :theme="getErrorTypeTheme(error.errorType)" size="small">
            {{ getErrorTypeText(error.errorType) }}
          </t-tag>
        </t-form-item>
        <t-form-item label="数据源">
          <span class="field-value">{{ getSourceText(error.source) }}</span>
        </t-form-item>
        <t-form-item label="时间">
          <span class="field-value">{{ formatDateTime(error.timestamp) }}</span>
        </t-form-item>
      </t-form>

      <div class="section-divider"></div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">详细错误信息</span>
          <t-button size="small" variant="text" @click="copyErrorDetails">
            <template #icon><CopyIcon /></template>
            复制
          </t-button>
        </div>
        <t-form labelWidth="100">
          <t-form-item label="错误码">
            <span class="field-value code">{{ error.errorDetails?.code || '--' }}</span>
          </t-form-item>
          <t-form-item label="列名">
            <span class="field-value">{{ error.errorDetails?.column || '--' }}</span>
          </t-form-item>
          <t-form-item label="表名">
            <span class="field-value">{{ error.errorDetails?.table || '--' }}</span>
          </t-form-item>
          <t-form-item label="约束名">
            <span class="field-value">{{ error.errorDetails?.constraint || '--' }}</span>
          </t-form-item>
          <t-form-item label="详细信息">
            <span class="field-value">{{ error.errorDetails?.detail || '--' }}</span>
          </t-form-item>
          <t-form-item label="提示">
            <span class="field-value">{{ error.errorDetails?.hint || '--' }}</span>
          </t-form-item>
        </t-form>
      </div>

      <template v-if="error.rawTle">
        <div class="section-divider"></div>

        <div class="section">
          <div class="section-header">
            <span class="section-title">原始 TLE</span>
            <t-button size="small" variant="text" @click="copyText(error.rawTle)">
              <template #icon><CopyIcon /></template>
              复制
            </t-button>
          </div>
          <pre class="raw-tle-box">{{ error.rawTle }}</pre>
        </div>
      </template>

      <div class="section-divider"></div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">原始错误信息</span>
          <t-button size="small" variant="text" @click="copyText(error.errorMessage)">
            <template #icon><CopyIcon /></template>
            复制
          </t-button>
        </div>
        <div class="error-message-box">
          {{ error.errorMessage }}
        </div>
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { CopyIcon } from 'tdesign-icons-vue-next'
import type { SyncErrorLog } from '@/api'

interface ErrorDetails {
  code?: string
  detail?: string
  hint?: string
  column?: string
  table?: string
  constraint?: string
}

interface ErrorLogWithDetails extends SyncErrorLog {
  errorDetails?: ErrorDetails
  rawTle?: string
}

const props = defineProps<{
  visible: boolean
  error: ErrorLogWithDetails
}>()

defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const hasErrorDetails = computed(() => {
  const ed = props.error.errorDetails
  return ed && (ed.code || ed.column || ed.table || ed.constraint || ed.detail || ed.hint)
})

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

function getSourceText(source: string) {
  const map: Record<string, string> = {
    'celestrak': 'CelesTrak',
    'space-track': 'Space-Track',
    'keeptrack': 'KeepTrack',
    'discos': 'ESA DISCOS',
  }
  return map[source] || source
}

function getErrorTypeTheme(type: string) {
  const map: Record<string, string> = {
    'missing_name': 'warning',
    'parse_error': 'danger',
    'duplicate': 'default',
    'database': 'danger',
    'api_error': 'warning',
    'network': 'warning',
    'rate_limit': 'danger',
    'timeout': 'warning',
    'other': 'default',
  }
  return map[type] || 'default'
}

function getErrorTypeText(type: string) {
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

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    MessagePlugin.success('已复制到剪贴板')
  }).catch(() => {
    MessagePlugin.error('复制失败')
  })
}

function copyErrorDetails() {
  const ed = props.error.errorDetails
  if (!ed) return
  const text = [
    `错误码: ${ed.code || '-'}`,
    `列名: ${ed.column || '-'}`,
    `表名: ${ed.table || '-'}`,
    `约束名: ${ed.constraint || '-'}`,
    `详细信息: ${ed.detail || '-'}`,
    `提示: ${ed.hint || '-'}`,
  ].join('\n')
  copyText(text)
}
</script>

<style scoped>
.error-detail-dialog {
  padding: 8px 0;
}

.error-detail-dialog :deep(.t-form__item) {
  margin-bottom: 12px;
}

.section-divider {
  height: 1px;
  background: var(--td-border-level-1-color);
  margin: 16px 0;
}

.section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.field-value {
  color: var(--td-text-color-primary);
}

.field-value.code {
  font-family: monospace;
  background: var(--td-bg-color-container-hover);
  padding: 2px 6px;
  border-radius: 4px;
}

.error-message-box {
  background: var(--td-bg-color-container-hover);
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  white-space: pre-wrap;
  color: var(--td-text-color-primary);
}

.raw-tle-box {
  background: var(--td-bg-color-container-hover);
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 120px;
  color: var(--td-text-color-secondary);
}
</style>
