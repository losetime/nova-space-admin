<template>
  <t-dialog
    :visible="visible"
    :width="SYNC_DIALOG_WIDTH"
    :footer="false"
    :body-style="{ maxHeight: '70vh', overflow: 'auto' }"
    @update:visible="onVisibleChange"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <span>同步任务详情</span>
        <t-tag v-if="task" :theme="getStatusTheme(task.status)" size="small">
          {{ getStatusText(task.status) }}
        </t-tag>
      </div>
    </template>

    <div v-if="loading" class="loading-container">
      <t-loading text="加载中..." />
    </div>

    <div v-else-if="!task" class="empty-container">
      <t-empty description="任务不存在或已被删除" />
    </div>

    <div v-else>
      <t-tabs v-model="activeTab" class="detail-tabs">
        <t-tab-panel :value="'info'" :label="'任务信息'">
          <t-card :bordered="false" class="section-card">
            <t-descriptions :column="3" bordered>
              <t-descriptions-item label="任务 ID">
                <span class="mono-text">{{ task.id }}</span>
              </t-descriptions-item>
              <t-descriptions-item label="同步类型">{{ getTypeText(task.type) }}</t-descriptions-item>
              <t-descriptions-item label="状态">
                <t-tag :theme="getStatusTheme(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </t-tag>
              </t-descriptions-item>
              <t-descriptions-item label="开始时间">{{ formatDateTime(task.startedAt) }}</t-descriptions-item>
              <t-descriptions-item label="结束时间">{{ task.completedAt ? formatDateTime(task.completedAt) : '-' }}</t-descriptions-item>
              <t-descriptions-item label="耗时">{{ durationText }}</t-descriptions-item>
              <t-descriptions-item label="错误信息" :span="3">
                <span :class="task.error ? 'error-msg' : ''">{{ task.error || '无' }}</span>
              </t-descriptions-item>
            </t-descriptions>
          </t-card>

          <t-card title="执行进度" :bordered="false" class="section-card progress-card">
            <t-progress
              :percentage="percentage"
              :status="progressStatus"
              :label="true"
            />
            <div class="progress-stats">
              <span>总数：{{ task.total }}</span>
              <span>已处理：{{ task.processed }}</span>
              <span class="stat-success">成功：{{ task.success }}</span>
              <span class="stat-skipped">跳过：{{ task.skipped }}</span>
              <span class="stat-failed">失败：{{ task.failed }}</span>
            </div>
          </t-card>
        </t-tab-panel>

        <t-tab-panel :value="'errors'" :label="`错误记录${errorTotalText}`">
          <t-card :bordered="false" class="section-card">
            <div v-if="showErrorsEmpty" class="empty-container">
              <t-empty :description="noErrorText" />
            </div>
            <template v-else>
              <div class="filter-bar">
                <t-select
                  v-model="errorTypeFilter"
                  :options="errorTypeOptions"
                  clearable
                  placeholder="错误类型"
                  class="filter-item"
                  @change="onFilterChange"
                />
                <t-select
                  v-model="sourceFilter"
                  :options="sourceOptions"
                  clearable
                  placeholder="数据源"
                  class="filter-item"
                  @change="onFilterChange"
                />
                <t-button variant="text" theme="primary" @click="resetFilters">重置</t-button>
              </div>

              <t-table
                bordered
                row-key="id"
                :columns="errorColumns"
                :data="errors"
                :loading="errorsLoading"
                :expanded-row-keys="expandedRowKeys"
                :pagination="pagination"
                size="medium"
                @page-change="onPageChange"
                @expand-change="onExpandChange"
              >
              <template #errorType="{ row }">
                <t-tag :theme="getErrorTypeTheme(row.errorType)" size="small">
                  {{ getErrorTypeText(row.errorType) }}
                </t-tag>
              </template>
              <template #source="{ row }">
                {{ getSourceText(row.source) }}
              </template>
              <template #errorMessage="{ row }">
                <span class="msg-cell" :title="row.errorMessage">{{ row.errorMessage }}</span>
              </template>
              <template #timestamp="{ row }">
                {{ formatDate(row.timestamp) }}
              </template>
              <template #expandedRow="{ row }">
                <div class="expanded-content">
                  <div class="expanded-section">
                    <div class="expanded-section-header">
                      <span class="expanded-section-title">原始错误信息</span>
                      <t-button size="small" variant="text" @click="handleCopy(row.errorMessage)">
                        <template #icon><CopyIcon /></template>
                        复制
                      </t-button>
                    </div>
                    <div class="msg-box">{{ row.errorMessage }}</div>
                  </div>

                  <div v-if="hasErrorDetails(row)" class="expanded-section">
                    <div class="expanded-section-header">
                      <span class="expanded-section-title">错误详情</span>
                      <t-button size="small" variant="text" @click="handleCopy(errorDetailsText(row))">
                        <template #icon><CopyIcon /></template>
                        复制
                      </t-button>
                    </div>
                    <div class="details-grid">
                      <div class="details-item">
                        <span class="details-label">错误码</span>
                        <span class="details-value">{{ row.errorDetails?.code || '--' }}</span>
                      </div>
                      <div class="details-item">
                        <span class="details-label">列名</span>
                        <span class="details-value">{{ row.errorDetails?.column || '--' }}</span>
                      </div>
                      <div class="details-item">
                        <span class="details-label">表名</span>
                        <span class="details-value">{{ row.errorDetails?.table || '--' }}</span>
                      </div>
                      <div class="details-item">
                        <span class="details-label">约束名</span>
                        <span class="details-value">{{ row.errorDetails?.constraint || '--' }}</span>
                      </div>
                      <div class="details-item">
                        <span class="details-label">详细信息</span>
                        <span class="details-value">{{ row.errorDetails?.detail || '--' }}</span>
                      </div>
                      <div class="details-item">
                        <span class="details-label">提示</span>
                        <span class="details-value">{{ row.errorDetails?.hint || '--' }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="row.rawTle" class="expanded-section">
                    <div class="expanded-section-header">
                      <span class="expanded-section-title">原始 TLE</span>
                      <t-button size="small" variant="text" @click="handleCopy(row.rawTle!)">
                        <template #icon><CopyIcon /></template>
                        复制
                      </t-button>
                    </div>
                    <pre class="raw-tle-box">{{ row.rawTle }}</pre>
                  </div>
                </div>
              </template>
              </t-table>
            </template>
          </t-card>
        </t-tab-panel>

        <t-tab-panel :value="'summary'" :label="'错误汇总'">
          <t-card :bordered="false" class="section-card">
            <div v-if="summary.total === 0" class="empty-container">
              <t-empty :description="noErrorText" />
            </div>
            <div v-else class="summary-content">
              <div ref="chartRef" class="summary-chart" />
              <div class="summary-list">
                <div v-for="item in sortedSummary" :key="item.errorType" class="summary-item">
                  <t-tag :theme="getErrorTypeTheme(item.errorType)" size="small">
                    {{ getErrorTypeText(item.errorType) }}
                  </t-tag>
                  <span class="summary-count">{{ item.count.toLocaleString() }}</span>
                  <span class="summary-message" :title="item.latestMessage || ''">
                    {{ item.latestMessage || '' }}
                  </span>
                </div>
              </div>
            </div>
          </t-card>
        </t-tab-panel>
      </t-tabs>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onUnmounted, shallowRef } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { CopyIcon } from 'tdesign-icons-vue-next'
