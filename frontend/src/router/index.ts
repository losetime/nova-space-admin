import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/ArticlesView.vue'),
      },
      {
        path: 'articles/create',
        name: 'ArticleCreate',
        component: () => import('@/views/ArticleEditView.vue'),
      },
      {
        path: 'articles/:id/edit',
        name: 'ArticleEdit',
        component: () => import('@/views/ArticleEditView.vue'),
      },
      {
        path: 'intelligence',
        name: 'Intelligence',
        component: () => import('@/views/IntelligenceView.vue'),
      },
      {
        path: 'intelligence/create',
        name: 'IntelligenceCreate',
        component: () => import('@/views/IntelligenceEditView.vue'),
      },
      {
        path: 'intelligence/:id/edit',
        name: 'IntelligenceEdit',
        component: () => import('@/views/IntelligenceEditView.vue'),
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UsersView.vue'),
      },
      {
        path: 'users/create',
        name: 'UserCreate',
        component: () => import('@/views/UserEditView.vue'),
      },
      {
        path: 'users/:id/edit',
        name: 'UserEdit',
        component: () => import('@/views/UserEditView.vue'),
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/FeedbackView.vue'),
      },
      {
        path: 'subscriptions',
        name: 'Subscriptions',
        component: () => import('@/views/SubscriptionsView.vue'),
      },
      {
        path: 'quiz',
        name: 'Quiz',
        component: () => import('@/views/QuizView.vue'),
      },
      {
        path: 'satellite-sync',
        name: 'SatelliteSync',
        component: () => import('@/views/SatelliteSyncView.vue'),
      },
      {
        path: 'milestones',
        name: 'Milestones',
        component: () => import('@/views/MilestonesView.vue'),
      },
      {
        path: 'milestones/create',
        name: 'MilestoneCreate',
        component: () => import('@/views/MilestoneEditView.vue'),
      },
      {
        path: 'milestones/:id/edit',
        name: 'MilestoneEdit',
        component: () => import('@/views/MilestoneEditView.vue'),
      },
      {
        path: 'companies',
        name: 'Companies',
        component: () => import('@/views/CompaniesView.vue'),
      },
      {
        path: 'companies/create',
        name: 'CompanyCreate',
        component: () => import('@/views/CompanyEditView.vue'),
      },
      {
        path: 'companies/:id/edit',
        name: 'CompanyEdit',
        component: () => import('@/views/CompanyEditView.vue'),
      },
      {
        path: 'membership/plans',
        name: 'MembershipPlans',
        component: () => import('@/views/MembershipPlansView.vue'),
      },
      {
        path: 'membership/benefits',
        name: 'MembershipBenefits',
        component: () => import('@/views/MembershipBenefitsView.vue'),
      },
      {
        path: 'membership/levels',
        name: 'MembershipLevels',
        component: () => import('@/views/MembershipLevelsView.vue'),
      },
      {
        path: 'membership/subscriptions',
        name: 'MembershipSubscriptions',
        component: () => import('@/views/MembershipSubscriptionsView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 没有token，跳转登录
    if (!authStore.isAuthenticated) {
      return { name: 'Login', query: { redirect: to.fullPath } }
    }

    // 有token但没有用户信息，尝试获取
    if (!authStore.user) {
      try {
        await authStore.fetchProfile()
      } catch (error) {
        return { name: 'Login', query: { redirect: to.fullPath } }
      }
    }
  }

  // 已登录访问登录页，跳转首页
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router