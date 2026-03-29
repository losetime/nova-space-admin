<template>
  <div class="satellite-sync-container">
    <!-- 数据统计卡片 -->
    <t-row :gutter="16" class="stats-row">
      <t-col :span="3">
        <t-card title="TLE 数据总数" :bordered="false" class="stats-card">
          <div class="stats-value">{{ stats.tleCount.toLocaleString() }}</div>
          <div class="stats-label">轨道数据总条数</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card title="CelesTrak" :bordered="false" class="stats-card">
          <div class="stats-value">{{ (stats.celestrakCount || 0).toLocaleString() }}</div>
          <div class="stats-label">CelesTrak 数据源</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card title="KeepTrack" :bordered="false" class="stats-card">
          <div class="stats-value">{{ (stats.keepTrackCount || 0).toLocaleString() }}</div>
          <div class="stats-label">KeepTrack 数据源</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card title="元数据总数" :bordered="false" class="stats-card">
          <div class="stats-value">{{ stats.metadataCount.toLocaleString() }}</div>
          <div class="stats-label">卫星元数据条数</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card title="ESA DISCOS" :bordered="false" class="stats-card">
          <div class="stats-value">{{ stats.discosCount.toLocaleString() }}</div>
          <div class="stats-label">DISCOS 扩展数据</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card title="数据覆盖率" :bordered="false" class="stats-card stats-card--highlight">
          <div class="stats-value">{{ stats.discosCoverage }}</div>
          <div class="stats-label">DISCOS 数据覆盖率</div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 同步操作区 -->
    <t-card title="数据同步" :bordered="false" class="sync-card">
      <div class="sync-actions">
        <t-button
          theme="primary"
          :loading="syncing === 'celestrak'"
          :disabled="!!syncing"
          @click="handleSync('celestrak')"
        >
          <template #icon><CloudDownloadIcon /></template>
          CelesTrak TLE
        </t-button>
        <t-button
          theme="primary"
          variant="outline"
          :loading="syncing === 'space-track'"
          :disabled="!!syncing"
          @click="handleSync('space-track')"
        >
          <template #icon><CloudDownloadIcon /></template>
          Space-Track TLE
        </t-button>
        <t-button
          theme="primary"
          variant="outline"
          :loading="syncing === 'discos'"
          :disabled="!!syncing"
          @click="handleSync('discos')"
        >
          <template #icon><CloudDownloadIcon /></template>
          ESA DISCOS
        </t-button>
        <t-button
          theme="primary"
          variant="outline"
          :loading="syncing === 'keeptrack-tle'"
          :disabled="!!syncing"
          @click="handleSync('keeptrack-tle')"
        >
          <template #icon><CloudDownloadIcon /></template>
          KeepTrack TLE
        </t-button>
        <t-button
          theme="primary"
          variant="outline"
          :loading="syncing === 'keeptrack-meta'"
          :disabled="!!syncing"
          @click="handleSync('keeptrack-meta')"
        >
          <template #icon><CloudDownloadIcon /></template>
          KeepTrack 元数据
        </t-button>
        <t-button
          theme="warning"
          :loading="syncing === 'all'"
          :disabled="!!syncing"
          @click="handleSync('all')"
        >
          <template #icon><RefreshIcon /></template>
          完整同步
        </t-button>
      </div>

      <!-- 同步进度 -->
      <div v-if="syncStatus && syncStatus.progress" class="sync-progress">
        <div class="sync-progress-header">
          <span class="sync-task-id">任务 ID: {{ syncStatus.taskId }}</span>
          <t-tag :theme="getStatusTheme(syncStatus.status)">{{ getStatusText(syncStatus.status) }}</t-tag>
        </div>

        <div class="sync-progress-bar">
          <t-progress
            :percentage="syncStatus.progress.percentage || 0"
            :theme="syncStatus.status === 'failed' ? 'warning' : 'primary'"
            :label="false"
          />
        </div>

        <div class="sync-progress-stats">
          <span>总数: {{ syncStatus.progress.total || 0 }}</span>
          <span>已处理: {{ syncStatus.progress.processed || 0 }}</span>
          <span class="success">成功: {{ syncStatus.progress.success || 0 }}</span>
          <span class="failed">失败: {{ syncStatus.progress.failed || 0 }}</span>
        </div>

        <div v-if="syncStatus.error" class="sync-error">
          <t-alert theme="error" :message="syncStatus.error" />
        </div>
      </div>
    </t-card>

    <!-- 最近同步记录 -->
    <t-card title="最近同步" :bordered="false" class="last-sync-card">
      <div class="last-sync-info">
        <div class="last-sync-item">
          <span class="label">最近 CelesTrak 同步:</span>
          <span class="value">{{ stats.lastCelestrakSync ? formatDate(stats.lastCelestrakSync) : '暂无记录' }}</span>
        </div>
        <div class="last-sync-item">
          <span class="label">最近 KeepTrack 同步:</span>
          <span class="value">{{ stats.lastKeepTrackSync ? formatDate(stats.lastKeepTrackSync) : '暂无记录' }}</span>
        </div>
        <div class="last-sync-item">
          <span class="label">最近 DISCOS 同步:</span>
          <span class="value">{{ stats.lastDiscosSync ? formatDate(stats.lastDiscosSync) : '暂无记录' }}</span>
        </div>
      </div>
    </t-card>

    <!-- 说明信息 -->
    <t-card title="数据源说明" :bordered="false" class="info-card">
      <t-list>
        <t-list-item>
          <t-list-item-meta
            title="CelesTrak TLE"
            description="从 CelesTrak 获取活跃卫星的轨道根数数据（GROUP=active），约 14,879 颗卫星，免费无需认证。"
          />
        </t-list-item>
        <t-list-item>
          <t-list-item-meta
            title="Space-Track TLE"
            description="从 Space-Track 获取卫星轨道数据，作为 CelesTrak 的备用数据源，需要账号认证。"
          />
        </t-list-item>
        <t-list-item>
          <t-list-item-meta
            title="ESA DISCOS 元数据"
            description="从欧洲航天局 DISCOS 数据库获取卫星扩展元数据，包括质量、尺寸、运营商、任务类型等信息。"
          />
        </t-list-item>
        <t-list-item>
          <t-list-item-meta
            title="KeepTrack（需 API Key）"
            description="从 KeepTrack.space 获取卫星 TLE 和详细元数据，包括制造商、平台、设备等扩展信息。"
          />
        </t-list-item>
      </t-list>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { CloudDownloadIcon, RefreshIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import { satelliteSyncApi, type SyncType, type SyncStatus, type SyncStats, type SyncTask } from '@/api'

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

const syncing = ref<SyncType | null>(null)
const syncStatus = ref<SyncTask | null>(null)
let pollTimer: number | null = null

// 获取统计数据
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

// 获取同步状态
async function loadSyncStatus() {
  try {
    const res = await satelliteSyncApi.getStatus()
    if (res.success && res.data) {
      syncStatus.value = res.data
      if (res.data.status === 'running') {
        syncing.value = res.data.type
      } else {
        syncing.value = null
      }
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

// 轮询同步状态
function startPolling() {
  pollTimer = window.setInterval(async () => {
    if (syncing.value) {
      await loadSyncStatus()
      // 如果同步完成，刷新统计数据
      if (syncStatus.value?.status !== 'running') {
        await loadStats()
      }
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 获取状态主题
function getStatusTheme(status: SyncStatus) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'running':
      return 'primary'
    default:
      return 'default'
  }
}

// 获取状态文本
function getStatusText(status: SyncStatus) {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'running':
      return '同步中'
    default:
      return '等待中'
  }
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await Promise.all([loadStats(), loadSyncStatus()])
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.satellite-sync-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  margin-bottom: 0;
}

.stats-card {
  text-align: center;
}

.stats-card :deep(.t-card__header) {
  padding: 16px 16px 0;
}

.stats-card :deep(.t-card__body) {
  padding: 16px;
}

.stats-card--highlight {
  background: linear-gradient(135deg, #0052D9 0%, #266FE8 100%);
}

.stats-card--highlight :deep(.t-card__title),
.stats-card--highlight .stats-value,
.stats-card--highlight .stats-label {
  color: #fff;
}

.stats-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.sync-card :deep(.t-card__body) {
  padding: 24px;
}

.sync-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.sync-progress {
  background: var(--td-bg-color-container);
  border-radius: 8px;
  padding: 16px;
}

.sync-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sync-task-id {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.sync-progress-bar {
  margin-bottom: 16px;
}

.sync-progress-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.sync-progress-stats .success {
  color: var(--td-success-color);
}

.sync-progress-stats .failed {
  color: var(--td-error-color);
}

.sync-error {
  margin-top: 16px;
}

.last-sync-card :deep(.t-card__body) {
  padding: 24px;
}

.last-sync-info {
  display: flex;
  gap: 48px;
}

.last-sync-item {
  display: flex;
  gap: 8px;
}

.last-sync-item .label {
  color: var(--td-text-color-secondary);
}

.last-sync-item .value {
  color: var(--td-text-color-primary);
  font-weight: 500;
}

.info-card :deep(.t-card__body) {
  padding: 16px 24px;
}
</style>