import * as echarts from 'echarts'
import { satelliteSyncApi, type SyncTaskItem, type SyncErrorLog, type SyncErrorType, type ErrorLogSummaryResponse } from '@/api'
import {
  getStatusText,
  getStatusTheme,
  getTypeText,
  getSourceText,
  getErrorTypeText,
  getErrorTypeTheme,
  formatDate,
  formatDateTime,
  copyText,
  SYNC_DIALOG_WIDTH,
} from '@/utils/sync'

const props = defineProps<{
  visible: boolean
  taskId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
}>()

function onVisibleChange(val: boolean) {
  emit('update:visible', val)
}

const loading = ref(true)
const task = ref<SyncTaskItem | null>(null)
const activeTab = ref('info')

// 错误记录
const errors = ref<SyncErrorLog[]>([])
const errorsLoading = ref(false)
const expandedRowKeys = ref<Array<string | number>>([])
const errorTypeFilter = ref<SyncErrorType | undefined>(undefined)
const sourceFilter = ref<string | undefined>(undefined)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

// 错误汇总
const summary = ref<ErrorLogSummaryResponse>({ total: 0, data: [] })
const chartRef = ref<HTMLElement>()
const chart = shallowRef<echarts.ECharts>()

const errorTypeOptions: Array<{ label: string; value: SyncErrorType }> = [
  { label: '缺少名称', value: 'missing_name' },
  { label: '解析失败', value: 'parse_error' },
  { label: '重复数据', value: 'duplicate' },
  { label: '数据库错误', value: 'database' },
  { label: 'API 错误', value: 'api_error' },
  { label: '频率限制', value: 'rate_limit' },
  { label: '网络错误', value: 'network' },
  { label: '超时', value: 'timeout' },
  { label: '其他错误', value: 'other' },
]

