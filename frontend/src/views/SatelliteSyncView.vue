<template>
  <div class="satellite-sync-container">
    <!-- TLE 轨道数据表格 -->
    <t-card title="TLE 轨道数据" :bordered="false" class="section-card">
      <t-table
        bordered
        :columns="tleSourceColumns"
        :data="tleSourceData"
        row-key="source"
      >
        <template #source="{ row }">
          <div class="source-cell">
            <span class="source-icon">{{ row.icon }}</span>
            <span class="source-name">{{ row.name }}</span>
          </div>
        </template>
        <template #count="{ row }">
          <span class="count-value">{{ row.count.toLocaleString() }}</span>
        </template>
        <template #role="{ row }">
          <t-tag :theme="row.roleTheme" size="small">{{ row.role }}</t-tag>
        </template>
        <template #lastSync="{ row }">
          {{ row.lastSync ? formatDate(row.lastSync) : '暂无记录' }}
        </template>
        <template #action="{ row }">
          <t-space>
            <t-button
              size="small"
              :loading="syncing === row.syncType"
              :disabled="!!syncing"
              @click="handleSync(row.syncType)"
            >
              同步
            </t-button>
            <t-link
              theme="primary"
              @click="showSyncDetail(row.syncType)"
            >
              查看详情
            </t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 卫星元数据表格 -->
    <t-card title="卫星元数据" :bordered="false" class="section-card">
      <t-table
        bordered
        :columns="metaSourceColumns"
        :data="metaSourceData"
        row-key="source"
      >
        <template #source="{ row }">
          <div class="source-cell">
            <span class="source-icon">{{ row.icon }}</span>
            <span class="source-name">{{ row.name }}</span>
          </div>
        </template>
        <template #count="{ row }">
          <span class="count-value">{{ row.count }}</span>
        </template>
        <template #role="{ row }">
          <t-tag :theme="row.roleTheme" size="small">{{ row.role }}</t-tag>
        </template>
        <template #lastSync="{ row }">
          {{ row.lastSync ? formatDate(row.lastSync) : '暂无记录' }}
        </template>
        <template #action="{ row }">
          <t-space>
            <t-button
              size="small"
              :loading="syncing === row.syncType"
              :disabled="!!syncing"
              @click="handleSync(row.syncType)"
            >
              同步
            </t-button>
            <t-link
              theme="primary"
              @click="showSyncDetail(row.syncType)"
            >
              查看详情
            </t-link>
          </t-space>
        </template>
      </t-table>
      <div class="cron-control">
        <div class="cron-label">
          <span class="cron-title">定时同步</span>
          <span class="cron-desc">每小时自动同步 KeepTrack 元数据</span>
        </div>
        <t-switch
          v-model="cronEnabled"
          :loading="cronLoading"
          @change="handleCronToggle"
        />
      </div>
    </t-card>

    <!-- 同步进度 -->
    <t-card v-if="syncStatus && syncStatus.progress" title="当前同步进度" :bordered="false" class="progress-card">
      <div class="progress-header">
        <span class="progress-task-id">任务 ID: {{ syncStatus.taskId }}</span>
        <div class="progress-header-actions">
          <t-tag :theme="getStatusTheme(syncStatus.status)">{{ getStatusText(syncStatus.status) }}</t-tag>
          <t-button
            v-if="syncStatus.status === 'running'"
            theme="danger"
            size="small"
            :loading="stopping"
            @click="handleStop"
          >
            停止
          </t-button>
        </div>
      </div>
      <t-progress
        :percentage="syncStatus.progress.percentage || 0"
        :theme="syncStatus.status === 'failed' ? 'warning' : 'primary'"
        :label="true"
      />
      <div class="progress-stats">
        <span>总数：{{ syncStatus.progress.total || 0 }}</span>
        <span>已处理：{{ syncStatus.progress.processed || 0 }}</span>
        <span class="success">成功：{{ syncStatus.progress.success || 0 }}</span>
        <span class="failed">失败：{{ syncStatus.progress.failed || 0 }}</span>
      </div>
      <!-- 最近错误日志 -->
      <div v-if="syncStatus.recentErrors && syncStatus.recentErrors.length > 0" class="recent-errors">
        <t-alert theme="warning" title="最近错误" style="margin-top: 12px">
          <template #message>
            <div class="error-list">
              <div v-for="(err, idx) in syncStatus.recentErrors" :key="idx" class="error-item">
                <span class="error-norad">[{{ err.noradId }}]</span>
                <span class="error-name">{{ err.name }}</span>
                <span class="error-type">{{ getErrorTypeText(err.errorType) }}</span>
                <span class="error-message">{{ err.errorMessage }}</span>
              </div>
            </div>
          </template>
        </t-alert>
      </div>
      <t-alert v-if="syncStatus.error" theme="error" :message="syncStatus.error" style="margin-top: 12px" />
    </t-card>

    <!-- 同步详情弹窗 -->
    <t-dialog
      v-model:visible="syncDetailVisible"
      :header="syncDetailTitle"
      :footer="false"
      mode="full-screen"
      class="sync-detail-dialog"
    >
      <div class="sync-detail-content">
        <!-- 历史任务列表 -->
        <div class="task-history">
          <h4>同步任务历史</h4>
          <t-table
            bordered
            :columns="taskColumns"
            :data="syncTasks"
            :loading="tasksLoading"
            :pagination="taskPagination"
            row-key="id"
            size="small"
            @page-change="onTaskPageChange"
          >
            <template #status="{ row }">
              <t-tag :theme="getStatusTheme(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </t-tag>
            </template>
            <template #progress="{ row }">
              <span>{{ row.success }}/{{ row.total }}</span>
              <span v-if="row.failed > 0" class="failed-highlight"> (失败 {{ row.failed }})</span>
            </template>
            <template #startedAt="{ row }">
              {{ formatDate(row.startedAt) }}
            </template>
            <template #action="{ row }">
              <t-link
                v-if="row.failed > 0"
                theme="primary"
                @click="showTaskErrors(row)"
              >
                查看失败记录 ({{ row.failed }})
              </t-link>
              <t-link
                v-else-if="row.status === 'failed'"
                theme="primary"
                @click="showTaskErrors(row)"
              >
                查看错误日志
              </t-link>
              <span v-else style="color: var(--td-text-color-disabled)">
                无失败记录
              </span>
            </template>
          </t-table>
        </div>

        <!-- 失败记录 -->
        <div v-if="selectedTask" class="error-records">
          <h4>失败记录 - {{ selectedTask.id }}</h4>
          <t-table
            bordered
            :columns="errorColumns"
            :data="taskErrors"
            :loading="errorsLoading"
            row-key="id"
            size="small"
            max-height="400px"
          >
            <template #errorType="{ row }">
              <t-tag :theme="getErrorTypeTheme(row.errorType)" size="small">
                {{ getErrorTypeText(row.errorType) }}
              </t-tag>
            </template>
            <template #timestamp="{ row }">
              {{ formatDate(row.timestamp) }}
            </template>
            <template #action="{ row }">
              <t-button size="small" variant="text" @click="showErrorDetailDialog(row)">
                详情
              </t-button>
            </template>
          </t-table>
        </div>
      </div>
    </t-dialog>

    <!-- 错误详情弹窗 -->
    <ErrorDetailDialog
      v-if="selectedError"
      v-model:visible="errorDetailVisible"
      :error="selectedError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import ErrorDetailDialog from '@/components/ErrorDetailDialog.vue'
