<template>
  <div class="page-container">
    <t-card>
      <t-form
        :data="form"
        :rules="rules"
        ref="formRef"
        label-align="right"
        :label-width="120"
        @submit="handleSubmit"
      >
        <t-form-item label="公司名称" name="name">
          <t-input v-model="form.name" placeholder="请输入公司名称" clearable />
        </t-form-item>

        <t-form-item label="国家" name="country">
          <t-input v-model="form.country" placeholder="请输入国家" clearable />
        </t-form-item>

        <t-form-item label="成立年份" name="foundedYear">
          <t-input-number
            v-model="form.foundedYear"
            placeholder="请输入成立年份"
            :min="1800"
            :max="new Date().getFullYear()"
            style="width: 100%"
          />
        </t-form-item>

        <t-form-item label="官网地址" name="website">
          <t-input v-model="form.website" placeholder="请输入官网地址" clearable />
        </t-form-item>

        <t-form-item label="公司 Logo" name="logoUrl">
          <t-input v-model="form.logoUrl" placeholder="请输入Logo URL" clearable class="mb-2" />
          <div class="flex items-center space-x-4">
            <div v-if="form.logoUrl" class="relative">
              <img :src="form.logoUrl" class="w-24 h-24 object-contain border rounded" />
            </div>
            <t-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :multiple="false"
              :auto-upload="true"
              theme="image"
              accept="image/*"
              :format-response="handleUploadResponse"
            >
              <template #file-list-display>
                <div></div>
              </template>
              <t-button variant="outline" size="small">
                <template #icon><UploadIcon /></template>
                上传图片
              </t-button>
            </t-upload>
          </div>
        </t-form-item>

        <t-form-item label="公司描述" name="description">
          <t-textarea
            v-model="form.description"
            placeholder="请输入公司描述"
            :autosize="{ minRows: 6, maxRows: 10 }"
          />
        </t-form-item>

        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit" :loading="loading">
              {{ isEdit ? '更新' : '创建' }}
            </t-button>
            <t-button variant="outline" @click="$router.back()">
              取消
            </t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { UploadIcon } from 'tdesign-icons-vue-next'
import { companyApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)

const isEdit = computed(() => !!route.params.id)
const companyId = computed(() => Number(route.params.id))

const form = reactive({
  name: '',
  country: '',
  foundedYear: undefined as number | undefined,
  website: '',
  description: '',
  logoUrl: '',
})

const rules = {
  name: [
    { required: true, message: '请输入公司名称' },
    { max: 100, message: '公司名称最多 100 个字符' },
  ],
  website: [
    { url: { protocols: ['http', 'https'], require_protocol: true }, message: '请输入有效的网址' },
  ],
}

const uploadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/upload/image`
const uploadHeaders = {
  Authorization: `Bearer ${authStore.token}`,
}

function handleUploadResponse(response: any) {
  if (response.success) {
    form.logoUrl = response.data.url
    MessagePlugin.success('上传成功')
  } else {
    MessagePlugin.error(response.message || '上传失败')
  }
  return response
}

async function fetchCompany() {
  if (!isEdit.value) return

  try {
    const res = await companyApi.getOne(companyId.value)
    if (res.success) {
      Object.assign(form, res.data)
    }
  } catch (error) {
    MessagePlugin.error('获取公司信息失败')
    router.back()
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    if (isEdit.value) {
      await companyApi.update(companyId.value, form)
      MessagePlugin.success('更新成功')
    } else {
      await companyApi.create(form)
      MessagePlugin.success('创建成功')
    }
    router.push('/companies')
  } catch (error) {
    MessagePlugin.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCompany()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>