<template>
  <div>
    <div class="flex items-center mb-4">
      <a-button type="link" @click="$router.back()">
        <ArrowLeftOutlined />
        返回
      </a-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑科普' : '新建科普' }}</h2>
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
          <a-select-option value="basic">基础</a-select-option>
          <a-select-option value="advanced">进阶</a-select-option>
          <a-select-option value="mission">任务</a-select-option>
          <a-select-option value="people">人物</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="摘要" name="summary">
        <a-textarea
          v-model:value="form.summary"
          placeholder="请输入摘要"
          :rows="3"
        />
      </a-form-item>

      <a-form-item label="封面" name="cover">
        <a-input v-model:value="form.cover" placeholder="封面图片URL" />
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="form.tags"
          mode="tags"
          placeholder="输入标签后回车"
        />
      </a-form-item>

      <a-form-item label="内容" name="content">
        <a-textarea
          v-model:value="form.content"
          placeholder="请输入内容"
          :rows="10"
        />
      </a-form-item>

      <a-form-item label="发布状态" name="isPublished">
        <a-switch v-model:checked="form.isPublished" checked-children="发布" un-checked-children="草稿" />
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
  title: [{ required: true, message: '请输入标题' }],
  content: [{ required: true, message: '请输入内容' }],
  category: [{ required: true, message: '请选择分类' }],
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
    message.error('获取科普失败')
    router.back()
  }
}

async function handleSubmit() {
  loading.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      await articleApi.update(Number(route.params.id), data)
      message.success('保存成功')
    } else {
      await articleApi.create(data)
      message.success('创建成功')
    }
    router.push('/articles')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchArticle)
</script>