<template>
  <t-layout class="min-h-screen">
    <t-aside
      :collapsed="collapsed"
      :width="220"
      :collapsed-width="64"
      class="bg-[#001529]"
    >
      <div class="p-4 text-white text-center">
        <h1 v-if="!collapsed" class="text-lg font-bold">Nova Space - 后台管理系统</h1>
        <span v-else class="text-xl">N</span>
      </div>
      <t-menu
        :value="activeMenu"
        theme="dark"
        @change="handleMenuClick"
      >
        <t-menu-item value="dashboard">
          <template #icon><DashboardIcon /></template>
          仪表盘
        </t-menu-item>
        <t-menu-item value="articles">
          <template #icon><FileTxtIcon /></template>
          科普管理
        </t-menu-item>
        <t-menu-item value="intelligence">
          <template #icon><LightbulbIcon /></template>
          情报管理
        </t-menu-item>
        <t-menu-item value="users">
          <template #icon><UserIcon /></template>
          用户管理
        </t-menu-item>
        <t-menu-item value="feedback">
          <template #icon><ChatIcon /></template>
          反馈管理
        </t-menu-item>
        <t-menu-item value="pushRecords">
          <template #icon><SendIcon /></template>
          推送记录
        </t-menu-item>
      </t-menu>
    </t-aside>
    <t-layout>
      <t-header class="bg-white px-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center">
          <t-button variant="text" @click="collapsed = !collapsed">
            <template #icon>
              <ChevronLeftIcon v-if="!collapsed" />
              <ChevronRightIcon v-else />
            </template>
          </t-button>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ authStore.user?.username }}</span>
          <t-button variant="text" theme="danger" @click="handleLogout">
            <template #icon><LogoutIcon /></template>
            退出
          </t-button>
        </div>
      </t-header>
      <t-content class="m-4 p-4 bg-white rounded-lg shadow-sm">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  DashboardIcon,
  FileTxtIcon,
  LightbulbIcon,
  UserIcon,
  ChatIcon,
  SendIcon,
  LogoutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'tdesign-icons-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const activeMenu = ref('dashboard')

watch(
  () => route.name,
  (name) => {
    if (name === 'Articles' || name === 'ArticleCreate' || name === 'ArticleEdit') {
      activeMenu.value = 'articles'
    } else if (name === 'Intelligence' || name === 'IntelligenceCreate' || name === 'IntelligenceEdit') {
      activeMenu.value = 'intelligence'
    } else if (name === 'Users' || name === 'UserCreate' || name === 'UserEdit') {
      activeMenu.value = 'users'
    } else if (name === 'Feedback') {
      activeMenu.value = 'feedback'
    } else if (name === 'PushRecords') {
      activeMenu.value = 'pushRecords'
    } else {
      activeMenu.value = 'dashboard'
    }
  },
  { immediate: true }
)

function handleMenuClick(value: string) {
  const routeNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    articles: 'Articles',
    intelligence: 'Intelligence',
    users: 'Users',
    feedback: 'Feedback',
    pushRecords: 'PushRecords',
  }
  router.push({ name: routeNameMap[value] || value })
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
:deep(.t-menu--dark) {
  background: transparent;
}
</style>