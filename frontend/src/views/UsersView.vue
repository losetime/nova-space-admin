<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">用户管理</h2>
      <t-button theme="primary" @click="$router.push('/users/create')">
        <template #icon><AddIcon /></template>
        新建
      </t-button>
    </div>

    <div class="mb-4 flex gap-4">
      <t-input
        v-model="searchKeyword"
        placeholder="搜索用户名"
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
        <t-tag :theme="getLevelTheme(row.level)" variant="light">
          {{ getLevelText(row.level) }}
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
          <t-link theme="primary" @click="$router.push(`/users/${row.id}/edit`)">
            编辑
          </t-link>
          <t-link theme="primary" @click="handleResetPassword(row.id)">
            重置密码
          </t-link>
          <t-link v-if="row.isActive" theme="danger" @click="handleHardDelete(row)">
            删除
          </t-link>
          <t-popconfirm v-if="row.isActive" content="确定要禁用这个用户吗？禁用后用户将无法登录。" @confirm="handleDisable(row.id)">
            <t-link theme="warning">禁用</t-link>
          </t-popconfirm>
          <t-popconfirm v-else content="确定要重新启用这个用户吗？" @confirm="handleEnable(row.id)">
            <t-link theme="success">启用</t-link>
          </t-popconfirm>
        </t-space>
      </template>
    </t-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next'
import dayjs from 'dayjs'
import { userApi, type User } from '@/api'

const loading = ref(false)
const users = ref<User[]>([])
const searchKeyword = ref('')
const filterRole = ref<string | undefined>()
const filterActive = ref<boolean | undefined>()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const columns = [
  { colKey: 'username', title: '用户名', width: 120 },
  { colKey: 'email', title: '邮箱', ellipsis: true },
  { colKey: 'role', title: '角色', width: 120 },
  { colKey: 'level', title: '等级', width: 100 },
  { colKey: 'points', title: '积分', width: 80 },
  { colKey: 'isActive', title: '状态', width: 80 },
  { colKey: 'createdAt', title: '注册时间', width: 140 },
  { colKey: 'action', title: '操作', width: 180 },
]

const roleMap: Record<string, { text: string; theme: 'default' | 'primary' | 'warning' }> = {
  user: { text: '普通用户', theme: 'default' },
  admin: { text: '管理员', theme: 'primary' },
  super_admin: { text: '超级管理员', theme: 'warning' },
}

const levelMap: Record<string, { text: string; theme: 'default' | 'primary' | 'warning' }> = {
  basic: { text: '基础', theme: 'default' },
  advanced: { text: '进阶', theme: 'primary' },
  professional: { text: '专业', theme: 'warning' },
}

function getRoleText(role: string) {
  return roleMap[role]?.text || role
}

function getRoleTheme(role: string) {
  return roleMap[role]?.theme || 'default'
}

function getLevelText(level: string) {
  return levelMap[level]?.text || level
}

function getLevelTheme(level: string) {
  return levelMap[level]?.theme || 'default'
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
</style>