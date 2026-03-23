<template>
  <t-layout class="min-h-screen">
    <t-aside class="aside">
      <t-menu
        :value="activeMenu"
        :collapsed="collapsed"
        :width="['220px', '64px']"
        theme="dark"
        @change="handleMenuClick"
      >
        <template #logo>
          <div class="menu-logo">
            <RocketIcon class="menu-logo-icon" />
            <span v-if="!collapsed" class="menu-logo-text">Nova Space</span>
          </div>
        </template>
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
        <template #operations>
          <t-button
            variant="text"
            shape="square"
            @click="collapsed = !collapsed"
          >
            <template #icon>
              <ChevronLeftIcon v-if="!collapsed" />
              <ChevronRightIcon v-else />
            </template>
          </t-button>
        </template>
      </t-menu>
    </t-aside>
    <t-layout>
      <t-header class="header">
        <div class="header-left">
          <t-breadcrumb>
            <t-breadcrumb-item>管理后台</t-breadcrumb-item>
            <t-breadcrumb-item>{{ currentRouteTitle }}</t-breadcrumb-item>
          </t-breadcrumb>
        </div>
        <div class="header-right">
          <t-dropdown>
            <t-button variant="text">
              <template #icon><UserIcon /></template>
              <span class="ml-1">{{ authStore.user?.username }}</span>
              <template #suffix><ChevronDownIcon /></template>
            </t-button>
            <template #dropdown>
              <t-dropdown-menu>
                <t-dropdown-item @click="handleLogout">
                  <template #leftIcon><LogoutIcon /></template>
                  退出登录
                </t-dropdown-item>
              </t-dropdown-menu>
            </template>
          </t-dropdown>
        </div>
      </t-header>
      <t-content class="content">
        <router-view />
      </t-content>
      <t-footer class="footer">
        Copyright © 2024 Nova Space. All Rights Reserved.
      </t-footer>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  ChevronDownIcon,
} from 'tdesign-icons-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const activeMenu = ref('dashboard')

const routeTitleMap: Record<string, string> = {
  Dashboard: '仪表盘',
  Articles: '科普管理',
  ArticleCreate: '新建科普',
  ArticleEdit: '编辑科普',
  Intelligence: '情报管理',
  IntelligenceCreate: '新建情报',
  IntelligenceEdit: '编辑情报',
  Users: '用户管理',
  UserCreate: '新建用户',
  UserEdit: '编辑用户',
  Feedback: '反馈管理',
  PushRecords: '推送记录',
}

const currentRouteTitle = computed(() => {
  return routeTitleMap[route.name as string] || '仪表盘'
})

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
.aside {
  background: #001529;
}

.menu-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  color: #fff;
}

.menu-logo-icon {
  font-size: 28px;
}

.menu-logo-text {
  margin-left: 10px;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 3px;
  min-height: calc(100vh - 64px - 64px - 32px);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  color: #666;
  font-size: 14px;
}
</style>