import {
  satelliteSyncApi,
  type SyncType,
  type SyncStatus,
  type SyncStats,
  type SyncTask,
  type SyncTaskItem,
  type SyncErrorLog,
} from '@/api'

// 统计数据
const stats = reactive<SyncStats>({
  tleCount: 0,
  metadataCount: 0,
  discosCount: 0,
  keepTrackMetadataCount: 0,
  spaceTrackMetadataCount: 0,
  discosCoverage: '0%',
  keepTrackCoverage: '0%',
  spaceTrackCoverage: '0%',
  celestrakCount: 0,
  keepTrackCount: 0,
  spaceTrackTleCount: 0,
  lastCelestrakSync: undefined,
  lastKeepTrackSync: undefined,
  lastDiscosSync: undefined,
  lastSpaceTrackSync: undefined,
})

// 同步状态
const syncing = ref<SyncType | null>(null)
const syncStatus = ref<SyncTask | null>(null)
const stopping = ref(false) // 标记是否正在停止
let pollTimer: number | null = null
const isPolling = ref(false) // 标记是否正在轮询

// 定时任务状态
const cronEnabled = ref(false) // 默认关闭
const cronLoading = ref(false)

// TLE 数据源表格
const tleSourceColumns = [
  { colKey: 'source', title: '数据源', width: 150 },
  { colKey: 'count', title: '数据数量', width: 100 },
  { colKey: 'role', title: '角色', width: 100 },
  { colKey: 'lastSync', title: '最近同步', width: 140 },
  { colKey: 'action', title: '操作', width: 160 },
]

