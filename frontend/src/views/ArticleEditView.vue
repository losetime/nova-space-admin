<template>
  <div class="page-container">
    <div class="flex items-center mb-4">
      <t-button variant="text" @click="$router.back()">
        <template #icon><ChevronLeftIcon /></template>
        返回
      </t-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑科普' : '新建科普' }}</h2>
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
          <t-option value="basic" label="基础" />
          <t-option value="advanced" label="进阶" />
          <t-option value="mission" label="任务" />
          <t-option value="people" label="人物" />
        </t-select>
      </t-form-item>

      <t-form-item label="摘要" name="summary">
        <t-textarea
          v-model="form.summary"
          placeholder="请输入摘要"
          :autosize="{ minRows: 3 }"
        />
      </t-form-item>

      <t-form-item label="封面" name="cover">
        <t-input v-model="form.cover" placeholder="封面图片URL" clearable />
      </t-form-item>

      <t-form-item label="标签" name="tags">
        <t-select
          v-model="form.tags"
          placeholder="输入标签后回车"
          multiple
          clearable
          creatable
        />
      </t-form-item>

      <t-form-item label="内容" name="content">
        <t-textarea
          v-model="form.content"
          placeholder="请输入内容"
          :autosize="{ minRows: 10 }"
        />
      </t-form-item>

      <t-form-item label="发布状态" name="isPublished">
        <t-switch v-model="form.isPublished" :label="['发布', '草稿']" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { ChevronLeftIcon } from 'tdesign-icons-vue-next'
import { articleApi } from '@/api'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const form = reactive({
  title: '',
  content: '',
  summary: '',
  cover: '',
  category: 'basic' as 'basic' | 'advanced' | 'mission' | 'people',
  tags: [] as string[],
  isPublished: true,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

async function fetchArticle() {
  if (!isEdit.value) return
  try {
    const res = await articleApi.getOne(Number(route.params.id))
    if (res.success) {
      Object.assign(form, {
        ...res.data,
        tags: res.data.tags || [],
      })
    }
  } catch (error) {
    MessagePlugin.error('获取科普失败')
    router.back()
  }
}

async function handleSubmit({ validateResult }: { validateResult: boolean }) {
  if (!validateResult) return

  loading.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      await articleApi.update(Number(route.params.id), data)
      MessagePlugin.success('保存成功')
    } else {
      await articleApi.create(data)
      MessagePlugin.success('创建成功')
    }
    router.push('/articles')
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchArticle)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>