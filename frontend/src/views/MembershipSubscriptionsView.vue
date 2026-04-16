<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">会员订阅管理</h2>
      <t-space>
        <t-button theme="primary" @click="showNewUserDialog = true">开通会员</t-button>
        <t-input
          v-model="searchUsername"
          placeholder="搜索用户名"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 150px"
        />
        <t-select
          v-model="filterStatus"
          style="width: 100px"
          placeholder="订阅状态"
          clearable
          @change="handleSearch"
        >
          <t-option value="active" label="有效" />
          <t-option value="expired" label="已过期" />
          <t-option value="cancelled" label="已取消" />
        </t-select>
        <t-select
          v-model="filterPlan"
          style="width: 100px"
          placeholder="套餐类型"
          clearable
          @change="handleSearch"
        >
          <t-option value="monthly" label="月卡" />
          <t-option value="quarterly" label="季卡" />
          <t-option value="yearly" label="年卡" />
          <t-option value="lifetime" label="永久卡" />
        </t-select>
      </t-space>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-4">
      <t-card>
        <t-statistic title="总订阅数" :value="statistics.total" />
      </t-card>
      <t-card>
        <t-statistic title="有效订阅" :value="statistics.active" theme="positive" />
      </t-card>
      <t-card>
        <t-statistic title="已过期" :value="statistics.expired" theme="negative" />
      </t-card>
      <t-card>
        <t-statistic title="高级会员" :value="advancedCount" />
      </t-card>
    </div>

    <t-table
      bordered
      :columns="columns"
      :data="subscriptions"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #userId="{ row }">
        <t-tooltip :content="row.userId">
          <span>{{ row.userId.slice(0, 8) }}...</span>
        </t-tooltip>
      </template>
      
      <template #user="{ row }">
        <div v-if="row.user">
          <div class="font-medium">{{ row.user.username }}</div>
          <div class="text-gray-500 text-sm">{{ row.user.email || '-' }}</div>
        </div>
        <span v-else>-</span>
      </template>
      
      <template #plan="{ row }">
        <t-tag theme="primary" variant="light">{{ getPlanText(row.plan) }}</t-tag>
      </template>
      
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" variant="light">
          {{ getStatusText(row.status) }}
        </t-tag>
      </template>
      
      <template #price="{ row }">
        {{ row.price === 0 ? '免费' : `¥${row.price}` }}
      </template>
      
      <template #paymentMethod="{ row }">
        {{ getPaymentText(row.paymentMethod) }}
      </template>
      
      <template #startDate="{ row }">
        {{ formatDate(row.startDate) }}
      </template>
      
      <template #endDate="{ row }">
        <span :class="{ 'text-red-500': isExpired(row.endDate) }">
          {{ formatDate(row.endDate) }}
        </span>
      </template>
      
      <template #autoRenew="{ row }">
        <t-tag :theme="row.autoRenew ? 'success' : 'default'" variant="light">
          {{ row.autoRenew ? '是' : '否' }}
        </t-tag>
      </template>
      
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="handleActivate(row)">开通/延长</t-link>
          <t-link v-if="row.status === 'active'" theme="warning" @click="handleCancel(row)">取消</t-link>
          <t-link theme="default" @click="showUserDetail(row)">用户详情</t-link>
        </t-space>
      </template>
    </t-table>

    <!-- 为新用户开通会员弹窗 -->
    <t-dialog
      v-model:visible="showNewUserDialog"
      header="开通会员"
      width="500px"
      :confirm-btn="{ content: '确认开通', loading: newUserSubmitLoading }"
      @confirm="handleNewUserSubmit"
    >
      <t-form :data="newUserForm" :rules="newUserRules" ref="newUserFormRef" label-align="left">
        <t-form-item label="用户" name="userId">
          <t-select
            v-model="newUserForm.userId"
            filterable
            placeholder="输入用户名搜索"
            :loading="userSearchLoading"
            @search="handleUserSearch"
          >
            <t-option
              v-for="user in userOptions"
              :key="user.id"
              :value="user.id"
              :label="`${user.username} (${user.email || '无邮箱'})`"
            />
          </t-select>
        </t-form-item>
        <t-form-item label="套餐" name="plan">
          <t-select v-model="newUserForm.plan" @change="handlePlanChange">
            <t-option value="monthly" label="月卡（高级会员）" />
            <t-option value="quarterly" label="季卡（高级会员）" />
            <t-option value="yearly" label="年卡（高级会员）" />
            <t-option value="lifetime" label="永久卡（专业会员）" />
          </t-select>
        </t-form-item>
        <t-form-item label="开始时间">
          <t-date-picker v-model="newUserForm.startDate" enable-time-picker />
        </t-form-item>
        <t-form-item label="结束时间">
          <t-date-picker v-model="newUserForm.endDate" enable-time-picker />
        </t-form-item>
        <t-form-item label="备注">
          <t-input v-model="newUserForm.reason" placeholder="开通原因（可选）" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 为已有用户开通/延长弹窗 -->
    <t-dialog
      v-model:visible="showActivateDialog"
      header="开通/延长会员"
      width="500px"
      :confirm-btn="{ content: '确认', loading: submitLoading }"
      @confirm="handleActivateSubmit"
    >
      <t-form :data="activateForm" :rules="activateRules" ref="activateFormRef" label-align="left">
        <t-form-item label="用户">
          <span class="font-medium">{{ activateForm.username }}</span>
        </t-form-item>
        <t-form-item label="套餐" name="plan">
          <t-select v-model="activateForm.plan" @change="handleActivatePlanChange">
            <t-option value="monthly" label="月卡（高级会员）" />
            <t-option value="quarterly" label="季卡（高级会员）" />
            <t-option value="yearly" label="年卡（高级会员）" />
            <t-option value="lifetime" label="永久卡（专业会员）" />
          </t-select>
        </t-form-item>
        <t-form-item label="开始时间">
          <t-date-picker v-model="activateForm.startDate" enable-time-picker />
        </t-form-item>
        <t-form-item label="结束时间">
          <t-date-picker v-model="activateForm.endDate" enable-time-picker />
        </t-form-item>
        <t-form-item label="备注">
          <t-input v-model="activateForm.reason" placeholder="开通原因" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 取消订阅弹窗 -->
    <t-dialog
      v-model:visible="showCancelDialog"
      header="取消订阅"
      width="400px"
      :confirm-btn="{ content: '确认取消', loading: submitLoading, theme: 'danger' }"
      @confirm="handleCancelSubmit"
    >
      <t-form :data="cancelForm" ref="cancelFormRef" label-align="left">
        <t-form-item label="用户">
          <span class="font-medium">{{ cancelForm.username }}</span>
        </t-form-item>
        <t-form-item label="取消原因">
          <t-textarea v-model="cancelForm.reason" placeholder="请输入取消原因" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import dayjs from 'dayjs'
