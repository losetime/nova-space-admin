<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900">
    <t-card class="w-96 shadow-xl">
      <template #header>
        <div class="text-center text-xl font-bold">Nova Space 管理后台</div>
      </template>
      <t-form
        :data="form"
        :rules="rules"
        @submit="handleSubmit"
      >
        <t-form-item name="username">
          <t-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            clearable
          >
            <template #prefix-icon><UserIcon /></template>
          </t-input>
        </t-form-item>
        <t-form-item name="password">
          <t-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            clearable
          >
            <template #prefix-icon><LockOnIcon /></template>
          </t-input>
        </t-form-item>
        <t-form-item>
          <t-button
            theme="primary"
            type="submit"
            :loading="loading"
            block
            size="large"
          >
            登录
          </t-button>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { UserIcon, LockOnIcon } from 'tdesign-icons-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleSubmit({ validateResult }: { validateResult: boolean }) {
  if (!validateResult) return

  loading.value = true
  try {
    const res = await authStore.login(form.username, form.password)
    if (res.success) {
      MessagePlugin.success('登录成功')
      const redirect = route.query.redirect as string
      router.push(redirect || '/dashboard')
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>