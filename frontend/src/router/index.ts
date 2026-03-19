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
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchProfile()
    } catch (error) {
      // Token invalid, will redirect to login
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router