<template>
  <div>
    <div class="flex items-center mb-4">
      <a-button type="link" @click="$router.back()">
        <ArrowLeftOutlined />
        返回
      </a-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑情报' : '新建情报' }}</h2>
    </div>

    <a-form
      :model="form"
      :rules="rules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
      @finish="handleSubmit"
    >
      <a-form-item label="标题" name="title">
        <a-input v-model:value="form.title" placeholder="请输入标题" />
      </a-form-item>

      <a-form-item label="分类" name="category">
        <a-select v-model:value="form.category" placeholder="请选择分类">
          <a-select-option value="launch">发射</a-select-option>
          <a-select-option value="satellite">卫星</a-select-option>
          <a-select-option value="industry">行业</a-select-option>
          <a-select-option value="research">科研</a-select-option>
          <a-select-option value="environment">环境</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="等级" name="level">
        <a-select v-model:value="form.level" placeholder="请选择等级">
          <a-select-option value="free">免费</a-select-option>
          <a-select-option value="advanced">进阶</a-select-option>
          <a-select-option value="professional">专业</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="摘要" name="summary">
        <a-textarea
          v-model:value="form.summary"
          placeholder="请输入摘要"
          :rows="3"
        />
      </a-form-item>

      <a-form-item label="来源" name="source">
        <a-input v-model:value="form.source" placeholder="请输入来源" />
      </a-form-item>

      <a-form-item label="来源链接" name="sourceUrl">
        <a-input v-model:value="form.sourceUrl" placeholder="来源URL（可选）" />
      </a-form-item>

      <a-form-item label="封面" name="cover">
        <a-input v-model:value="form.cover" placeholder="封面图片URL（可选）" />
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-input v-model:value="form.tags" placeholder="标签，逗号分隔" />
      </a-form-item>

      <a-form-item label="内容" name="content">
        <a-textarea
          v-model:value="form.content"
          placeholder="请输入内容"
          :rows="10"
        />
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
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { intelligenceApi } from '@/api'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const form = reactive({
  title: '',
  content: '',
  summary: '',
  cover: '',
  category: 'launch' as 'launch' | 'satellite' | 'industry' | 'research' | 'environment',
  level: 'free' as 'free' | 'advanced' | 'professional',
  source: '',
  sourceUrl: '',
  tags: '',
})

const rules = {
  title: [{ required: true, message: '请输入标题' }],
  content: [{ required: true, message: '请输入内容' }],
  summary: [{ required: true, message: '请输入摘要' }],
  category: [{ required: true, message: '请选择分类' }],
  level: [{ required: true, message: '请选择等级' }],
  source: [{ required: true, message: '请输入来源' }],
}

async function fetchIntelligence() {
  if (!isEdit.value) return
  try {
    const res = await intelligenceApi.getOne(Number(route.params.id))
    if (res.success) {
      Object.assign(form, res.data)
    }
  } catch (error) {
    message.error('获取情报失败')
    router.back()
  }
}

async function handleSubmit() {
  loading.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      await intelligenceApi.update(Number(route.params.id), data)
      message.success('保存成功')
    } else {
      await intelligenceApi.create(data)
      message.success('创建成功')
    }
    router.push('/intelligence')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchIntelligence)
</script>