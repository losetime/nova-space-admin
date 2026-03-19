<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">用户管理</h2>
      <a-button type="primary" @click="$router.push('/users/create')">
        <PlusOutlined />
        新建
      </a-button>
    </div>

    <div class="mb-4 flex gap-4">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索用户名"
        style="width: 200px"
        @search="handleSearch"
        allow-clear
      />
      <a-select
        v-model:value="filterRole"
        placeholder="角色筛选"
        style="width: 120px"
        allow-clear
        @change="fetchUsers"
      >
        <a-select-option value="user">普通用户</a-select-option>
        <a-select-option value="admin">管理员</a-select-option>
        <a-select-option value="super_admin">超级管理员</a-select-option>
      </a-select>
      <a-select
        v-model:value="filterActive"
        placeholder="状态筛选"
        style="width: 120px"
        allow-clear
        @change="fetchUsers"
      >
        <a-select-option :value="true">启用</a-select-option>
        <a-select-option :value="false">禁用</a-select-option>
      </a-select>
    </div>

    <a-table
      :columns="columns"
      :data-source="users"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="getRoleColor(record.role)">
            {{ getRoleText(record.role) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)">
            {{ getLevelText(record.level) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-tag :color="record.isActive ? 'green' : 'red'">
            {{ record.isActive ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="$router.push(`/users/${record.id}/edit`)">
              编辑
            </a-button>
            <a-button type="link" size="small" @click="handleResetPassword(record.id)">
              重置密码
            </a-button>
            <a-popconfirm
              title="确定要删除这个用户吗？"
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
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
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
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '邮箱', dataIndex: 'email', ellipsis: true },
  { title: '角色', key: 'role', width: 100 },
  { title: '等级', key: 'level', width: 100 },
  { title: '积分', dataIndex: 'points', width: 80 },
  { title: '状态', key: 'isActive', width: 80 },
  { title: '注册时间', key: 'createdAt', width: 120 },
  { title: '操作', key: 'action', width: 180 },
]

const roleMap: Record<string, { text: string; color: string }> = {
  user: { text: '普通用户', color: 'default' },
  admin: { text: '管理员', color: 'blue' },
  super_admin: { text: '超级管理员', color: 'gold' },
}

const levelMap: Record<string, { text: string; color: string }> = {
  basic: { text: '基础', color: 'default' },
  advanced: { text: '进阶', color: 'blue' },
  professional: { text: '专业', color: 'purple' },
}

function getRoleText(role: string) {
  return roleMap[role]?.text || role
}

function getRoleColor(role: string) {
  return roleMap[role]?.color || 'default'
}

function getLevelText(level: string) {
  return levelMap[level]?.text || level
}

function getLevelColor(level: string) {
  return levelMap[level]?.color || 'default'
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
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchUsers()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchUsers()
}

async function handleDelete(id: string) {
  try {
    await userApi.delete(id)
    message.success('删除成功')
    fetchUsers()
  } catch (error) {
    message.error('删除失败')
  }
}

async function handleResetPassword(id: string) {
  Modal.confirm({
    title: '重置密码',
    content: '确定要重置该用户的密码吗？系统将生成一个新的随机密码。',
    async onOk() {
      try {
        const res = await userApi.resetPassword(id)
        if (res.success) {
          Modal.success({
            title: '密码重置成功',
            content: `新密码: ${res.data.password}`,
          })
        }
      } catch (error: any) {
        message.error(error.message || '重置密码失败')
      }
    },
  })
}

onMounted(fetchUsers)
</script>