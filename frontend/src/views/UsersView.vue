<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">用户管理</h2>
      <t-button theme="primary" @click="openCreateDialog">
        <template #icon><AddIcon /></template>
        新建
      </t-button>
    </div>

    <div class="mb-4 flex gap-4">
      <t-input
        v-model="searchKeyword"
        placeholder="搜索邮箱"
        style="width: 200px"
        clearable
        @enter="handleSearch"
        @clear="handleSearch"
      >
        <template #suffix-icon>
          <SearchIcon class="cursor-pointer" @click="handleSearch" />
        </template>
      </t-input>
      <t-select
        v-model="filterRole"
        placeholder="角色筛选"
        style="width: 120px"
        clearable
        @change="fetchUsers"
      >
        <t-option value="user" label="普通用户" />
        <t-option value="admin" label="管理员" />
        <t-option value="super_admin" label="超级管理员" />
      </t-select>
      <t-select
        v-model="filterActive"
        placeholder="状态筛选"
        style="width: 120px"
        clearable
        @change="fetchUsers"
      >
        <t-option :value="true" label="启用" />
        <t-option :value="false" label="禁用" />
      </t-select>
    </div>

    <t-table bordered
      :columns="columns"
      :data="users"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #role="{ row }">
        <t-tag :theme="getRoleTheme(row.role)" variant="light">
          {{ getRoleText(row.role) }}
        </t-tag>
      </template>
      <template #level="{ row }">
        <t-tag variant="light">
          {{ row.levelName || row.level || '-' }}
        </t-tag>
      </template>
      <template #isActive="{ row }">
        <t-tag :theme="row.isActive ? 'success' : 'danger'" variant="light">
          {{ row.isActive ? '启用' : '禁用' }}
        </t-tag>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-link v-if="isSuperAdminOp && row.role !== 'super_admin'" theme="primary" @click="handleRole(row)">
            角色
          </t-link>
          <t-link theme="primary" @click="handleViewSubscription(row)">
            订阅
          </t-link>
          <t-link v-if="canMutate(row) || canResetOwn(row)" theme="primary" @click="handleResetPassword(row.id)">
            重置密码
          </t-link>
          <template v-if="canMutate(row)">
            <t-popconfirm v-if="row.isActive" content="确定要禁用这个用户吗？禁用后用户将无法登录。" @confirm="handleDisable(row.id)">
              <t-link theme="warning">禁用</t-link>
            </t-popconfirm>
            <t-popconfirm v-else content="确定要重新启用这个用户吗？" @confirm="handleEnable(row.id)">
              <t-link theme="success">启用</t-link>
            </t-popconfirm>
          </template>
          <t-link v-if="canMutate(row)" theme="danger" @click="handleHardDelete(row)">
            删除
          </t-link>
        </t-space>
      </template>
    </t-table>

    <t-dialog
      v-model:visible="roleDialogVisible"
      header="指定角色"
      :confirm-btn="{ content: '保存', theme: 'primary' }"
      :cancel-btn="'取消'"
      @confirm="handleRoleSave"
    >
      <t-form :data="roleForm" label-width="80">
        <t-form-item label="邮箱">
          <span>{{ roleForm.email }}</span>
        </t-form-item>
        <t-form-item label="角色" name="role">
          <t-radio-group v-model="roleForm.role" variant="default-filled">
            <t-radio-button value="user">普通用户</t-radio-button>
            <t-radio-button v-if="isSuperAdminOp" value="admin">管理员</t-radio-button>
          </t-radio-group>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog
      v-model:visible="subDialogVisible"
      header="订阅信息"
      :footer="false"
    >
      <t-descriptions v-if="subscription" :column="1" border>
        <t-descriptions-item label="套餐名称">
          {{ subscription.planName || subscription.plan }}
        </t-descriptions-item>
        <t-descriptions-item label="状态">
          <t-tag :theme="subscription.status === 'active' ? 'success' : 'default'" variant="light">
            {{ subscription.status === 'active' ? '生效中' : formatStatus(subscription.status) }}
          </t-tag>
        </t-descriptions-item>
        <t-descriptions-item label="开始日期">
          {{ formatDate(subscription.startDate) }}
        </t-descriptions-item>
        <t-descriptions-item label="到期日期">
          {{ formatDate(subscription.endDate) }}
        </t-descriptions-item>
        <t-descriptions-item label="自动续费">
          {{ subscription.autoRenew ? '是' : '否' }}
        </t-descriptions-item>
      </t-descriptions>
      <t-empty v-else description="该用户暂无订阅记录" />
    </t-dialog>

    <t-dialog
      v-model:visible="createDialogVisible"
      header="新建用户"
      :footer="false"
    >
      <t-form
        ref="createFormRef"
        :data="createForm"
        :rules="createRules"
        label-align="right"
        :label-width="80"
        @submit="handleCreate"
      >
        <t-form-item label="邮箱" name="email">
          <t-input v-model="createForm.email" placeholder="请输入邮箱" clearable />
        </t-form-item>
        <t-form-item label="密码" name="password">
          <t-input v-model="createForm.password" type="password" placeholder="请输入密码（包含字母和数字，6-20位）" clearable />
        </t-form-item>
        <t-form-item label="手机号" name="phone">
          <t-input v-model="createForm.phone" placeholder="请输入手机号" clearable />
        </t-form-item>
        <t-form-item label="昵称" name="nickname">
          <t-input v-model="createForm.nickname" placeholder="留空则根据邮箱自动生成" clearable />
        </t-form-item>
        <t-form-item label="角色" name="role">
          <t-select v-model="createForm.role">
            <t-option value="user" label="普通用户" />
            <t-option v-if="isSuperAdminOp" value="admin" label="管理员" />
          </t-select>
        </t-form-item>
        <t-form-item label="状态" name="isActive">
          <t-switch v-model="createForm.isActive" :label="['启用', '禁用']" />
        </t-form-item>
        <t-form-item>
          <div class="form-actions">
            <t-space>
              <t-button variant="outline" @click="createDialogVisible = false">取消</t-button>
              <t-button theme="primary" type="submit" :loading="creating">创建</t-button>
            </t-space>
          </div>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next'
