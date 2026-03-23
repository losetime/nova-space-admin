<template>
  <t-layout class="min-h-screen">
    <t-aside
      :collapsed="collapsed"
      :width="220"
      :collapsed-width="64"
      class="bg-[#001529]"
    >
      <div class="p-4 text-white text-center flex items-center justify-center">
        <template v-if="!collapsed">
          <RocketIcon class="mr-2" />
          <h1 class="text-lg font-bold">Nova Space</h1>
        </template>
        <RocketIcon v-else class="text-2xl" />
      </div>
      <t-menu
        :value="activeMenu"
        theme="dark"
        @change="handleMenuClick"
      >
        <t-menu-item value="dashboard">
          <template #icon><DashboardIcon /></template>
          <span>仪表盘</span>
        </t-menu-item>
        <t-menu-item value="articles">
          <template #icon><FileTxtIcon /></template>
          <span>科普管理</span>
        </t-menu-item>
        <t-menu-item value="intelligence">
          <template #icon><LightbulbIcon /></template>
          <span>情报管理</span>
        </t-menu-item>
        <t-menu-item value="users">
          <template #icon><UserIcon /></template>
          <span>用户管理</span>
        </t-menu-item>
        <t-menu-item value="feedback">
          <template #icon><ChatIcon /></template>
          <span>反馈管理</span>
        </t-menu-item>
        <t-menu-item value="pushRecords">
          <template #icon><SendIcon /></template>
          <span>推送记录</span>
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
  RocketIcon,
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