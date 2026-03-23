<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-header">
        <RocketIcon class="login-logo" />
        <span class="login-title">Nova Space</span>
      </div>
      <div class="login-card">
        <div class="login-card-header">
          <h3>账号登录</h3>
        </div>
        <t-form
          :data="form"
          :rules="rules"
          class="login-form"
          @submit="handleSubmit"
        >
          <t-form-item name="username">
            <t-input
              v-model="form.username"
              size="large"
              placeholder="请输入用户名"
              clearable
            >
              <template #prefix-icon><UserIcon /></template>
            </t-input>
          </t-form-item>
          <t-form-item name="password">
            <t-input
              v-model="form.password"
              type="password"
              size="large"
              placeholder="请输入密码"
              clearable
            >
              <template #prefix-icon><LockOnIcon /></template>
            </t-input>
          </t-form-item>
          <t-form-item>
            <t-button
              theme="primary"
              type="submit"
              size="large"
              block
              :loading="loading"
            >
              登录
            </t-button>
          </t-form-item>
        </t-form>
        <div class="login-footer">
          <span>Copyright © 2024 Nova Space. All Rights Reserved.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { UserIcon, LockOnIcon, RocketIcon } from 'tdesign-icons-vue-next'
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

<style scoped>
.login-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #e0e5ec 0%, #f5f7fa 100%);
  overflow: hidden;
}

.login-wrapper::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.login-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 36px;
  color: #667eea;
  margin-right: 12px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 40px;
}

.login-card-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.login-form {
  margin-bottom: 24px;
}

.login-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.login-footer span {
  font-size: 12px;
  color: #999;
}
</style>