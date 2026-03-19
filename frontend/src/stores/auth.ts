import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() =>
    user.value?.role === 'admin' || user.value?.role === 'super_admin'
  )

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    if (res.success) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('admin_token', res.data.token)
    }
    return res
  }

  async function fetchProfile() {
    if (!token.value) return null
    try {
      const res = await authApi.getProfile()
      if (res.success) {
        user.value = res.data
      }
      return res
    } catch (error) {
      logout()
      throw error
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('admin_token')
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    fetchProfile,
  }
})