import { membershipApi, userApi, type MembershipSubscription, type MembershipStatistics, type User } from '@/api'

const loading = ref(false)
const submitLoading = ref(false)
const newUserSubmitLoading = ref(false)
const subscriptions = ref<MembershipSubscription[]>([])
const statistics = ref<MembershipStatistics>({
  total: 0,
  active: 0,
  expired: 0,
  planStats: [],
  levelStats: [],
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const searchUsername = ref('')
const filterStatus = ref<string | undefined>()
const filterPlan = ref<string | undefined>()

const showActivateDialog = ref(false)
const showCancelDialog = ref(false)
const showNewUserDialog = ref(false)
const activateFormRef = ref()
const newUserFormRef = ref()
const activatingUser = ref<MembershipSubscription | null>(null)
const cancelingSubscription = ref<MembershipSubscription | null>(null)

const activateForm = reactive({
  userId: '',
  username: '',
  plan: 'monthly',
  startDate: '',
  endDate: '',
  reason: '',
})

const newUserForm = reactive({
  userId: '',
  plan: 'monthly',
  startDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(1, 'month').format('YYYY-MM-DD HH:mm:ss'),
  reason: '',
})

const cancelForm = reactive({
  subscriptionId: '',
  username: '',
  reason: '',
})

const userSearchLoading = ref(false)
const userOptions = ref<User[]>([])

const activateRules = {
  plan: [{ required: true, message: '请选择套餐' }],
}

const newUserRules = {
  userId: [{ required: true, message: '请选择用户' }],
  plan: [{ required: true, message: '请选择套餐' }],
}

const planDurationMap = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  lifetime: 1200,
}

const columns = [
  { colKey: 'userId', title: '用户ID', width: 100, ellipsis: true },
  { colKey: 'user', title: '用户信息', width: 150 },
  { colKey: 'plan', title: '套餐', width: 80 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'price', title: '价格', width: 60 },
  { colKey: 'paymentMethod', title: '支付方式', width: 80 },
  { colKey: 'startDate', title: '开始时间', width: 120 },
  { colKey: 'endDate', title: '结束时间', width: 120 },
  { colKey: 'autoRenew', title: '自动续费', width: 80 },
  { colKey: 'createdAt', title: '创建时间', width: 120 },
  { colKey: 'action', title: '操作', width: 180 },
]

const planMap = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
  lifetime: '永久卡',
  custom: '自定义',
}

const statusMap = {
  active: { text: '有效', theme: 'success' },
  expired: { text: '已过期', theme: 'danger' },
  cancelled: { text: '已取消', theme: 'warning' },
  pending: { text: '待支付', theme: 'default' },
}

const paymentMap = {
  points: '积分兑换',
  admin: '管理员开通',
  alipay: '支付宝',
  wechat: '微信支付',
}

function getPlanText(plan: string) {
  return planMap[plan as keyof typeof planMap] || plan
}

function getStatusText(status: string) {
  return statusMap[status as keyof typeof statusMap]?.text || status
}

function getStatusTheme(status: string) {
  return statusMap[status as keyof typeof statusMap]?.theme || 'default'
}

