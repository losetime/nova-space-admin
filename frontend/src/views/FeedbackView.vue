<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">反馈管理</h2>
    </div>

    <div class="mb-4 flex gap-4">
      <t-select
        v-model="filterType"
        placeholder="类型筛选"
        style="width: 120px"
        clearable
        @change="fetchFeedbacks"
      >
        <t-option value="bug" label="Bug" />
        <t-option value="feature" label="功能请求" />
        <t-option value="suggestion" label="建议" />
        <t-option value="other" label="其他" />
      </t-select>
      <t-select
        v-model="filterStatus"
        placeholder="状态筛选"
        style="width: 120px"
        clearable
        @change="fetchFeedbacks"
      >
        <t-option value="pending" label="待处理" />
        <t-option value="processing" label="处理中" />
        <t-option value="resolved" label="已解决" />
        <t-option value="closed" label="已关闭" />
      </t-select>
    </div>

    <t-table bordered
      :columns="columns"
      :data="feedbacks"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #type="{ row }">
        <t-tag :theme="getTypeTheme(row.type)" variant="light">
          {{ getTypeText(row.type) }}
        </t-tag>
      </template>
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" variant="light">
          {{ getStatusText(row.status) }}
        </t-tag>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="showDetail(row)">
            查看
          </t-link>
          <t-link theme="primary" @click="showStatusUpdate(row)">
            更新状态
          </t-link>
          <t-popconfirm content="确定要删除这条反馈吗？" @confirm="handleDelete(row.id)">
            <t-link theme="danger">删除</t-link>
          </t-popconfirm>
        </t-space>
      </template>
    </t-table>

    <!-- 详情弹窗 -->
    <t-dialog
      v-model:visible="detailVisible"
      header="反馈详情"
      :footer="false"
      width="600px"
    >
      <t-descriptions v-if="currentFeedback" :column="1" bordered>
        <t-descriptions-item label="标题">{{ currentFeedback.title }}</t-descriptions-item>
        <t-descriptions-item label="类型">
          <t-tag :theme="getTypeTheme(currentFeedback.type)" variant="light">
            {{ getTypeText(currentFeedback.type) }}
          </t-tag>
        </t-descriptions-item>
        <t-descriptions-item label="状态">
          <t-tag :theme="getStatusTheme(currentFeedback.status)" variant="light">
            {{ getStatusText(currentFeedback.status) }}
          </t-tag>
        </t-descriptions-item>
        <t-descriptions-item label="内容">
          <div style="white-space: pre-wrap;">{{ currentFeedback.content }}</div>
        </t-descriptions-item>
        <t-descriptions-item label="提交时间">{{ formatDate(currentFeedback.createdAt) }}</t-descriptions-item>
      </t-descriptions>
    </t-dialog>

    <!-- 状态更新弹窗 -->
    <t-dialog
      v-model:visible="statusVisible"
      header="更新状态"
      :confirm-btn="{ content: '确定', loading: updateLoading }"
      @confirm="handleStatusUpdate"
    >
      <t-form :data="statusForm" layout="vertical">
        <t-form-item label="状态">
          <t-select v-model="statusForm.status">
            <t-option value="pending" label="待处理" />
            <t-option value="processing" label="处理中" />
            <t-option value="resolved" label="已解决" />
            <t-option value="closed" label="已关闭" />
          </t-select>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
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
const statusForm = reactive({
  status: 'pending',
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const columns = [
  { colKey: 'title', title: '标题', ellipsis: true },
  { colKey: 'type', title: '类型', width: 100 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'createdAt', title: '提交时间', width: 150 },
  { colKey: 'action', title: '操作', width: 200 },
]

const typeMap: Record<string, { text: string; theme: 'danger' | 'primary' | 'success' | 'default' }> = {
  bug: { text: 'Bug', theme: 'danger' },
  feature: { text: '功能请求', theme: 'primary' },
  suggestion: { text: '建议', theme: 'success' },
  other: { text: '其他', theme: 'default' },
}

const statusMap: Record<string, { text: string; theme: 'warning' | 'primary' | 'success' | 'default' }> = {
  pending: { text: '待处理', theme: 'warning' },
  processing: { text: '处理中', theme: 'primary' },
  resolved: { text: '已解决', theme: 'success' },
  closed: { text: '已关闭', theme: 'default' },
}

function getTypeText(type: string) {
  return typeMap[type]?.text || type
}

function getTypeTheme(type: string) {
  return typeMap[type]?.theme || 'default'
}

function getStatusText(status: string) {
  return statusMap[status]?.text || status
}

function getStatusTheme(status: string) {
  return statusMap[status]?.theme || 'default'
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
    MessagePlugin.error('获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchFeedbacks()
}

function showDetail(feedback: Feedback) {
  currentFeedback.value = feedback
  detailVisible.value = true
}

function showStatusUpdate(feedback: Feedback) {
  currentFeedback.value = feedback
  statusForm.status = feedback.status
  statusVisible.value = true
}

async function handleStatusUpdate() {
  if (!currentFeedback.value) return
  updateLoading.value = true
  try {
    await feedbackApi.update(currentFeedback.value.id, { status: statusForm.status })
    MessagePlugin.success('状态更新成功')
    statusVisible.value = false
    fetchFeedbacks()
  } catch (error) {
    MessagePlugin.error('状态更新失败')
  } finally {
    updateLoading.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await feedbackApi.delete(id)
    MessagePlugin.success('删除成功')
    fetchFeedbacks()
  } catch (error) {
    MessagePlugin.error('删除失败')
  }
}

onMounted(fetchFeedbacks)
</script>