import dayjs from 'dayjs'
import { userApi, type User } from '@/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isSuperAdminOp = computed(() => authStore.user?.role === 'super_admin')

function canMutate(row: User) {
  if (row.role === 'super_admin') return false
  if (!isSuperAdminOp.value && row.role !== 'user') return false
  return true
}

function canResetOwn(row: User) {
  if (row.role === 'super_admin') return false
  return row.id === authStore.user?.id
}

const loading = ref(false)
const users = ref<User[]>([])
const searchKeyword = ref('')
const filterRole = ref<string | undefined>()
const filterActive = ref<boolean | undefined>()

const roleDialogVisible = ref(false)
const roleForm = reactive({
  id: '',
  email: '',
  role: 'user' as 'user' | 'admin' | 'super_admin',
})
const subDialogVisible = ref(false)
const subscription = ref<User['subscription']>(null)

const createDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<any>()
const createForm = reactive({
  email: '',
  password: '',
  phone: '',
  nickname: '',
  role: 'user' as 'user' | 'admin' | 'super_admin',
  isActive: true,
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const columns = [
  { colKey: 'email', title: '邮箱', width: 260 },
  { colKey: 'nickname', title: '昵称', ellipsis: true },
  { colKey: 'role', title: '角色', width: 120 },
  { colKey: 'level', title: '会员等级', width: 100 },
  { colKey: 'points', title: '积分', width: 80 },
  { colKey: 'isActive', title: '状态', width: 80 },
  { colKey: 'createdAt', title: '注册时间', width: 180 },
  { colKey: 'action', title: '操作', width: 320 },
]

const roleMap: Record<string, { text: string; theme: 'default' | 'primary' | 'warning' }> = {
  user: { text: '普通用户', theme: 'default' },
  admin: { text: '管理员', theme: 'primary' },
  super_admin: { text: '超级管理员', theme: 'warning' },
}

function getRoleText(role: string) {
  return roleMap[role]?.text || role
}

function getRoleTheme(role: string) {
  return roleMap[role]?.theme || 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
      keyword: searchKeyword.value || undefined,
      role: filterRole.value,
      isActive: filterActive.value,
    })
    if (res.success) {
      users.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    MessagePlugin.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchUsers()
}

function handleRole(row: User) {
  roleForm.id = row.id
  roleForm.email = row.email || ''
  roleForm.role = row.role
  roleDialogVisible.value = true
}

async function handleRoleSave() {
  try {
    await userApi.update(roleForm.id, { role: roleForm.role })
    MessagePlugin.success('角色已更新')
    roleDialogVisible.value = false
    fetchUsers()
  } catch (error: any) {
    MessagePlugin.error(error.message || '角色更新失败')
  }
}

async function handleViewSubscription(row: User) {
  subscription.value = null
  subDialogVisible.value = true
  try {
    const res = await userApi.getOne(row.id)
    if (res.success) {
      subscription.value = res.data.subscription ?? null
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '获取订阅信息失败')
    subDialogVisible.value = false
  }
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    active: '生效中',
    expired: '已过期',
    cancelled: '已取消',
    pending: '待支付',
  }
  return map[status] || status
}