const sourceOptions: Array<{ label: string; value: string }> = [
  { label: 'CelesTrak', value: 'celestrak' },
  { label: 'Space-Track', value: 'space-track' },
  { label: 'KeepTrack', value: 'keeptrack' },
  { label: 'ESA DISCOS', value: 'discos' },
]

const errorColumns = [
  { colKey: 'noradId', title: 'NORAD ID', width: 110 },
  { colKey: 'name', title: '名称', ellipsis: true, width: 155 },
  { colKey: 'source', title: '数据源', width: 110 },
  { colKey: 'errorType', title: '错误类型', width: 120 },
  { colKey: 'errorMessage', title: '错误信息', minWidth: 200 },
  { colKey: 'timestamp', title: '时间', width: 140 },
]

const percentage = computed(() =>
  task.value && task.value.total > 0
    ? Math.round((task.value.processed / task.value.total) * 100)
    : 0,
)

const progressStatus = computed(() => {
  if (!task.value) return 'active'
  switch (task.value.status) {
    case 'completed': return 'success'
    case 'failed': return 'error'
    case 'running': return 'active'
    default: return 'active'
  }
})

const noErrorText = computed(() => {
  if (task.value && task.value.skipped > 0) {
    return `该任务没有错误记录 · 已跳过 ${task.value.skipped.toLocaleString()} 条`
  }
  return '该任务没有错误记录'
})

const showErrorsEmpty = computed(
  () => pagination.total === 0 && !errorTypeFilter.value && !sourceFilter.value,
)

