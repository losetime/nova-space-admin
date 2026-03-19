<template>
  <div>
    <div class="flex items-center mb-4">
      <a-button type="link" @click="$router.back()">
        <ArrowLeftOutlined />
        返回
      </a-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑用户' : '新建用户' }}</h2>
    </div>

    <a-form
      :model="form"
      :rules="rules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
      @finish="handleSubmit"
    >
      <a-form-item label="用户名" name="username">
        <a-input v-model:value="form.username" placeholder="请输入用户名（字母、数字、下划线，3-20位）" />
      </a-form-item>

      <a-form-item v-if="!isEdit" label="密码" name="password">
        <a-input-password v-model:value="form.password" placeholder="请输入密码（包含字母和数字，6-20位）" />
      </a-form-item>

      <a-form-item v-if="isEdit" label="密码">
        <a-button type="default" @click="showResetPassword">重置密码</a-button>
      </a-form-item>

      <a-form-item label="邮箱" name="email">
        <a-input v-model:value="form.email" placeholder="请输入邮箱" />
      </a-form-item>

      <a-form-item label="手机号" name="phone">
        <a-input v-model:value="form.phone" placeholder="请输入手机号" />
      </a-form-item>

      <a-form-item label="昵称" name="nickname">
        <a-input v-model:value="form.nickname" placeholder="请输入昵称" />
      </a-form-item>

      <a-form-item label="头像" name="avatar">
        <a-input v-model:value="form.avatar" placeholder="头像图片URL" />
      </a-form-item>

      <a-form-item label="角色" name="role">
        <a-select v-model:value="form.role" placeholder="请选择角色">
          <a-select-option value="user">普通用户</a-select-option>
          <a-select-option value="admin">管理员</a-select-option>
          <a-select-option value="super_admin">超级管理员</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="等级" name="level">
        <a-select v-model:value="form.level" placeholder="请选择等级">
          <a-select-option value="basic">基础</a-select-option>
          <a-select-option value="advanced">进阶</a-select-option>
          <a-select-option value="professional">专业</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="状态" name="isActive">
        <a-switch v-model:checked="form.isActive" checked-children="启用" un-checked-children="禁用" />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 4 }">
        <a-space>
          <a-button type="primary" html-type="submit" :loading="loading">
            {{ isEdit ? '保存' : '创建' }}
          </a-button>
          <a-button @click="$router.back()">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { userApi } from '@/api'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
  nickname: '',
  avatar: '',
  role: 'user' as 'user' | 'admin' | 'super_admin',
  level: 'basic' as 'basic' | 'advanced' | 'professional',
  isActive: true,
})

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名只能包含字母、数字、下划线，长度3-20位' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/, message: '密码必须包含字母和数字，长度6-20位' },
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
  ],
}

async function fetchUser() {
  if (!isEdit.value) return
  try {
    const res = await userApi.getOne(route.params.id as string)
    if (res.success) {
      Object.assign(form, {
        ...res.data,
        password: '',
      })
    }
  } catch (error) {
    message.error('获取用户信息失败')
    router.back()
  }
}

async function handleSubmit() {
  loading.value = true
  try {
    const data: any = { ...form }
    // Remove password for edit mode
    if (isEdit.value) {
      delete data.password
    }
    if (isEdit.value) {
      await userApi.update(route.params.id as string, data)
      message.success('保存成功')
    } else {
      await userApi.create(data)
      message.success('创建成功')
    }
    router.push('/users')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

function showResetPassword() {
  Modal.confirm({
    title: '重置密码',
    content: '确定要重置该用户的密码吗？系统将生成一个新的随机密码。',
    async onOk() {
      try {
        const res = await userApi.resetPassword(route.params.id as string)
        if (res.success) {
          Modal.success({
            title: '密码重置成功',
            content: `新密码: ${res.data.password}`,
          })
        }
      } catch (error: any) {
        message.error(error.message || '重置密码失败')
      }
    },
  })
}

onMounted(fetchUser)
</script>