const createRules: Record<string, any[]> = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { email: true, message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/, message: '密码必须包含字母和数字，长度6-20位', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

function openCreateDialog() {
  createForm.email = ''
  createForm.password = ''
  createForm.phone = ''
  createForm.nickname = ''
  createForm.role = 'user'
  createForm.isActive = true
  createFormRef.value?.clearValidate()
  createDialogVisible.value = true
}

async function handleCreate({ validateResult }: { validateResult: boolean }) {
  if (!validateResult) return
  creating.value = true
  try {
    await userApi.create({ ...createForm })
    MessagePlugin.success('创建成功')
    createDialogVisible.value = false
    fetchUsers()
  } catch (error: any) {
    MessagePlugin.error(error.message || '创建失败')
  } finally {
    creating.value = false
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchUsers()
}

async function handleDisable(id: string) {
  try {
    await userApi.delete(id)
    MessagePlugin.success('用户已禁用')
    fetchUsers()
  } catch (error) {
    MessagePlugin.error('禁用失败')
  }
}

async function handleEnable(id: string) {
  try {
    await userApi.update(id, { isActive: true } as any)
    MessagePlugin.success('用户已启用')
    fetchUsers()
  } catch (error) {
    MessagePlugin.error('启用失败')
  }
}

function handleHardDelete(row: User) {
  const confirmDialog = DialogPlugin.confirm({
    header: '删除用户',
    body: `确定要彻底删除用户「${row.username}」吗？此操作不可恢复！`,
    confirmBtn: { content: '确认删除', theme: 'danger' },
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await userApi.hardDelete(row.id)
        if (res.success) {
          MessagePlugin.success('用户已彻底删除')
          fetchUsers()
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '删除失败')
      }
      confirmDialog.hide()
    },
    onCancel: () => {
      confirmDialog.hide()
    },
  })
}

async function handleResetPassword(id: string) {
  const confirmDialog = DialogPlugin.confirm({
    header: '重置密码',
    body: '确定要重置该用户的密码吗？系统将生成一个新的随机密码。',
    onConfirm: async () => {
      try {
        const res = await userApi.resetPassword(id)
        if (res.success) {
          DialogPlugin.alert({
            header: '密码重置成功',
            body: `新密码: ${res.data.password}`,
          })
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '重置密码失败')
      }
      confirmDialog.hide()
    },
  })
}

onMounted(fetchUsers)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
