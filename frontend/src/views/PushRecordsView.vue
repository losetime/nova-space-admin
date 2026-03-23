<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">推送记录</h2>
      <a-space>
        <a-select
          v-model:value="filterTriggerType"
          style="width: 120px"
          placeholder="触发类型"
          allowClear
          @change="handleFilter"
        >
          <a-select-option value="scheduled">定时推送</a-select-option>
          <a-select-option value="manual">手动推送</a-select-option>
        </a-select>
        <a-select
          v-model:value="filterStatus"
          style="width: 120px"
          placeholder="推送状态"
          allowClear
          @change="handleFilter"
        >
          <a-select-option value="sent">已发送</a-select-option>
          <a-select-option value="failed">失败</a-select-option>
        </a-select>
      </a-space>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <a-card>
        <a-statistic title="总记录" :value="statistics.total" />
      </a-card>
      <a-card>
        <a-statistic title="已发送" :value="statistics.sent" :value-style="{ color: '#3f8600' }" />
      </a-card>
      <a-card>
        <a-statistic title="发送失败" :value="statistics.failed" :value-style="{ color: '#cf1322' }" />
      </a-card>
    </div>

    <a-table
      :columns="columns"
      :data-source="records"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userId'">
          <a-tooltip :title="record.userId">
            <span>{{ record.userId }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'username'">
          {{ record.user?.username || '-' }}
        </template>
        <template v-else-if="column.key === 'email'">
          <a-tooltip v-if="record.subscriptionEmail" :title="record.subscriptionEmail">
            <span>{{ record.subscriptionEmail }}</span>
          </a-tooltip>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'triggerType'">
          <a-tag :color="getTriggerTypeColor(record.triggerType)">
            {{ getTriggerTypeText(record.triggerType) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'subject'">
          <a-tooltip :title="record.subject">
            <span class="cursor-pointer">{{ record.subject.slice(0, 30) }}{{ record.subject.length > 30 ? '...' : '' }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'sentAt'">
          {{ formatDate(record.sentAt) }}
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-popconfirm
              title="确定要删除这条推送记录吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { pushRecordApi, type PushRecord, type PushTriggerType, type PushRecordStatus } from '@/api'

const loading = ref(false)
const records = ref<PushRecord[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const filterTriggerType = ref<PushTriggerType | undefined>()
const filterStatus = ref<PushRecordStatus | undefined>()

const statistics = reactive({
  total: 0,
  sent: 0,
  failed: 0,
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 280, ellipsis: true },
  { title: '用户ID', key: 'userId', width: 280, ellipsis: true },
  { title: '用户名', key: 'username', width: 120 },
  { title: '订阅邮箱', key: 'email', width: 180, ellipsis: true },
  { title: '触发类型', key: 'triggerType', width: 100 },
  { title: '主题', key: 'subject', ellipsis: true },
  { title: '状态', key: 'status', width: 80 },
  { title: '发送时间', key: 'sentAt', width: 140 },
  { title: '创建时间', key: 'createdAt', width: 140 },
  { title: '操作', key: 'action', width: 80 },
]

const triggerTypeMap: Record<string, { text: string; color: string }> = {
  scheduled: { text: '定时推送', color: 'blue' },
  manual: { text: '手动推送', color: 'purple' },
}

const statusMap: Record<string, { text: string; color: string }> = {
  sent: { text: '已发送', color: 'green' },
  failed: { text: '失败', color: 'red' },
}

function getTriggerTypeText(type: string) {
  return triggerTypeMap[type]?.text || type
}

function getTriggerTypeColor(type: string) {
  return triggerTypeMap[type]?.color || 'default'
}

function getStatusText(status: string) {
  return statusMap[status]?.text || status
}

function getStatusColor(status: string) {
  return statusMap[status]?.color || 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchRecords() {
  loading.value = true
  try {
    const res = await pushRecordApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
      triggerType: filterTriggerType.value,
      status: filterStatus.value,
    })
    if (res.success) {
      records.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    message.error('获取推送记录失败')
  } finally {
    loading.value = false
  }
}

async function fetchStatistics() {
  try {
    const res = await pushRecordApi.getStatistics()
    if (res.success) {
      Object.assign(statistics, res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败')
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchRecords()
}

function handleFilter() {
  pagination.current = 1
  fetchRecords()
}

async function handleDelete(id: string) {
  try {
    await pushRecordApi.delete(id)
    message.success('删除成功')
    fetchRecords()
    fetchStatistics()
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchRecords()
  fetchStatistics()
})
</script>