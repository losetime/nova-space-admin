<template>
  <a-layout class="min-h-screen">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="dark"
      width="220"
    >
      <div class="p-4 text-white text-center">
        <h1 v-if="!collapsed" class="text-lg font-bold">Nova Space - 后台管理系统</h1>
        <span v-else class="text-xl">N</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="dashboard">
          <DashboardOutlined />
          <span>仪表盘</span>
        </a-menu-item>
        <a-menu-item key="articles">
          <FileTextOutlined />
          <span>科普管理</span>
        </a-menu-item>
        <a-menu-item key="intelligence">
          <BulbOutlined />
          <span>情报管理</span>
        </a-menu-item>
        <a-menu-item key="users">
          <UserOutlined />
          <span>用户管理</span>
        </a-menu-item>
        <a-menu-item key="feedback">
          <CommentOutlined />
          <span>反馈管理</span>
        </a-menu-item>
        <a-menu-item key="pushRecords">
          <SendOutlined />
          <span>推送记录</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="bg-white px-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center">
          <MenuUnfoldOutlined
            v-if="collapsed"
            class="text-lg cursor-pointer"
            @click="collapsed = false"
          />
          <MenuFoldOutlined
            v-else
            class="text-lg cursor-pointer"
            @click="collapsed = true"
          />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ authStore.user?.username }}</span>
          <a-button type="link" @click="handleLogout">
            <LogoutOutlined />
            退出
          </a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="m-4 p-4 bg-white rounded-lg shadow-sm">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  DashboardOutlined,
  FileTextOutlined,
  BulbOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  CommentOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>(['dashboard'])

watch(
  () => route.name,
  (name) => {
    if (name === 'Articles' || name === 'ArticleCreate' || name === 'ArticleEdit') {
      selectedKeys.value = ['articles']
    } else if (name === 'Intelligence' || name === 'IntelligenceCreate' || name === 'IntelligenceEdit') {
      selectedKeys.value = ['intelligence']
    } else if (name === 'Users' || name === 'UserCreate' || name === 'UserEdit') {
      selectedKeys.value = ['users']
    } else if (name === 'Feedback') {
      selectedKeys.value = ['feedback']
    } else if (name === 'PushRecords') {
      selectedKeys.value = ['pushRecords']
    } else {
      selectedKeys.value = ['dashboard']
    }
  },
  { immediate: true }
)

function handleMenuClick({ key }: { key: string }) {
  // Special handling for pushRecords -> PushRecords
  const routeNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    articles: 'Articles',
    intelligence: 'Intelligence',
    users: 'Users',
    feedback: 'Feedback',
    pushRecords: 'PushRecords',
  }
  router.push({ name: routeNameMap[key] || key })
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>