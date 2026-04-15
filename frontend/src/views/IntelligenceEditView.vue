<template>
  <div class="page-container">
    <div class="flex items-center mb-4">
      <t-button variant="text" @click="$router.back()">
        <template #icon><ChevronLeftIcon /></template>
        返回
      </t-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑情报' : '新建情报' }}</h2>
    </div>

    <t-form
      :data="form"
      :rules="rules"
      :label-width="100"
      @submit="handleSubmit"
    >
      <t-form-item label="标题" name="title">
        <t-input v-model="form.title" placeholder="请输入标题" clearable />
      </t-form-item>

      <t-form-item label="分类" name="category">
        <t-select v-model="form.category" placeholder="请选择分类" clearable>
          <t-option value="launch" label="发射" />
          <t-option value="satellite" label="卫星" />
          <t-option value="industry" label="行业" />
          <t-option value="research" label="科研" />
          <t-option value="environment" label="环境" />
        </t-select>
      </t-form-item>

      <t-form-item label="等级" name="level">
        <t-select v-model="form.level" placeholder="请选择等级" clearable>
          <t-option value="free" label="免费" />
          <t-option value="advanced" label="进阶" />
          <t-option value="professional" label="专业" />
        </t-select>
      </t-form-item>

      <t-form-item label="摘要" name="summary">
        <t-textarea
          v-model="form.summary"
          placeholder="请输入摘要"
          :autosize="{ minRows: 3 }"
        />
      </t-form-item>

      <t-form-item label="来源" name="source">
        <t-input v-model="form.source" placeholder="请输入来源" clearable />
      </t-form-item>

      <t-form-item label="来源链接" name="sourceUrl">
        <t-input v-model="form.sourceUrl" placeholder="来源URL（可选）" clearable />
      </t-form-item>

      <t-form-item label="封面" name="cover">
        <t-input v-model="form.cover" placeholder="封面图片URL（可选）" clearable />
      </t-form-item>

      <t-form-item label="标签" name="tags">
        <t-tag-input
          v-model="tagsArray"
          placeholder="输入标签后回车"
          clearable
        />
      </t-form-item>

      <t-form-item label="内容" name="content">
        <RichTextEditor
          v-model="form.content"
          placeholder="请输入情报内容，支持富文本编辑"
        />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { ChevronLeftIcon } from 'tdesign-icons-vue-next'
import { intelligenceApi } from '@/api'
import RichTextEditor from '@/components/RichTextEditor.vue'

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

// 标签数组
const tagsArray = ref<string[]>([])

// 监听 tagsArray 变化，同步到 form.tags
watch(tagsArray, (val) => {
  form.tags = val.join(',')
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  summary: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }],
}

async function fetchIntelligence() {
  if (!isEdit.value) return
  try {
    const res = await intelligenceApi.getOne(Number(route.params.id))
    if (res.success) {
      Object.assign(form, {
        ...res.data,
        tags: Array.isArray(res.data.tags) ? res.data.tags.join(',') : res.data.tags || '',
      })
      tagsArray.value = Array.isArray(res.data.tags) ? res.data.tags : (res.data.tags ? res.data.tags.split(',').filter(Boolean) : [])
    }
  } catch (error) {
    MessagePlugin.error('获取情报失败')
    router.back()
  }
}

async function handleSubmit({ validateResult }: { validateResult: boolean }) {
  if (!validateResult) return

  loading.value = true
  try {
    const data = {
      ...form,
      tags: tagsArray.value,
    }
    if (isEdit.value) {
      await intelligenceApi.update(Number(route.params.id), data)
      MessagePlugin.success('保存成功')
    } else {
      await intelligenceApi.create(data)
      MessagePlugin.success('创建成功')
    }
    router.push('/intelligence')
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchIntelligence)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>