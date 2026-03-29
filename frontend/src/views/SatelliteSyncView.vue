<template>
  <div class="satellite-sync-container">
    <!-- TLE 轨道数据区域 -->
    <t-card title="TLE 轨道数据" :bordered="false" class="section-card tle-section">
      <div class="stats-row">
        <div class="stat-total">
          <span class="stat-label">卫星总数</span>
          <span class="stat-value">{{ stats.tleCount.toLocaleString() }}</span>
        </div>
        <div class="stat-sources">
          <div class="source-item primary">
            <span class="source-icon">📡</span>
            <span class="source-name">KeepTrack</span>
            <span class="source-value">{{ (stats.keepTrackCount || 0).toLocaleString() }}</span>
            <span class="source-badge">主数据源</span>
          </div>
          <div class="source-item">
            <span class="source-icon">🛰️</span>
            <span class="source-name">Space-Track</span>
            <span class="source-value">{{ (stats.tleCount - (stats.celestrakCount || 0) - (stats.keepTrackCount || 0)).toLocaleString() }}</span>
            <span class="source-badge">备用</span>
          </div>
          <div class="source-item">
            <span class="source-icon">🌐</span>
            <span class="source-name">CelesTrak</span>
            <span class="source-value">{{ (stats.celestrakCount || 0).toLocaleString() }}</span>
            <span class="source-badge">兜底</span>
          </div>
        </div>
      </div>
      <div class="actions-row">
        <div class="actions">
          <t-button
            theme="primary"
            :loading="syncing === 'keeptrack-tle'"
            :disabled="!!syncing"
            @click="handleSync('keeptrack-tle')"
          >
            <template #icon><CloudDownloadIcon /></template>
            同步 KeepTrack TLE
          </t-button>
          <t-button
            variant="outline"
            :loading="syncing === 'space-track'"
            :disabled="!!syncing"
            @click="handleSync('space-track')"
          >
            <template #icon><CloudDownloadIcon /></template>
            同步 Space-Track
          </t-button>
          <t-button
            variant="outline"
            :loading="syncing === 'celestrak'"
            :disabled="!!syncing"
            @click="handleSync('celestrak')"
          >
            <template #icon><CloudDownloadIcon /></template>
            同步 CelesTrak
          </t-button>
        </div>
        <div class="sync-status">
          <check-circle-filled v-if="stats.lastCelestrakSync" :style="{ color: 'var(--td-success-color)' }" />
          <span>最近同步：{{ stats.lastCelestrakSync ? formatDate(stats.lastCelestrakSync) : '暂无记录' }}</span>
        </div>
      </div>
    </t-card>

    <!-- 卫星元数据区域 -->
    <t-card title="卫星元数据" :bordered="false" class="section-card meta-section">
      <div class="stats-row">
        <div class="stat-total">
          <span class="stat-label">卫星总数</span>
          <span class="stat-value">{{ stats.metadataCount.toLocaleString() }}</span>
        </div>
        <div class="stat-sources">
          <div class="source-item primary">
            <span class="source-icon">📡</span>
            <span class="source-name">KeepTrack</span>
            <span class="source-value">待 API Key</span>
            <span class="source-badge">主数据源</span>
          </div>
          <div class="source-item">
            <span class="source-icon">🇪🇺</span>
            <span class="source-name">ESA DISCOS</span>
            <span class="source-value highlight">{{ stats.discosCount.toLocaleString() }}</span>
            <span class="source-badge">备用</span>
          </div>
        </div>
      </div>
      <div class="actions-row">
        <div class="actions">
          <t-button
            theme="primary"
            :loading="syncing === 'keeptrack-meta'"
            :disabled="!!syncing"
            @click="handleSync('keeptrack-meta')"
          >
            <template #icon><CloudDownloadIcon /></template>
            同步 KeepTrack 元数据
          </t-button>
          <t-button
            variant="outline"
            :loading="syncing === 'discos'"
            :disabled="!!syncing"
            @click="handleSync('discos')"
          >
            <template #icon><CloudDownloadIcon /></template>
            同步 ESA DISCOS
          </t-button>
        </div>
        <div class="sync-status">
          <check-circle-filled v-if="stats.lastKeepTrackSync" :style="{ color: 'var(--td-success-color)' }" />
          <span>最近同步：{{ stats.lastKeepTrackSync ? formatDate(stats.lastKeepTrackSync) : '暂无记录' }}</span>
        </div>
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
            <li><strong>KeepTrack</strong> - 主数据源，提供 TLE 和扩展元数据，需要 API Key</li>
            <li><strong>Space-Track</strong> - 备用数据源，需要账号认证</li>
            <li><strong>CelesTrak</strong> - 兜底数据源，获取活跃卫星 GROUP=active，免费无需认证</li>
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
import { CloudDownloadIcon, RefreshIcon, CheckCircleFilledIcon } from 'tdesign-icons-vue-next'
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
  border-radius: 12px;
  overflow: hidden;
}

.section-card :deep(.t-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  background: var(--td-bg-color-container);
}

.section-card :deep(.t-card__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.section-card :deep(.t-card__body) {
  padding: 20px 24px;
}

/* 顶部彩色边框 */
.tle-section {
  border-top: 3px solid var(--td-brand-color);
}

.meta-section {
  border-top: 3px solid var(--td-success-color);
}

.quick-section {
  border-top: 3px solid var(--td-warning-color);
}

/* 统计行 */
.stats-row {
  margin-bottom: 20px;
}

.stat-total {
  margin-bottom: 16px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--td-text-color-primary);
  letter-spacing: -0.5px;
}

/* 数据源列表 */
.stat-sources {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--td-bg-color-container);
  transition: all 0.2s ease;
}

.source-item:hover {
  background: var(--td-bg-color-container-hover);
}

.source-item.primary {
  background: linear-gradient(135deg, var(--td-brand-color-1) 0%, var(--td-brand-color-2) 100%);
}

.source-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  min-width: 90px;
}

.source-item.primary .source-name {
  color: var(--td-brand-color);
  font-weight: 600;
}

.source-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-left: auto;
  margin-right: 12px;
  font-variant-numeric: tabular-nums;
}

.source-value.highlight {
  color: var(--td-brand-color);
}

.source-item.primary .source-value {
  color: var(--td-brand-color);
}

.source-badge {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--td-bg-color-component);
  flex-shrink: 0;
}

.source-item.primary .source-badge {
  background: var(--td-brand-color);
  color: #fff;
}

/* 操作行 */
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--td-border-level-1-color);
}

.actions {
  display: flex;
  gap: 8px;
}

.actions .t-button {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}

.actions .t-button:first-child {
  min-width: 140px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.sync-status :deep(.t-icon) {
  font-size: 16px;
}

/* 快速操作 */
.quick-actions {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.quick-actions .t-button {
  min-width: 200px;
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
  font-size: 13px;
  color: var(--td-text-color-secondary);
  font-family: 'JetBrains Mono', monospace;
}

.progress-bar {
  margin-bottom: 12px;
}

.progress-stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
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
.info-card :deep(.t-card__header) {
  background: transparent;
}

.info-card h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.info-card ul {
  margin: 0;
  padding-left: 18px;
}

.info-card li {
  margin-bottom: 6px;
  line-height: 1.7;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.info-card li strong {
  color: var(--td-text-color-primary);
}
</style>
