<template>
  <div class="page-container">
    <h2 class="text-xl font-bold mb-4">问答同步管理</h2>

    <!-- 统计卡片 -->
    <t-row :gutter="16" class="mb-6">
      <t-col :span="3">
        <t-card class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总题目数</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card class="stat-card">
          <div class="stat-value text-blue-600">{{ stats.fromOpenTDB }}</div>
          <div class="stat-label">OpenTDB 来源</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card class="stat-card">
          <div class="stat-value text-green-600">{{ stats.manual }}</div>
          <div class="stat-label">手动添加</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card class="stat-card">
          <div class="stat-value text-gray-500">{{ formatTime(stats.lastSyncTime) }}</div>
          <div class="stat-label">最近同步</div>
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="16">
      <!-- 同步操作 -->
      <t-col :span="6">
        <t-card title="立即同步" class="mb-4">
          <t-form :data="syncForm" layout="inline">
            <t-form-item label="数量">
              <t-input-number v-model="syncForm.count" :min="1" :max="50" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :loading="syncing" @click="handleSync">
                开始同步
              </t-button>
            </t-form-item>
          </t-form>
          <div v-if="syncResult" class="mt-4 p-3 bg-gray-50 rounded">
            <p>新增: {{ syncResult.added }}</p>
            <p>跳过: {{ syncResult.skipped }}</p>
            <p>错误: {{ syncResult.errors }}</p>
          </div>
        </t-card>
      </t-col>

      <!-- 定时设置 -->
      <t-col :span="6">
        <t-card title="定时同步" class="mb-4">
          <t-form :data="configForm" label-width="80px">
            <t-form-item label="启用">
              <t-switch v-model="configForm.enabled" />
            </t-form-item>
            <t-form-item label="同步时间">
              <t-time-picker
                v-model="configForm.syncTime"
                format="HH:mm"
                :disabled="!configForm.enabled"
              />
            </t-form-item>
            <t-form-item label="每次数量">
              <t-input-number
                v-model="configForm.count"
                :min="1"
                :max="50"
                :disabled="!configForm.enabled"
              />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="saveConfig">保存配置</t-button>
            </t-form-item>
          </t-form>
        </t-card>
      </t-col>
    </t-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { quizApi } from '@/api'

interface SyncResult {
  added: number
  skipped: number
  errors: number
}

interface Stats {
  total: number
  fromOpenTDB: number
  manual: number
  lastSyncTime: string | null
}

const syncing = ref(false)
const syncResult = ref<SyncResult | null>(null)

const stats = ref<Stats>({
  total: 0,
  fromOpenTDB: 0,
  manual: 0,
  lastSyncTime: null,
})

const syncForm = reactive({
  count: 10,
})

const configForm = reactive({
  enabled: false,
  syncTime: '03:00',
  count: 10,
})

function formatTime(time: string | null) {
  if (!time) return '从未同步'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchStats() {
  try {
    const res = await quizApi.getStats()
    if (res.success) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

async function fetchConfig() {
  try {
    const res = await quizApi.getConfig()
    if (res.success && res.data) {
      configForm.enabled = res.data.enabled
      configForm.count = res.data.count
      // 解析 cron 时间
      if (res.data.cron) {
        const match = res.data.cron.match(/^(\d+)\s+(\d+)\s+\*/)
        if (match) {
          const hour = match[2].padStart(2, '0')
          const minute = match[1].padStart(2, '0')
          configForm.syncTime = `${hour}:${minute}`
        }
      }
    }
  } catch (error) {
    console.error('获取配置失败', error)
  }
}

async function handleSync() {
  syncing.value = true
  syncResult.value = null
  try {
    const res = await quizApi.sync(syncForm.count)
    if (res.success) {
      syncResult.value = res.data
      MessagePlugin.success('同步完成')
      fetchStats()
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '同步失败')
  } finally {
    syncing.value = false
  }
}

async function saveConfig() {
  try {
    // 将时间转换为 cron 表达式
    const [hour, minute] = configForm.syncTime.split(':')
    const cron = `${minute} ${hour} * * *`

    const res = await quizApi.updateConfig({
      enabled: configForm.enabled,
      cron,
      count: configForm.count,
    })
    if (res.success) {
      MessagePlugin.success('配置已保存')
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '保存失败')
  }
}

onMounted(() => {
  fetchStats()
  fetchConfig()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
</style>