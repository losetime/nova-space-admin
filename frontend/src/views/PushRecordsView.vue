<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">推送记录</h2>
      <t-space>
        <t-button theme="primary" @click="showTestDialog = true">
          测试推送
        </t-button>
        <t-select
          v-model="filterTriggerType"
          style="width: 120px"
          placeholder="触发类型"
          clearable
          @change="handleFilter"
        >
          <t-option value="scheduled" label="定时推送" />
          <t-option value="manual" label="手动推送" />
        </t-select>
        <t-select
          v-model="filterStatus"
          style="width: 120px"
          placeholder="推送状态"
          clearable
          @change="handleFilter"
        >
          <t-option value="sent" label="已发送" />
          <t-option value="failed" label="失败" />
        </t-select>
      </t-space>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <t-card>
        <t-statistic title="总记录" :value="statistics.total" />
      </t-card>
      <t-card>
        <t-statistic title="已发送" :value="statistics.sent" :trend="statistics.sent > 0 ? 'increase' : undefined" trend-type="increase" />
      </t-card>
      <t-card>
        <t-statistic title="发送失败" :value="statistics.failed" :trend="statistics.failed > 0 ? 'decrease' : undefined" trend-type="decrease" />
      </t-card>
    </div>

    <t-table bordered
      :columns="columns"
      :data="records"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handleTableChange"
    >
      <template #userId="{ row }">
        <t-tooltip :content="row.userId">
          <span>{{ row.userId }}</span>
        </t-tooltip>
      </template>
      <template #username="{ row }">
        {{ row.user?.username || '-' }}
      </template>
      <template #email="{ row }">
        <t-tooltip v-if="row.subscriptionEmail" :content="row.subscriptionEmail">
          <span>{{ row.subscriptionEmail }}</span>
        </t-tooltip>
        <span v-else>-</span>
      </template>
      <template #triggerType="{ row }">
        <t-tag :theme="getTriggerTypeTheme(row.triggerType)" variant="light">
          {{ getTriggerTypeText(row.triggerType) }}
        </t-tag>
      </template>
      <template #subject="{ row }">
        <t-tooltip :content="row.subject">
          <span class="cursor-pointer">{{ row.subject.slice(0, 30) }}{{ row.subject.length > 30 ? '...' : '' }}</span>
        </t-tooltip>
      </template>
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" variant="light">
          {{ getStatusText(row.status) }}
        </t-tag>
      </template>
      <template #sentAt="{ row }">
        {{ formatDate(row.sentAt) }}
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-popconfirm
            content="确定要删除这条推送记录吗？"
            @confirm="handleDelete(row.id)"
          >
            <t-link theme="danger">删除</t-link>
          </t-popconfirm>
        </t-space>
      </template>
    </t-table>

    <!-- Test Push Dialog -->
    <t-dialog
      v-model:visible="showTestDialog"
      header="测试推送"
      :confirm-btn="{ content: '发送', loading: testLoading }"
      @confirm="handleTestPush"
    >
      <t-form :data="testForm" :rules="testRules" ref="testFormRef">
        <t-form-item label="接收邮箱" name="email">
          <t-input v-model="testForm.email" placeholder="请输入接收测试邮件的邮箱地址" />
        </t-form-item>
        <t-form-item label="推送类型" name="type">
          <t-radio-group v-model="testForm.type">
            <t-radio value="simple">简单测试</t-radio>
            <t-radio value="digest">资讯推送</t-radio>
          </t-radio-group>
          <div class="text-gray-500 text-sm mt-2">
            简单测试：发送一封测试邮件验证配置<br>
            资讯推送：发送包含最新情报的邮件
          </div>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import dayjs from 'dayjs'
import { pushRecordApi, type PushRecord, type PushTriggerType, type PushRecordStatus } from '@/api'

const loading = ref(false)
const records = ref<PushRecord[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const filterTriggerType = ref<PushTriggerType | undefined>()
const filterStatus = ref<PushRecordStatus | undefined>()

const statistics = reactive({
  total: 0,
  sent: 0,
  failed: 0,
})

// Test push dialog
const showTestDialog = ref(false)
const testLoading = ref(false)
const testFormRef = ref()
const testForm = reactive({
  email: '',
  type: 'simple' as 'simple' | 'digest',
})
const testRules = {
  email: [
    { required: true, message: '请输入邮箱地址' },
    { email: true, message: '请输入有效的邮箱地址' },
  ],
}

const columns = [
  { colKey: 'id', title: 'ID', width: 280, ellipsis: true },
  { colKey: 'userId', title: '用户ID', width: 280, ellipsis: true },
  { colKey: 'username', title: '用户名', width: 120 },
  { colKey: 'email', title: '订阅邮箱', width: 180, ellipsis: true },
  { colKey: 'triggerType', title: '触发类型', width: 100 },
  { colKey: 'subject', title: '主题', ellipsis: true },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'sentAt', title: '发送时间', width: 140 },
  { colKey: 'createdAt', title: '创建时间', width: 140 },
  { colKey: 'action', title: '操作', width: 80 },
]

const triggerTypeMap: Record<string, { text: string; theme: 'primary' | 'warning' }> = {
  scheduled: { text: '定时推送', theme: 'primary' },
  manual: { text: '手动推送', theme: 'warning' },
}

const statusMap: Record<string, { text: string; theme: 'success' | 'danger' }> = {
  sent: { text: '已发送', theme: 'success' },
  failed: { text: '失败', theme: 'danger' },
}

function getTriggerTypeText(type: string) {
  return triggerTypeMap[type]?.text || type
}

function getTriggerTypeTheme(type: string) {
  return triggerTypeMap[type]?.theme || 'default'
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
    MessagePlugin.error('获取推送记录失败')
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

function handleTableChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchRecords()
}

function handleFilter() {
  pagination.current = 1
  fetchRecords()
}

async function handleDelete(id: string) {
  try {
    await pushRecordApi.delete(id)
    MessagePlugin.success('删除成功')
    fetchRecords()
    fetchStatistics()
  } catch (error) {
    MessagePlugin.error('删除失败')
  }
}

async function handleTestPush() {
  const valid = await testFormRef.value?.validate()
  if (!valid) return

  testLoading.value = true
  try {
    const res = testForm.type === 'simple'
      ? await pushRecordApi.testPush(testForm.email)
      : await pushRecordApi.testDigestPush(testForm.email)

    if (res.data.success) {
      MessagePlugin.success(res.data.message)
      showTestDialog.value = false
      testForm.email = ''
      fetchRecords()
      fetchStatistics()
    } else {
      MessagePlugin.error(res.data.message)
    }
  } catch (error) {
    MessagePlugin.error('发送测试推送失败')
  } finally {
    testLoading.value = false
  }
}

onMounted(() => {
  fetchRecords()
  fetchStatistics()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>