function getPaymentText(method: string | null) {
  if (!method) return '-'
  return paymentMap[method as keyof typeof paymentMap] || method
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function isExpired(date: string) {
  return new Date(date) < new Date()
}

const advancedCount = computed(() => {
  return statistics.value.levelStats.find(l => l.level === 'advanced')?.count || 0
})

async function fetchSubscriptions() {
  loading.value = true
  try {
    const res = await membershipApi.getSubscriptions({
      page: pagination.current,
      limit: pagination.pageSize,
      username: searchUsername.value || undefined,
      status: filterStatus.value,
      plan: filterPlan.value,
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
    const res = await membershipApi.getStatistics()
    if (res.success) {
      statistics.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败')
  }
}

async function handleUserSearch(keyword: string) {
  if (!keyword) {
    userOptions.value = []
    return
  }
  userSearchLoading.value = true
  try {
    const res = await userApi.getList({ keyword, limit: 20 })
    if (res.success) {
      userOptions.value = res.data.data
    }
  } catch (error) {
    console.error('搜索用户失败')
  } finally {
    userSearchLoading.value = false
  }
}

function handlePlanChange(plan: string) {
  const duration = planDurationMap[plan as keyof typeof planDurationMap] || 1
  newUserForm.startDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
  if (plan === 'lifetime') {
    newUserForm.endDate = dayjs().add(100, 'year').format('YYYY-MM-DD HH:mm:ss')
  } else {
    newUserForm.endDate = dayjs().add(duration, 'month').format('YYYY-MM-DD HH:mm:ss')
  }
}

function handleActivatePlanChange(plan: string) {
  const duration = planDurationMap[plan as keyof typeof planDurationMap] || 1
  activateForm.startDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
  if (plan === 'lifetime') {
    activateForm.endDate = dayjs().add(100, 'year').format('YYYY-MM-DD HH:mm:ss')
  } else {
    activateForm.endDate = dayjs().add(duration, 'month').format('YYYY-MM-DD HH:mm:ss')
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchSubscriptions()
}

function handleSearch() {
  pagination.current = 1
  fetchSubscriptions()
}

function handleActivate(row: MembershipSubscription) {
  activatingUser.value = row
  activateForm.userId = row.userId
  activateForm.username = row.user?.username || ''
  activateForm.plan = row.plan || 'monthly'
  activateForm.startDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
  activateForm.endDate = dayjs().add(1, 'month').format('YYYY-MM-DD HH:mm:ss')
  activateForm.reason = ''
  showActivateDialog.value = true
}

async function handleNewUserSubmit() {
  const valid = await newUserFormRef.value?.validate()
  if (!valid) return

  newUserSubmitLoading.value = true
  try {
    await membershipApi.activateUser(newUserForm.userId, {
      plan: newUserForm.plan,
      startDate: newUserForm.startDate,
      endDate: newUserForm.endDate,
      reason: newUserForm.reason,
    })
    MessagePlugin.success('开通成功')
    showNewUserDialog.value = false
    resetNewUserForm()
    fetchSubscriptions()
    fetchStatistics()
  } catch (error) {
    MessagePlugin.error('开通失败')
  } finally {
    newUserSubmitLoading.value = false
  }
}

async function handleActivateSubmit() {
  const valid = await activateFormRef.value?.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    await membershipApi.activateUser(activateForm.userId, {
      plan: activateForm.plan,
      startDate: activateForm.startDate,
      endDate: activateForm.endDate,
      reason: activateForm.reason,
    })
    MessagePlugin.success('开通成功')
    showActivateDialog.value = false
    fetchSubscriptions()
    fetchStatistics()
  } catch (error) {
    MessagePlugin.error('开通失败')
  } finally {
    submitLoading.value = false
  }
}

function resetNewUserForm() {
  newUserForm.userId = ''
  newUserForm.plan = 'monthly'
  newUserForm.startDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
  newUserForm.endDate = dayjs().add(1, 'month').format('YYYY-MM-DD HH:mm:ss')
  newUserForm.reason = ''
  userOptions.value = []
}

function handleCancel(row: MembershipSubscription) {
  cancelingSubscription.value = row
  cancelForm.subscriptionId = row.id
  cancelForm.username = row.user?.username || ''
  cancelForm.reason = ''
  showCancelDialog.value = true
}

async function handleCancelSubmit() {
  if (!cancelingSubscription.value) return

  submitLoading.value = true
  try {
    await membershipApi.cancelSubscription(cancelForm.subscriptionId, cancelForm.reason)
    MessagePlugin.success('取消成功')
    showCancelDialog.value = false
    fetchSubscriptions()
    fetchStatistics()
  } catch (error) {
    MessagePlugin.error('取消失败')
  } finally {
    submitLoading.value = false
  }
}

function showUserDetail(row: MembershipSubscription) {
  DialogPlugin.alert({
    header: '用户详情',
    body: `
      <div style="padding: 16px;">
        <p><strong>用户ID:</strong> ${row.userId}</p>
        <p><strong>用户名:</strong> ${row.user?.username || '-'}</p>
        <p><strong>邮箱:</strong> ${row.user?.email || '-'}</p>
        <p><strong>昵称:</strong> ${row.user?.nickname || '-'}</p>
        <p><strong>等级:</strong> ${row.user?.level || '-'}</p>
      </div>
    `,
  })
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