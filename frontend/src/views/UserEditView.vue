<template>
  <div class="page-container">
    <div class="flex items-center mb-4">
      <t-button variant="text" @click="$router.back()">
        <template #icon><ChevronLeftIcon /></template>
        返回
      </t-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑用户' : '新建用户' }}</h2>
    </div>

    <t-form
      :data="form"
      :rules="rules"
      :label-width="100"
      @submit="handleSubmit"
    >
      <t-form-item label="用户名" name="username">
        <t-input v-model="form.username" placeholder="请输入用户名（字母、数字、下划线，3-20位）" clearable />
      </t-form-item>

      <t-form-item v-if="!isEdit" label="密码" name="password">
        <t-input v-model="form.password" type="password" placeholder="请输入密码（包含字母和数字，6-20位）" clearable />
      </t-form-item>

      <t-form-item v-if="isEdit" label="密码">
        <t-button variant="outline" @click="showResetPassword">重置密码</t-button>
      </t-form-item>

      <t-form-item label="邮箱" name="email">
        <t-input v-model="form.email" placeholder="请输入邮箱" clearable />
      </t-form-item>

      <t-form-item label="手机号" name="phone">
        <t-input v-model="form.phone" placeholder="请输入手机号" clearable />
      </t-form-item>

      <t-form-item label="昵称" name="nickname">
        <t-input v-model="form.nickname" placeholder="请输入昵称" clearable />
      </t-form-item>

      <t-form-item label="头像" name="avatar">
        <t-input v-model="form.avatar" placeholder="头像图片URL" clearable />
      </t-form-item>

      <t-form-item label="角色" name="role">
        <t-select v-model="form.role" placeholder="请选择角色" clearable>
          <t-option value="user" label="普通用户" />
          <t-option value="admin" label="管理员" />
          <t-option value="super_admin" label="超级管理员" />
        </t-select>
      </t-form-item>

      <t-form-item label="等级" name="level">
        <span>{{ form.levelName || form.level || '无' }}</span>
      </t-form-item>

      <t-form-item label="状态" name="isActive">
        <t-switch v-model="form.isActive" :label="['启用', '禁用']" />
      </t-form-item>

      <t-form-item>
        <t-space>
          <t-button theme="primary" type="submit" :loading="loading">
            {{ isEdit ? '保存' : '创建' }}
          </t-button>
          <t-button variant="outline" @click="$router.back()">取消</t-button>
        </t-space>
      </t-form-item>
    </t-form>

    <div v-if="isEdit && subscription" class="subscription-info">
      <h3 class="text-lg font-bold mb-4">订阅信息</h3>
      <t-descriptions :column="2" border>
        <t-descriptions-item label="套餐名称">{{ subscription.planName || subscription.plan }}</t-descriptions-item>
        <t-descriptions-item label="状态">
          <t-tag :theme="subscription.status === 'active' ? 'success' : 'default'" variant="light">
            {{ subscription.status === 'active' ? '生效中' : subscription.status }}
          </t-tag>
        </t-descriptions-item>
        <t-descriptions-item label="开始日期">{{ formatDate(subscription.startDate) }}</t-descriptions-item>
        <t-descriptions-item label="到期日期">{{ formatDate(subscription.endDate) }}</t-descriptions-item>
      </t-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { ChevronLeftIcon } from 'tdesign-icons-vue-next'
import { userApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const subscription = ref<any>(null)

const form = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
  nickname: '',
  avatar: '',
  role: 'user' as 'user' | 'admin' | 'super_admin',
  level: '',
  levelName: '',
  isActive: true,
})

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名只能包含字母、数字、下划线，长度3-20位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/, message: '密码必须包含字母和数字，长度6-20位', trigger: 'blur' },
  ],
  email: [
    { email: true, message: '邮箱格式不正确', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

async function fetchUser() {
  if (!isEdit.value) return
  try {
    const res = await userApi.getOne(route.params.id as string)
    if (res.success) {
      const { subscription: sub, ...userData } = res.data
      Object.assign(form, {
        ...userData,
        password: '',
      })
      subscription.value = sub
    }
  } catch (error) {
    MessagePlugin.error('获取用户信息失败')
    router.back()
  }
}

async function handleSubmit({ validateResult }: { validateResult: boolean }) {
  if (!validateResult) return

  loading.value = true
  try {
    const data: any = { ...form }
    delete data.level
    delete data.levelName
    if (isEdit.value) {
      delete data.password
      await userApi.update(route.params.id as string, data)
      MessagePlugin.success('保存成功')
    } else {
      await userApi.create(data)
      MessagePlugin.success('创建成功')
    }
    router.push('/users')
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

function showResetPassword() {
  const confirmDialog = DialogPlugin.confirm({
    header: '重置密码',
    body: '确定要重置该用户的密码吗？系统将生成一个新的随机密码。',
    onConfirm: async () => {
      try {
        const res = await userApi.resetPassword(route.params.id as string)
        if (res.success) {
          DialogPlugin.alert({
            header: '密码重置成功',
            body: `新密码: ${res.data.password}`,
          })
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || '重置密码失败')
      }
      confirmDialog.hide()
    },
  })
}

onMounted(fetchUser)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
.subscription-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e7e7e7;
}
</style>