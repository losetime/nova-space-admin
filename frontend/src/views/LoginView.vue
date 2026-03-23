<template>
  <div class="login-wrapper">
    <!-- 左侧登录区域 -->
    <div class="login-left">
      <div class="login-container">
        <div class="title-container">
          <h1 class="title margin-no">账号登录</h1>
          <h1 class="title">Nova Space - 后台管理系统</h1>
        </div>

        <t-form
          ref="formRef"
          class="item-container"
          :data="formData"
          :rules="FORM_RULES"
          label-width="0"
          @submit="onSubmit"
        >
          <t-form-item name="username">
            <t-input
              v-model="formData.username"
              size="large"
              placeholder="请输入用户名"
              clearable
            >
              <template #prefix-icon>
                <t-icon name="user" />
              </template>
            </t-input>
          </t-form-item>

          <t-form-item name="password">
            <t-input
              v-model="formData.password"
              size="large"
              :type="showPsw ? 'text' : 'password'"
              clearable
              placeholder="请输入密码"
            >
              <template #prefix-icon>
                <t-icon name="lock-on" />
              </template>
              <template #suffix-icon>
                <t-icon :name="showPsw ? 'browse' : 'browse-off'" @click="showPsw = !showPsw" />
              </template>
            </t-input>
          </t-form-item>

          <t-form-item class="btn-container">
            <t-button block size="large" theme="primary" type="submit" :loading="loading">
              登录
            </t-button>
          </t-form-item>
        </t-form>
      </div>

      <footer class="copyright">Copyright @ 2024-2025 Nova Space. All Rights Reserved</footer>
    </div>

    <!-- 右侧背景区域 -->
    <div class="login-right"></div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, SubmitContext } from 'tdesign-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineOptions({
  name: 'LoginView',
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstanceFunctions>()
const loading = ref(false)
const showPsw = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

const FORM_RULES: Record<string, FormRule[]> = {
  username: [{ required: true, message: '请输入用户名', type: 'error' }],
  password: [{ required: true, message: '请输入密码', type: 'error' }],
}

const onSubmit = async (ctx: SubmitContext) => {
  if (ctx.validateResult !== true) return

  loading.value = true
  try {
    const res = await authStore.login(formData.username, formData.password)
    if (res.success) {
      MessagePlugin.success('登录成功')
      const redirect = route.query.redirect as string
      const redirectUrl = redirect ? decodeURIComponent(redirect) : '/dashboard'
      router.push(redirectUrl)
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
  height: 100vh;
  display: flex;
}

.login-left {
  width: 550px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #fff;
  padding: 40px 60px;
  position: relative;
}

.login-right {
  flex: 1;
  background-image: url('@/assets/login-bg.png');
  background-size: cover;
  background-position: center;
}

.login-container {
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.title-container {
  margin-bottom: 48px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: var(--td-text-color-primary, #000);
  margin-top: 8px;
}

.title.margin-no {
  margin-top: 0;
  font-size: 16px;
  font-weight: 400;
  color: var(--td-text-color-secondary, #666);
}

.item-container {
  width: 100%;
}

.btn-container {
  margin-top: 48px;
}

.copyright {
  position: absolute;
  left: 80px;
  bottom: 40px;
  font-size: 14px;
  color: var(--td-text-color-secondary, #666);
}

@media screen and (max-width: 900px) {
  .login-right {
    display: none;
  }
}

@media screen and (max-height: 700px) {
  .copyright {
    display: none;
  }
}
</style>