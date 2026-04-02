<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">邮件订阅</h2>
      <t-space>
        <t-button theme="primary" @click="showTestDialog = true">
          测试推送
        </t-button>
        <t-button theme="warning" @click="handleTriggerPush" :loading="triggerLoading">
          手动触发推送
        </t-button>
        <t-input
          v-model="searchEmail"
          placeholder="搜索邮箱"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 200px"
        >
          <template #suffix-icon>
            <SearchIcon />
          </template>
        </t-input>
        <t-select
          v-model="filterStatus"
          style="width: 120px"
          placeholder="订阅状态"
          clearable
          @change="handleFilter"
        >
          <t-option value="active" label="正常" />
          <t-option value="paused" label="暂停" />
        </t-select>
      </t-space>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-4">
      <t-card>
        <t-statistic title="总订阅数" :value="statistics.total" />
      </t-card>
      <t-card>
        <t-statistic 
          title="正常订阅" 
          :value="statistics.active" 
          :trend="statistics.active > 0 ? 'increase' : undefined" 
        />
      </t-card>
      <t-card>
        <t-statistic 
          title="暂停订阅" 
          :value="statistics.paused" 
        />
      </t-card>
    </div>

    <t-table
      bordered
      :columns="columns"
      :data="subscriptions"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handleTableChange"
    >
      <template #userId="{ row }">
        <t-tooltip :content="row.userId">
          <span>{{ row.userId.slice(0, 8) }}...</span>
        </t-tooltip>
      </template>
      
      <template #username="{ row }">
        {{ row.user?.username || '-' }}
      </template>
      
      <template #email="{ row }">
        {{ row.email }}
      </template>
      
      <template #subscriptionTypes="{ row }">
        <t-space>
          <t-tag 
            v-for="type in row.subscriptionTypes" 
            :key="type"
            theme="primary"
            variant="light"
          >
            {{ getSubscriptionTypeText(type) }}
          </t-tag>
        </t-space>
      </template>
      
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" variant="light">
          {{ getStatusText(row.status) }}
        </t-tag>
      </template>
      
      <template #lastPushAt="{ row }">
        {{ row.lastPushAt ? formatDate(row.lastPushAt) : '从未推送' }}
      </template>
      
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="showPushRecordsDialog(row)">
            推送记录
          </t-link>
          <t-link 
            :theme="row.status === 'active' ? 'warning' : 'success'"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 'active' ? '暂停' : '启用' }}
          </t-link>
        </t-space>
      </template>
    </t-table>

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

    <PushRecordsDialog
      v-model:visible="showRecordsDialog"
      :email="selectedEmail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { SearchIcon } from 'tdesign-icons-vue-next'
import dayjs from 'dayjs'
import { pushRecordApi, type PushSubscription, type PushSubscriptionStatus } from '@/api'
import PushRecordsDialog from '@/components/PushRecordsDialog.vue'

const loading = ref(false)
const subscriptions = ref<PushSubscription[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const searchEmail = ref('')
const filterStatus = ref<PushSubscriptionStatus | undefined>()

const statistics = reactive({
  total: 0,
  active: 0,
  paused: 0,
})

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

const triggerLoading = ref(false)

const showRecordsDialog = ref(false)
const selectedEmail = ref('')

const columns = [
  { colKey: 'userId', title: '用户ID', width: 150, ellipsis: true },
  { colKey: 'username', title: '用户名', width: 120 },
  { colKey: 'email', title: '订阅邮箱', width: 200, ellipsis: true },
  { colKey: 'subscriptionTypes', title: '订阅类型', width: 200 },
  { colKey: 'status', title: '推送状态', width: 100 },
  { colKey: 'lastPushAt', title: '上次推送', width: 140 },
  { colKey: 'createdAt', title: '订阅时间', width: 140 },
  { colKey: 'action', title: '操作', width: 160 },
]

const subscriptionTypeMap = {
  space_weather: '空间天气',
  intelligence: '航天情报',
}

const statusMap = {
  active: { text: '正常', theme: 'success' },
  paused: { text: '暂停', theme: 'warning' },
  cancelled: { text: '已取消', theme: 'default' },
}

function getSubscriptionTypeText(type: string) {
  return subscriptionTypeMap[type] || type
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

async function fetchSubscriptions() {
  loading.value = true
  try {
    const res = await pushRecordApi.getSubscriptions({
      page: pagination.current,
      limit: pagination.pageSize,
      status: filterStatus.value,
      email: searchEmail.value || undefined,
    })
    if (res.success) {
      subscriptions.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    MessagePlugin.error('获取订阅列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchStatistics() {
  try {
    const res = await pushRecordApi.getSubscriptionStatistics()
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
  fetchSubscriptions()
}

function handleSearch() {
  pagination.current = 1
  fetchSubscriptions()
}

function handleFilter() {
  pagination.current = 1
  fetchSubscriptions()
}

function showPushRecordsDialog(row: any) {
  selectedEmail.value = row.email
  showRecordsDialog.value = true
}

async function handleToggleStatus(row: any) {
  const newStatus = row.status === 'active' ? 'paused' : 'active'
  
  try {
    await pushRecordApi.updateSubscription(row.id, { status: newStatus })
    MessagePlugin.success('更新成功')
    fetchSubscriptions()
    fetchStatistics()
  } catch (error) {
    MessagePlugin.error('更新失败')
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
    } else {
      MessagePlugin.error(res.data.message)
    }
  } catch (error) {
    MessagePlugin.error('发送测试推送失败')
  } finally {
    testLoading.value = false
  }
}

async function handleTriggerPush() {
  triggerLoading.value = true
  try {
    await pushRecordApi.triggerPush()
    MessagePlugin.success('推送任务已触发，请稍后查看推送记录')
  } catch (error) {
    MessagePlugin.error('触发推送失败')
  } finally {
    triggerLoading.value = false
  }
}

onMounted(() => {
  fetchSubscriptions()
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