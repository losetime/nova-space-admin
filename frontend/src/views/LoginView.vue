<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="login-content">
        <div class="login-left">
          <div class="login-banner">
            <RocketIcon class="banner-icon" />
            <h1 class="banner-title">Nova Space</h1>
            <p class="banner-desc">航天科普情报管理平台</p>
          </div>
        </div>
        <div class="login-right">
          <div class="login-form-wrapper">
            <div class="login-header">
              <RocketIcon class="login-icon" />
              <h2 class="login-title">管理员登录</h2>
              <p class="login-subtitle">欢迎使用 Nova Space 管理后台</p>
            </div>
            <t-form
              :data="form"
              :rules="rules"
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
              <span class="login-tip">提示：管理员账户请联系系统管理员获取</span>
            </div>
          </div>
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
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-bg {
  width: 100%;
  max-width: 1000px;
  margin: 0 20px;
}

.login-content {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-banner {
  text-align: center;
  color: #fff;
}

.banner-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.banner-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 10px;
}

.banner-desc {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 320px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-tip {
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .login-left {
    display: none;
  }

  .login-content {
    max-width: 400px;
  }
}
</style>