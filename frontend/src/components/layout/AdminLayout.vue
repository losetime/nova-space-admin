<template>
  <t-layout class="admin-layout">
    <!-- 侧边栏 -->
    <t-aside class="admin-aside">
      <t-menu
        :value="activeMenu"
        :collapsed="collapsed"
        theme="dark"
        :width="['232px', '64px']"
        @change="handleMenuClick"
      >
        <template #logo>
          <div class="side-nav-logo" @click="router.push('/dashboard')">
            <RocketIcon v-if="!collapsed" class="logo-icon" />
            <RocketIcon v-else class="logo-icon-small" />
            <span v-if="!collapsed" class="logo-text">Nova Space</span>
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
        <t-menu-item value="quiz">
          <template #icon><QuestionnaireIcon /></template>
          问答管理
        </t-menu-item>
        <t-menu-item value="satelliteSync">
          <template #icon><CloudDownloadIcon /></template>
          卫星数据同步
        </t-menu-item>
        <t-menu-item value="milestones">
          <template #icon><TimeFilledIcon /></template>
          里程碑管理
        </t-menu-item>

        <template #operations>
          <t-button variant="text" shape="square" @click="collapsed = !collapsed">
            <template #icon>
              <ChevronLeftIcon v-if="!collapsed" />
              <ChevronRightIcon v-else />
            </template>
          </t-button>
        </template>
      </t-menu>
    </t-aside>

    <!-- 主内容区 -->
    <t-layout class="admin-main">
      <!-- 顶部导航 -->
      <t-header class="admin-header">
        <t-head-menu>
          <template #logo>
            <t-breadcrumb class="header-breadcrumb">
              <t-breadcrumb-item>管理后台</t-breadcrumb-item>
              <t-breadcrumb-item>{{ currentRouteTitle }}</t-breadcrumb-item>
            </t-breadcrumb>
          </template>
          <template #operations>
            <div class="header-operations">
              <t-dropdown :min-column-width="120" trigger="click">
                <t-button theme="default" variant="text">
                  <template #icon>
                    <t-icon name="user-circle" />
                  </template>
                  <span class="user-name">{{ authStore.user?.username }}</span>
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
          </template>
        </t-head-menu>
      </t-header>

      <!-- 内容区 -->
      <t-content class="admin-content">
        <router-view />
      </t-content>

      <!-- 底部 -->
      <t-footer class="admin-footer">
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
  QuestionnaireIcon,
  CloudDownloadIcon,
  TimeFilledIcon,
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
  Quiz: '问答管理',
  SatelliteSync: '卫星数据同步',
  Milestones: '里程碑管理',
  MilestoneCreate: '新建里程碑',
  MilestoneEdit: '编辑里程碑',
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
    } else if (name === 'Quiz') {
      activeMenu.value = 'quiz'
    } else if (name === 'SatelliteSync') {
      activeMenu.value = 'satelliteSync'
    } else if (name === 'Milestones' || name === 'MilestoneCreate' || name === 'MilestoneEdit') {
      activeMenu.value = 'milestones'
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
    quiz: 'Quiz',
    satelliteSync: 'SatelliteSync',
    milestones: 'Milestones',
  }
  router.push({ name: routeNameMap[value] || value })
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.admin-aside {
  background: #242424;
  transition: width 0.2s;
}

.side-nav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  cursor: pointer;
  color: #fff;
}

.admin-aside :deep(.t-menu__logo) {
  height: 64px;
}

.admin-aside :deep(.t-menu__operations .t-button) {
  color: rgba(255, 255, 255, 0.55);
}

.admin-aside :deep(.t-menu__operations .t-button:hover) {
  color: #fff;
}

.logo-icon {
  font-size: 32px;
}

.logo-icon-small {
  font-size: 28px;
}

.logo-text {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.admin-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.admin-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--td-component-stroke);
  padding: 0 24px;
}

.admin-header :deep(.t-head-menu) {
  height: 100%;
}

.admin-header :deep(.t-head-menu__inner) {
  border-bottom: none;
}

.header-breadcrumb {
  margin-left: 0;
}

.header-operations {
  display: flex;
  align-items: center;
}

.user-name {
  margin-left: 8px;
  margin-right: 4px;
}

.admin-content {
  flex: 1;
  padding: 24px;
  background: var(--td-bg-color-page);
  overflow: auto;
}

.admin-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-top: 1px solid var(--td-component-stroke);
  color: var(--td-text-color-secondary);
  font-size: 14px;
}
</style>