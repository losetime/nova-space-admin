<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">推送记录</h2>
      <a-space>
        <a-select
          v-model:value="filterContentType"
          style="width: 120px"
          placeholder="内容类型"
          allowClear
          @change="handleFilter"
        >
          <a-select-option value="article">科普</a-select-option>
          <a-select-option value="intelligence">情报</a-select-option>
        </a-select>
        <a-select
          v-model:value="filterStatus"
          style="width: 120px"
          placeholder="推送状态"
          allowClear
          @change="handleFilter"
        >
          <a-select-option value="pending">待推送</a-select-option>
          <a-select-option value="sending">推送中</a-select-option>
          <a-select-option value="success">成功</a-select-option>
          <a-select-option value="failed">失败</a-select-option>
        </a-select>
      </a-space>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <a-card>
        <a-statistic title="总记录" :value="statistics.total" />
      </a-card>
      <a-card>
        <a-statistic title="推送成功" :value="statistics.success" :value-style="{ color: '#3f8600' }" />
      </a-card>
      <a-card>
        <a-statistic title="推送失败" :value="statistics.failed" :value-style="{ color: '#cf1322' }" />
      </a-card>
      <a-card>
        <a-statistic title="待推送" :value="statistics.pending" :value-style="{ color: '#faad14' }" />
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
        <template v-if="column.key === 'contentType'">
          <a-tag :color="record.contentType === 'article' ? 'blue' : 'purple'">
            {{ record.contentType === 'article' ? '科普' : '情报' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'targetLevel'">
          <a-tag :color="getLevelColor(record.targetLevel)">
            {{ getLevelText(record.targetLevel) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'pushResult'">
          <span v-if="record.status === 'success' || record.status === 'failed'">
            <span class="text-green-600">{{ record.successCount }}</span>
            /
            <span class="text-red-500">{{ record.failCount }}</span>
          </span>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'pushedAt'">
          {{ record.pushedAt ? formatDate(record.pushedAt) : '-' }}
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
import { pushRecordApi, type PushRecord } from '@/api'

const loading = ref(false)
const records = ref<PushRecord[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const filterContentType = ref<string | undefined>()
const filterStatus = ref<string | undefined>()

const statistics = reactive({
  total: 0,
  success: 0,
  failed: 0,
  pending: 0,
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '内容类型', key: 'contentType', width: 100 },
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '目标等级', key: 'targetLevel', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '成功/失败', key: 'pushResult', width: 100 },
  { title: '推送时间', key: 'pushedAt', width: 140 },
  { title: '创建时间', key: 'createdAt', width: 140 },
  { title: '操作', key: 'action', width: 80 },
]

const levelMap: Record<string, { text: string; color: string }> = {
  all: { text: '全部', color: 'default' },
  basic: { text: '基础', color: 'blue' },
  advanced: { text: '进阶', color: 'purple' },
  professional: { text: '专业', color: 'gold' },
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待推送', color: 'orange' },
  sending: { text: '推送中', color: 'blue' },
  success: { text: '成功', color: 'green' },
  failed: { text: '失败', color: 'red' },
}

function getLevelText(level: string) {
  return levelMap[level]?.text || level
}

function getLevelColor(level: string) {
  return levelMap[level]?.color || 'default'
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
      contentType: filterContentType.value,
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

async function handleDelete(id: number) {
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