const durationText = computed(() => {
  if (!task.value) return '-'
  const start = new Date(task.value.startedAt).getTime()
  const end = task.value.completedAt
    ? new Date(task.value.completedAt).getTime()
    : Date.now()
  if (!Number.isFinite(start)) return '-'
  const seconds = Math.max(0, Math.floor((end - start) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h} 小时 ${m} 分 ${s} 秒`
  if (m > 0) return `${m} 分 ${s} 秒`
  return `${s} 秒`
})

const errorTotalText = computed(() =>
  pagination.total > 0 ? ` (${pagination.total})` : '',
)

const sortedSummary = computed(() =>
  [...summary.value.data].sort((a, b) => b.count - a.count),
)

const chartColorMap: Record<string, string> = {
  'missing_name': '#E37318',
  'parse_error': '#E34D59',
  'duplicate': '#909399',
  'database': '#E34D59',
  'api_error': '#E34D59',
  'network': '#E34D59',
  'rate_limit': '#E37318',
  'timeout': '#E37318',
  'other': '#909399',
}

function resetDetail() {
  loading.value = true
  task.value = null
  activeTab.value = 'info'
  errors.value = []
  expandedRowKeys.value = []
  errorTypeFilter.value = undefined
  sourceFilter.value = undefined
  pagination.current = 1
  pagination.total = 0
  summary.value = { total: 0, data: [] }
}

async function loadTask() {
  loading.value = true
  try {
    const res = await satelliteSyncApi.getTaskById(props.taskId)
    if (res.success) {
      task.value = res.data
    } else {
      task.value = null
    }
  } catch (error) {
    console.error('Failed to load task:', error)
    task.value = null
  } finally {
    loading.value = false
  }
}

async function loadErrors() {
  errorsLoading.value = true
  try {
    const res = await satelliteSyncApi.getTaskErrors(props.taskId, {
      page: pagination.current,
      limit: pagination.pageSize,
      errorType: errorTypeFilter.value,
      source: sourceFilter.value,
    })
    if (res.success) {
      errors.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load errors:', error)
  } finally {
    errorsLoading.value = false
  }
}

async function loadSummary() {
  try {
    const res = await satelliteSyncApi.getTaskErrorsSummary(props.taskId)
    if (res.success) {
      summary.value = res.data
    }
  } catch (error) {
    console.error('Failed to load summary:', error)
  }
}

function onPageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  loadErrors()
}

function onFilterChange() {
  pagination.current = 1
  loadErrors()
}

function resetFilters() {
  errorTypeFilter.value = undefined
  sourceFilter.value = undefined
  pagination.current = 1
  loadErrors()
}

function onExpandChange(keys: Array<string | number>) {
  expandedRowKeys.value = keys
}

function hasErrorDetails(row: SyncErrorLog) {
  const ed = row.errorDetails
  return ed && (ed.code || ed.column || ed.table || ed.constraint || ed.detail || ed.hint)
}

function errorDetailsText(row: SyncErrorLog) {
  const ed = row.errorDetails
  if (!ed) return ''
  return [
    `错误码: ${ed.code || '-'}`,
    `列名: ${ed.column || '-'}`,
    `表名: ${ed.table || '-'}`,
    `约束名: ${ed.constraint || '-'}`,
    `详细信息: ${ed.detail || '-'}`,
    `提示: ${ed.hint || '-'}`,
  ].join('\n')
}

async function handleCopy(text: string) {
  const ok = await copyText(text)
  if (ok) {
    MessagePlugin.success('已复制到剪贴板')
  } else {
    MessagePlugin.error('复制失败')
  }
}

function renderSummaryChart() {
  if (!chartRef.value) return
  if (chart.value && chart.value.getDom() !== chartRef.value) {
    chart.value.dispose()
    chart.value = undefined
  }
  if (!chart.value) {
    chart.value = echarts.init(chartRef.value)
  }
  const data = sortedSummary.value
  chart.value.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((i) => getErrorTypeText(i.errorType)),
      axisLabel: { interval: 0 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        type: 'bar',
        barMaxWidth: 48,
        data: data.map((i) => ({
          value: i.count,
          itemStyle: { color: chartColorMap[i.errorType] || '#0052D9', borderRadius: [4, 4, 0, 0] },
        })),
      },
    ],
  })
}

function disposeChart() {
  if (chart.value) {
    chart.value.dispose()
    chart.value = undefined
  }
}

function handleOpened() {
  if (activeTab.value === 'summary') {
    nextTick(() => renderSummaryChart())
  }
  window.addEventListener('resize', handleResize)
}

function handleClosed() {
  window.removeEventListener('resize', handleResize)
}

function handleResize() {
  chart.value?.resize()
}

watch(
  () => props.visible,
  async (val) => {
    if (val && props.taskId) {
      resetDetail()
      await loadTask()
      await Promise.all([loadErrors(), loadSummary()])
    } else {
      disposeChart()
    }
  },
  { immediate: true },
)

watch(
  activeTab,
  async (val) => {
    if (val === 'summary') {
      await nextTick()
      renderSummaryChart()
    } else {
      disposeChart()
    }
  },
)

watch(
  () => summary.value,
  async () => {
    await nextTick()
    renderSummaryChart()
  },
  { deep: true },
)

onUnmounted(() => {
  disposeChart()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.detail-tabs :deep(.t-tabs__header) {
  margin-bottom: 0;
}

.section-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.progress-card {
  margin-top: 16px;
}

.progress-stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  margin-top: 12px;
}

.stat-success {
  color: var(--td-success-color);
}

.stat-skipped {
  color: var(--td-warning-color);
}

.stat-failed {
  color: var(--td-error-color);
}

.mono-text {
  font-family: monospace;
}

.error-msg {
  color: var(--td-error-color);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-item {
  width: 180px;
}

.msg-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expanded-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.expanded-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expanded-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expanded-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.msg-box {
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
  color: var(--td-text-color-secondary);
  margin: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
  background: var(--td-bg-color-container-hover);
  border-radius: 6px;
  padding: 12px;
}

.details-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.details-label {
  color: var(--td-text-color-secondary);
  white-space: nowrap;
}

.details-value {
  color: var(--td-text-color-primary);
  word-break: break-all;
}

.summary-content {
  display: flex;
  gap: 32px;
}

.summary-chart {
  flex: 1;
  height: 320px;
}

.summary-list {
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--td-bg-color-container-hover);
  border-radius: 6px;
}

.summary-count {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 60px;
  text-align: right;
}

.summary-message {
  flex: 1;
  color: var(--td-text-color-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