const tleSourceData = computed(() => [
  {
    source: 'keeptrack',
    name: 'KeepTrack',
    icon: '📡',
    count: stats.keepTrackCount || 0,
    role: '主数据源',
    roleTheme: 'primary',
    lastSync: stats.lastKeepTrackSync,
    syncType: 'keeptrack-tle' as SyncType,
  },
  {
    source: 'space-track',
    name: 'Space-Track',
    icon: '🛰️',
    count: stats.tleCount - (stats.celestrakCount || 0) - (stats.keepTrackCount || 0),
    role: '备用',
    roleTheme: 'default',
    lastSync: stats.lastCelestrakSync,
    syncType: 'space-track' as SyncType,
  },
  {
    source: 'celestrak',
    name: 'CelesTrak',
    icon: '🌐',
    count: stats.celestrakCount || 0,
    role: '备用',
    roleTheme: 'default',
    lastSync: stats.lastCelestrakSync,
    syncType: 'celestrak' as SyncType,
  },
])

// 元数据表格
const metaSourceColumns = [
  { colKey: 'source', title: '数据源', width: 150 },
  { colKey: 'count', title: '数据数量', width: 100 },
  { colKey: 'role', title: '角色', width: 100 },
  { colKey: 'lastSync', title: '最近同步', width: 140 },
  { colKey: 'action', title: '操作', width: 160 },
]

const metaSourceData = computed(() => [
  {
    source: 'keeptrack-meta',
    name: 'KeepTrack',
    icon: '📡',
    count: stats.keepTrackMetadataCount.toLocaleString(),
    coverage: stats.keepTrackCoverage,
    role: '主数据源',
    roleTheme: 'primary',
    lastSync: stats.lastKeepTrackSync,
    syncType: 'keeptrack-meta' as SyncType,
  },
  {
    source: 'space-track-meta',
    name: 'Space-Track',
    icon: '🛰️',
    count: stats.spaceTrackMetadataCount.toLocaleString(),
    coverage: stats.spaceTrackCoverage,
    role: '备用',
    roleTheme: 'default',
    lastSync: stats.lastSpaceTrackSync,
    syncType: 'space-track-meta' as SyncType,
  },
  {
    source: 'discos',
    name: 'ESA DISCOS',
    icon: '🇪🇺',
    count: stats.discosCount.toLocaleString(),
    coverage: stats.discosCoverage,
    role: '备用',
    roleTheme: 'default',
    lastSync: stats.lastDiscosSync,
    syncType: 'discos' as SyncType,
  },
])

// 同步详情弹窗
const syncDetailVisible = ref(false)
const syncDetailTitle = ref('')
const currentSyncType = ref<SyncType | null>(null)
const syncTasks = ref<SyncTaskItem[]>([])
const tasksLoading = ref(false)
const taskPagination = reactive({ current: 1, pageSize: 5, total: 0 })

// 失败记录
const selectedTask = ref<SyncTaskItem | null>(null)
const taskErrors = ref<SyncErrorLog[]>([])
const errorsLoading = ref(false)

// 错误详情弹窗
const errorDetailVisible = ref(false)
const selectedError = ref<SyncErrorLog | null>(null)

const taskColumns = [
  { colKey: 'id', title: '任务 ID', width: 140, ellipsis: true },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'progress', title: '进度', width: 100 },
  { colKey: 'startedAt', title: '开始时间', width: 120 },
  { colKey: 'action', title: '操作', width: 100 },
]

