<template>
  <div class="satellite-sync-container">
    <!-- TLE 轨道数据区域 -->
    <t-card title="TLE 轨道数据" :bordered="false" class="section-card tle-section">
      <div class="section-stats">
        <div class="stat-main">
          <span class="stat-label">总数</span>
          <span class="stat-value">{{ stats.tleCount.toLocaleString() }}</span>
        </div>
        <div class="stat-sub">
          <div class="stat-item">
            <span class="stat-sub-label">CelesTrak</span>
            <span class="stat-sub-value">{{ (stats.celestrakCount || 0).toLocaleString() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-sub-label">Space-Track</span>
            <span class="stat-sub-value">{{ (stats.tleCount - (stats.celestrakCount || 0) - (stats.keepTrackCount || 0)).toLocaleString() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-sub-label">KeepTrack</span>
            <span class="stat-sub-value">{{ (stats.keepTrackCount || 0).toLocaleString() }}</span>
          </div>
        </div>
      </div>
      <div class="section-actions">
        <t-button
          theme="primary"
          size="large"
          :loading="syncing === 'celestrak'"
          :disabled="!!syncing"
          @click="handleSync('celestrak')"
        >
          <template #icon><CloudDownloadIcon /></template>
          同步 CelesTrak（主）
        </t-button>
        <t-button
          theme="default"
          size="large"
          variant="outline"
          :loading="syncing === 'space-track'"
          :disabled="!!syncing"
          @click="handleSync('space-track')"
        >
          <template #icon><CloudDownloadIcon /></template>
          同步 Space-Track（备用）
        </t-button>
        <t-button
          theme="default"
          size="large"
          variant="outline"
          :loading="syncing === 'keeptrack-tle'"
          :disabled="!!syncing"
          @click="handleSync('keeptrack-tle')"
        >
          <template #icon><CloudDownloadIcon /></template>
          同步 KeepTrack TLE
        </t-button>
      </div>
      <div class="section-info">
        <t-tag theme="default" size="small" variant="outline">
          最近同步：{{ stats.lastCelestrakSync ? formatDate(stats.lastCelestrakSync) : '暂无记录' }}
        </t-tag>
      </div>
    </t-card>

    <!-- 卫星元数据区域 -->
    <t-card title="卫星元数据" :bordered="false" class="section-card meta-section">
      <div class="section-stats">
        <div class="stat-main">
          <span class="stat-label">总数</span>
          <span class="stat-value">{{ stats.metadataCount.toLocaleString() }}</span>
        </div>
        <div class="stat-sub">
          <div class="stat-item">
            <span class="stat-sub-label">KeepTrack</span>
            <span class="stat-sub-value">待 API Key</span>
          </div>
          <div class="stat-item">
            <span class="stat-sub-label">ESA DISCOS</span>
            <span class="stat-sub-value highlight">{{ stats.discosCount.toLocaleString() }} ({{ stats.discosCoverage }})</span>
          </div>
        </div>
      </div>
      <div class="section-actions">
        <t-button
          theme="primary"
          size="large"
          :loading="syncing === 'keeptrack-meta'"
          :disabled="!!syncing"
          @click="handleSync('keeptrack-meta')"
        >
          <template #icon><CloudDownloadIcon /></template>
          同步 KeepTrack 元数据（主）
        </t-button>
        <t-button
          theme="default"
          size="large"
          variant="outline"
          :loading="syncing === 'discos'"
          :disabled="!!syncing"
          @click="handleSync('discos')"
        >
          <template #icon><CloudDownloadIcon /></template>
          同步 ESA DISCOS（备用）
        </t-button>
      </div>
      <div class="section-info">
        <t-tag theme="default" size="small" variant="outline">
          最近 KeepTrack 同步：{{ stats.lastKeepTrackSync ? formatDate(stats.lastKeepTrackSync) : '暂无记录' }}
        </t-tag>
      </div>
    </t-card>

    <!-- 完整同步 -->
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
      </div>
    </t-card>

    <!-- 同步进度 -->
    <t-card v-if="syncStatus && syncStatus.progress" title="当前同步进度" :bordered="false" class="progress-card">
      <div class="progress-header">
        <span class="progress-task-id">任务 ID: {{ syncStatus.taskId }}</span>
        <t-tag :theme="getStatusTheme(syncStatus.status)">{{ getStatusText(syncStatus.status) }}</t-tag>
      </div>
      <div class="progress-bar">
        <t-progress
          :percentage="syncStatus.progress.percentage || 0"
          :theme="syncStatus.status === 'failed' ? 'warning' : 'primary'"
          :label="true"
        />
      </div>
      <div class="progress-stats">
        <span>总数：{{ syncStatus.progress.total || 0 }}</span>
        <span>已处理：{{ syncStatus.progress.processed || 0 }}</span>
        <span class="success">成功：{{ syncStatus.progress.success || 0 }}</span>
        <span class="failed">失败：{{ syncStatus.progress.failed || 0 }}</span>
      </div>
      <div v-if="syncStatus.error" class="progress-error">
        <t-alert theme="error" :message="syncStatus.error" />
      </div>
    </t-card>

    <!-- 数据源说明 -->
    <t-card title="数据源说明" :bordered="false" class="info-card">
      <t-row :gutter="16">
        <t-col :span="12">
          <h4>TLE 轨道数据</h4>
          <ul>
            <li><strong>CelesTrak</strong> - 主数据源，获取活跃卫星 GROUP=active，约 14,879 颗，免费无需认证</li>
            <li><strong>Space-Track</strong> - 备用数据源，需要账号认证</li>
            <li><strong>KeepTrack</strong> - 备用数据源，需要 API Key</li>
          </ul>
        </t-col>
        <t-col :span="12">
          <h4>卫星元数据</h4>
          <ul>
            <li><strong>KeepTrack</strong> - 主数据源，提供制造商、平台、设备等扩展信息，需要 API Key</li>
            <li><strong>ESA DISCOS</strong> - 备用数据源，欧洲航天局官方数据库，提供质量、尺寸、运营商等信息</li>
          </ul>
        </t-col>
      </t-row>
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

/* 区域卡片通用样式 */
.section-card {
  border-radius: 8px;
}

.section-card :deep(.t-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.section-card :deep(.t-card__body) {
  padding: 24px;
}

.tle-section {
  border-top: 3px solid var(--td-brand-color);
}

.meta-section {
  border-top: 3px solid var(--td-success-color);
}

.quick-section {
  border-top: 3px solid var(--td-warning-color);
}

/* 统计区域 */
.section-stats {
  display: flex;
  gap: 48px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--td-bg-color-container);
  border-radius: 8px;
}

.stat-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 32px;
  border-right: 2px solid var(--td-border-level-1-color);
}

.stat-label {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.stat-value {
  font-size: 36px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.stat-sub {
  display: flex;
  gap: 32px;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-sub-label {
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.stat-sub-value {
  font-size: 20px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.stat-sub-value.highlight {
  color: var(--td-brand-color);
  font-weight: 600;
}

/* 按钮区域 */
.section-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.section-info {
  display: flex;
  gap: 16px;
}

/* 快速操作 */
.quick-actions {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

/* 进度卡片 */
.progress-card {
  border-top: 3px solid var(--td-info-color);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-task-id {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  font-family: monospace;
}

.progress-bar {
  margin-bottom: 12px;
}

.progress-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.progress-stats .success {
  color: var(--td-success-color);
}

.progress-stats .failed {
  color: var(--td-error-color);
}

.progress-error {
  margin-top: 12px;
}

/* 信息卡片 */
.info-card h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.info-card ul {
  margin: 0;
  padding-left: 20px;
}

.info-card li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: var(--td-text-color-secondary);
}

.info-card li strong {
  color: var(--td-text-color-primary);
}
</style>
