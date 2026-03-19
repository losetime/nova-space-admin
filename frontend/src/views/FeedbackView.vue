<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">反馈管理</h2>
    </div>

    <div class="mb-4 flex gap-4">
      <a-select
        v-model:value="filterType"
        placeholder="类型筛选"
        style="width: 120px"
        allow-clear
        @change="fetchFeedbacks"
      >
        <a-select-option value="bug">Bug</a-select-option>
        <a-select-option value="feature">功能请求</a-select-option>
        <a-select-option value="suggestion">建议</a-select-option>
        <a-select-option value="other">其他</a-select-option>
      </a-select>
      <a-select
        v-model:value="filterStatus"
        placeholder="状态筛选"
        style="width: 120px"
        allow-clear
        @change="fetchFeedbacks"
      >
        <a-select-option value="pending">待处理</a-select-option>
        <a-select-option value="processing">处理中</a-select-option>
        <a-select-option value="resolved">已解决</a-select-option>
        <a-select-option value="closed">已关闭</a-select-option>
      </a-select>
    </div>

    <a-table
      :columns="columns"
      :data-source="feedbacks"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.type)">
            {{ getTypeText(record.type) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="showDetail(record)">
              查看
            </a-button>
            <a-button type="link" size="small" @click="showStatusUpdate(record)">
              更新状态
            </a-button>
            <a-popconfirm
              title="确定要删除这条反馈吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="反馈详情"
      :footer="null"
      width="600px"
    >
      <a-descriptions :column="1" bordered v-if="currentFeedback">
        <a-descriptions-item label="标题">{{ currentFeedback.title }}</a-descriptions-item>
        <a-descriptions-item label="类型">
          <a-tag :color="getTypeColor(currentFeedback.type)">
            {{ getTypeText(currentFeedback.type) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(currentFeedback.status)">
            {{ getStatusText(currentFeedback.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="内容">
          <div style="white-space: pre-wrap;">{{ currentFeedback.content }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ formatDate(currentFeedback.createdAt) }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 状态更新弹窗 -->
    <a-modal
      v-model:open="statusVisible"
      title="更新状态"
      @ok="handleStatusUpdate"
      :confirm-loading="updateLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="状态">
          <a-select v-model:value="newStatus">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { feedbackApi, type Feedback } from '@/api'

const loading = ref(false)
const updateLoading = ref(false)
const feedbacks = ref<Feedback[]>([])
const filterType = ref<string | undefined>()
const filterStatus = ref<string | undefined>()

const detailVisible = ref(false)
const statusVisible = ref(false)
const currentFeedback = ref<Feedback | null>(null)
const newStatus = ref<string>('pending')

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '类型', key: 'type', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '提交时间', key: 'createdAt', width: 150 },
  { title: '操作', key: 'action', width: 200 },
]

const typeMap: Record<string, { text: string; color: string }> = {
  bug: { text: 'Bug', color: 'red' },
  feature: { text: '功能请求', color: 'blue' },
  suggestion: { text: '建议', color: 'green' },
  other: { text: '其他', color: 'default' },
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
  closed: { text: '已关闭', color: 'default' },
}

function getTypeText(type: string) {
  return typeMap[type]?.text || type
}

function getTypeColor(type: string) {
  return typeMap[type]?.color || 'default'
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

async function fetchFeedbacks() {
  loading.value = true
  try {
    const res = await feedbackApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
      type: filterType.value,
      status: filterStatus.value,
    })
    if (res.success) {
      feedbacks.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    message.error('获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchFeedbacks()
}

function showDetail(feedback: Feedback) {
  currentFeedback.value = feedback
  detailVisible.value = true
}

function showStatusUpdate(feedback: Feedback) {
  currentFeedback.value = feedback
  newStatus.value = feedback.status
  statusVisible.value = true
}

async function handleStatusUpdate() {
  if (!currentFeedback.value) return
  updateLoading.value = true
  try {
    await feedbackApi.update(currentFeedback.value.id, { status: newStatus.value })
    message.success('状态更新成功')
    statusVisible.value = false
    fetchFeedbacks()
  } catch (error) {
    message.error('状态更新失败')
  } finally {
    updateLoading.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await feedbackApi.delete(id)
    message.success('删除成功')
    fetchFeedbacks()
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(fetchFeedbacks)
</script>