const errorColumns = [
  { colKey: 'noradId', title: 'NORAD ID' },
  { colKey: 'name', title: '名称', ellipsis: true, width: 600 },
  { colKey: 'errorType', title: '错误类型' },
  { colKey: 'timestamp', title: '时间' },
  { colKey: 'action', title: '操作' },
]

function showErrorDetailDialog(error: SyncErrorLog) {
  selectedError.value = error
  errorDetailVisible.value = true
}

// 加载统计数据
async function loadStats() {
  try {
    const res = await satelliteSyncApi.getStats()
    if (res.success) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// 加载定时任务状态
async function loadCronStatus() {
  try {
    const res = await satelliteSyncApi.getCronStatus()
    if (res.success) {
      cronEnabled.value = res.data.enabled
    }
  } catch (error) {
    console.error('Failed to load cron status:', error)
  }
}

// 切换定时任务
async function handleCronToggle(enabled: boolean) {
  try {
    cronLoading.value = true
    const res = await satelliteSyncApi.toggleCron(enabled)
    if (res.success) {
      cronEnabled.value = res.data.enabled
      MessagePlugin.success(res.data.message)
    } else {
      MessagePlugin.error(res.message || '操作失败')
      cronEnabled.value = !enabled // 恢复原状态
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
    cronEnabled.value = !enabled // 恢复原状态
  } finally {
    cronLoading.value = false
  }
}

// 加载同步状态
async function loadSyncStatus() {
  try {
    const res = await satelliteSyncApi.getStatus()
    console.log('[Sync] getStatus response:', res)
    if (res.success && res.data) {
      syncStatus.value = res.data
      console.log('[Sync] syncStatus updated:', syncStatus.value)
      // 只有运行中的任务才设置 syncing 状态
      if (res.data.status === 'running') {
        console.log('[Sync] status is running, setting syncing to:', res.data.type)
        syncing.value = res.data.type
      } else {
        // 任务已完成或失败，清除 syncing 状态
        console.log('[Sync] status is not running, clearing syncing')
        syncing.value = null
      }
    } else {
      console.log('[Sync] no data, clearing status')
      syncStatus.value = null
      syncing.value = null
    }
  } catch (error) {
    console.error('Failed to load sync status:', error)
  }
}

// 开始同步
async function handleSync(type: SyncType) {
  console.log('[Sync] handleSync called with type:', type)
  try {
    syncing.value = type
    const res = await satelliteSyncApi.startSync(type)
    console.log('[Sync] startSync response:', res)
    if (res.success) {
      syncStatus.value = res.data
      console.log('[Sync] syncStatus set to:', syncStatus.value)
      MessagePlugin.success('同步任务已启动')
      // 开始轮询
      startPolling()
    } else {
      MessagePlugin.error(res.message || '启动同步失败')
      syncing.value = null
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '启动同步失败')
    syncing.value = null
  }
}

// 显示同步详情
async function showSyncDetail(type: SyncType) {
  currentSyncType.value = type
  syncDetailTitle.value = `${getTypeText(type)} 同步详情`
  syncDetailVisible.value = true
  selectedTask.value = null
  taskErrors.value = []
  await loadSyncTasks(type)
}

// 停止同步
async function handleStop() {
  try {
    stopping.value = true
    const res = await satelliteSyncApi.stopSync()
    console.log('[Sync] stopSync response:', res)
    if (res.success) {
      MessagePlugin.success('已请求停止同步任务')
      // 继续轮询直到任务状态变为 failed
    } else {
      MessagePlugin.error(res.message || '停止同步失败')
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '停止同步失败')
  } finally {
    stopping.value = false
  }
}

// 加载该类型的同步任务
async function loadSyncTasks(type: SyncType) {
  tasksLoading.value = true
  try {
    const res = await satelliteSyncApi.getTaskList({
      page: taskPagination.current,
      limit: taskPagination.pageSize,
      type,
    })
    if (res.success) {
      syncTasks.value = res.data.data
      taskPagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    tasksLoading.value = false
  }
}

function onTaskPageChange(pageInfo: { current: number; pageSize: number }) {
  taskPagination.current = pageInfo.current
  taskPagination.pageSize = pageInfo.pageSize
  if (currentSyncType.value) {
    loadSyncTasks(currentSyncType.value)
  }
}

// 显示任务失败记录
async function showTaskErrors(task: SyncTaskItem) {
  selectedTask.value = task
  taskErrors.value = []
  errorsLoading.value = true
  try {
    const res = await satelliteSyncApi.getTaskErrors(task.id)
    if (res.success) {
      taskErrors.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to load errors:', error)
  } finally {
    errorsLoading.value = false
  }
}

// 轮询（只在同步运行时）
function startPolling() {
  // 如果已经在轮询中，不要重复启动
  if (isPolling.value) {
    console.log('[Sync] already polling, skipping')
    return
  }

  console.log('[Sync] starting polling')
  isPolling.value = true

  const poll = async () => {
    await loadSyncStatus()

    // 同步完成、失败或没有任务时停止轮询
    if (!syncStatus.value || syncStatus.value?.status !== 'running') {
      console.log('[Sync] stopping poll, status:', syncStatus.value?.status)
      stopPolling()
      // 同步完成后刷新统计数据
      await loadStats()
      // 清除 syncing 状态，解锁按钮
      syncing.value = null
    } else {
      console.log('[Sync] continuing poll, status:', syncStatus.value?.status)
      // 继续轮询
      pollTimer = window.setTimeout(poll, 2000)
    }
  }

  poll()
}

function stopPolling() {
  isPolling.value = false
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

// 监听同步状态，运行时开始轮询
// 注意：不再使用 watch 自动触发轮询，避免逻辑混乱
// 轮询只在 onMounted 和 handleSync 中手动控制


function getStatusText(status: SyncStatus) {
  switch (status) {
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'running': return '运行中'
    default: return '等待中'
  }
}

function getTypeText(type: SyncType) {
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

function getErrorTypeTheme(type: string) {
  if (!type) return 'default'
  const map: Record<string, string> = {
    'missing_name': 'warning',
    'parse_error': 'danger',
    'duplicate': 'default',
    'database': 'danger',
    'api_error': 'danger',
    'network': 'danger',
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
    'timeout': '超时',
    'other': '其他错误',
  }
  return map[type] || type
}

function getStatusTheme(status: SyncStatus) {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'running': return 'primary'
    default: return 'default'
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  console.log('[Sync] onMounted, loading initial state')
  await Promise.all([loadStats(), loadSyncStatus(), loadCronStatus()])
  console.log('[Sync] initial state loaded, syncStatus:', syncStatus.value)
  // 如果有任务正在运行，才开始轮询
  if (syncStatus.value?.status === 'running') {
    console.log('[Sync] initial status is running, starting polling')
    startPolling()
  } else {
    console.log('[Sync] initial status is not running, clearing syncing')
    // 页面加载时任务已完成或失败，清除 syncing 状态
    syncing.value = null
  }
})

onUnmounted(() => stopPolling())
</script>

<style scoped>
.satellite-sync-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  border-radius: 12px;
}

.section-card :deep(.t-card__header) {
  padding: 16px 24px;
}

.section-card :deep(.t-card__body) {
  padding: 16px 24px;
}

.cron-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--td-bg-color-container);
  border-radius: 8px;
  margin-top: 16px;
}

.cron-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cron-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.cron-desc {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.source-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-icon {
  font-size: 18px;
}

.source-name {
  font-weight: 500;
}

.count-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.progress-card {
  border-top: 3px solid var(--td-brand-color);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-task-id {
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.progress-stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  margin-top: 12px;
}

.success {
  color: var(--td-success-color);
}

.failed {
  color: var(--td-error-color);
}

.failed-highlight {
  color: var(--td-error-color);
  font-weight: 600;
}

/* 最近错误列表 */
.error-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.error-item:last-child {
  border-bottom: none;
}

.error-norad {
  font-weight: 600;
  color: var(--td-error-color);
  white-space: nowrap;
}

.error-name {
  color: var(--td-text-color-primary);
  white-space: nowrap;
}

.error-type {
  color: var(--td-text-color-secondary);
  white-space: nowrap;
}

.error-message {
  color: var(--td-text-color-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-history h4,
.error-records h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}

.sync-detail-dialog :deep(.t-dialog) {
  height: 80vh;
}

.sync-detail-dialog :deep(.t-dialog__body) {
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}
</style>