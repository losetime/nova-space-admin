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
    </t-card>

    <!-- 快速操作 -->
    <t-card title="快速操作" :bordered="false" class="section-card quick-section">
      <div class="quick-actions">
        <t-button
          theme="warning"
          size="large"
          :loading="syncing === 'all'"
          :disabled="!!syncing"
          @click="handleSync('all')"
        >
          <template #icon><RefreshIcon /></template>
          完整同步（所有数据源）
        </t-button>
        <t-link theme="primary" size="small" @click="showSyncDetail('all')">查看详情</t-link>
      </div>
    </t-card>

    <!-- 同步进度 -->
    <t-card v-if="syncStatus && syncStatus.progress" title="当前同步进度" :bordered="false" class="progress-card">
      <div class="progress-header">
        <span class="progress-task-id">任务 ID: {{ syncStatus.taskId }}</span>
        <t-tag :theme="getStatusTheme(syncStatus.status)">{{ getStatusText(syncStatus.status) }}</t-tag>
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
      <t-alert v-if="syncStatus.error" theme="error" :message="syncStatus.error" style="margin-top: 12px" />
    </t-card>

    <!-- 同步详情弹窗 -->
    <t-dialog
      v-model:visible="syncDetailVisible"
      :header="syncDetailTitle"
      width="800px"
      :footer="false"
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
              <t-link theme="primary" @click="showTaskErrors(row)">查看失败记录</t-link>
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
            max-height="200px"
          >
            <template #errorType="{ row }">
              <t-tag :theme="getErrorTypeTheme(row.errorType)" size="small">
                {{ getErrorTypeText(row.errorType) }}
              </t-tag>
            </template>
            <template #timestamp="{ row }">
              {{ formatDate(row.timestamp) }}
            </template>
          </t-table>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { RefreshIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
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
  discosCoverage: '0%',
  celestrakCount: 0,
  keepTrackCount: 0,
  lastCelestrakSync: undefined,
  lastKeepTrackSync: undefined,
  lastDiscosSync: undefined,
})

// 同步状态
const syncing = ref<SyncType | null>(null)
const syncStatus = ref<SyncTask | null>(null)
let pollTimer: number | null = null

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
    count: stats.metadataCount.toLocaleString(),
    role: '主数据源',
    roleTheme: 'primary',
    lastSync: stats.lastKeepTrackSync,
    syncType: 'keeptrack-meta' as SyncType,
  },
  {
    source: 'discos',
    name: 'ESA DISCOS',
    icon: '🇪🇺',
    count: stats.discosCount.toLocaleString(),
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

const taskColumns = [
  { colKey: 'id', title: '任务 ID', width: 140, ellipsis: true },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'progress', title: '进度', width: 100 },
  { colKey: 'startedAt', title: '开始时间', width: 120 },
  { colKey: 'action', title: '操作', width: 100 },
]

const errorColumns = [
  { colKey: 'noradId', title: 'NORAD ID', width: 80 },
  { colKey: 'name', title: '名称', ellipsis: true },
  { colKey: 'errorType', title: '错误类型', width: 100 },
  { colKey: 'errorMessage', title: '错误信息', ellipsis: true },
  { colKey: 'timestamp', title: '时间', width: 120 },
]

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

// 加载同步状态
async function loadSyncStatus() {
  try {
    const res = await satelliteSyncApi.getStatus()
    if (res.success && res.data) {
      syncStatus.value = res.data
      syncing.value = res.data.status === 'running' ? res.data.type : null
    } else {
      syncStatus.value = null
      syncing.value = null
    }
  } catch (error) {
    console.error('Failed to load sync status:', error)
  }
}

// 开始同步
async function handleSync(type: SyncType) {
  try {
    syncing.value = type
    const res = await satelliteSyncApi.startSync(type)
    if (res.success) {
      syncStatus.value = res.data
      MessagePlugin.success('同步任务已启动')
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

function onTaskPageChange(page: number) {
  taskPagination.current = page
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
  if (pollTimer) return
  pollTimer = window.setInterval(async () => {
    await loadSyncStatus()
    // 同步完成或没有任务时停止轮询
    if (syncStatus.value?.status !== 'running') {
      stopPolling()
      await loadStats()
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 监听同步状态，运行时开始轮询
watch(syncStatus, (status) => {
  if (status?.status === 'running') {
    startPolling()
  }
})

function getStatusTheme(status: SyncStatus) {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'running': return 'primary'
    default: return 'default'
  }
}

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
    'keeptrack-tle': 'KeepTrack TLE',
    'keeptrack-meta': 'KeepTrack 元数据',
    'discos': 'ESA DISCOS',
    'all': '完整同步',
  }
  return map[type] || type
}

function getErrorTypeTheme(type: string) {
  const map: Record<string, string> = {
    'missing_name': 'warning',
    'parse_error': 'danger',
    'duplicate': 'default',
    'database': 'danger',
  }
  return map[type] || 'default'
}

function getErrorTypeText(type: string) {
  const map: Record<string, string> = {
    'missing_name': '缺少名称',
    'parse_error': '解析失败',
    'duplicate': '重复数据',
    'database': '数据库错误',
  }
  return map[type] || type
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
  await Promise.all([loadStats(), loadSyncStatus()])
  // 如果有任务正在运行，才开始轮询
  if (syncStatus.value?.status === 'running') {
    startPolling()
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

.quick-section :deep(.t-card__body) {
  padding: 16px 24px;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 16px;
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
</style>