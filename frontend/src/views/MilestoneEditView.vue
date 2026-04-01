<template>
  <div class="page-container">
    <div class="flex items-center mb-4">
      <t-button variant="text" @click="$router.back()">
        <template #icon><ChevronLeftIcon /></template>
        返回
      </t-button>
      <h2 class="text-xl font-bold">{{ isEdit ? '编辑里程碑' : '新建里程碑' }}</h2>
    </div>

    <t-form
      :data="form"
      :rules="rules"
      :label-width="120"
      @submit="handleSubmit"
    >
      <t-form-item label="标题" name="title">
        <t-input v-model="form.title" placeholder="请输入里程碑标题" clearable />
      </t-form-item>

      <t-form-item label="简短描述" name="description">
        <t-textarea
          v-model="form.description"
          placeholder="请输入简短描述"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </t-form-item>

      <t-form-item label="事件日期" name="eventDate">
        <t-date-picker
          v-model="form.eventDate"
          placeholder="请选择事件日期"
          clearable
          format="YYYY-MM-DD"
        />
      </t-form-item>

      <t-form-item label="分类" name="category">
        <t-select v-model="form.category" placeholder="请选择分类" clearable>
          <t-option value="launch" label="发射任务" />
          <t-option value="recovery" label="回收任务" />
          <t-option value="orbit" label="在轨测试" />
          <t-option value="mission" label="深空探测" />
          <t-option value="other" label="其他" />
        </t-select>
      </t-form-item>

      <t-form-item label="重要性" name="importance">
        <t-rate
          v-model="form.importance"
          :count="5"
          allow-half
        />
        <span class="ml-2 text-gray-500">{{ form.importance }} 级</span>
      </t-form-item>

      <t-form-item label="事件地点" name="location">
        <t-input v-model="form.location" placeholder="请输入事件地点" clearable />
      </t-form-item>

      <t-form-item label="组织机构" name="organizer">
        <t-input v-model="form.organizer" placeholder="请输入组织机构" clearable />
      </t-form-item>

      <t-form-item label="封面图片" name="cover">
        <ImageUpload v-model="form.cover" tips="支持 jpg、png、gif 格式，最大 5MB，建议尺寸 800x450" />
      </t-form-item>

      <t-form-item label="关联卫星ID" name="relatedSatelliteNoradId">
        <t-input
          v-model="form.relatedSatelliteNoradId"
          placeholder="关联卫星的 NORAD ID（可选）"
          clearable
        />
      </t-form-item>

      <t-form-item label="详细内容" name="content">
        <RichTextEditor
          v-model="form.content"
          placeholder="请输入里程碑详细内容，支持 Markdown 格式"
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
import { milestoneApi, type Milestone } from '@/api'
import RichTextEditor from '@/components/RichTextEditor.vue'
import ImageUpload from '@/components/ImageUpload.vue'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const form = reactive({
  title: '',
  description: '',
  content: '',
  eventDate: '',
  category: 'other' as Milestone['category'],
  importance: 3,
  cover: '',
  location: '',
  organizer: '',
  relatedSatelliteNoradId: '',
  isPublished: true,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入简短描述', trigger: 'blur' }],
  eventDate: [{ required: true, message: '请选择事件日期', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

async function fetchMilestone() {
  if (!isEdit.value) return
  try {
    const res = await milestoneApi.getOne(Number(route.params.id))
    if (res.success) {
      const data = res.data
      Object.assign(form, {
        title: data.title,
        description: data.description,
        content: data.content || '',
        eventDate: formatDateForPicker(data.eventDate),
        category: data.category,
        importance: data.importance,
        cover: data.cover || '',
        location: data.location || '',
        organizer: data.organizer || '',
        relatedSatelliteNoradId: data.relatedSatelliteNoradId || '',
        isPublished: data.isPublished,
      })
    }
  } catch (error) {
    MessagePlugin.error('获取里程碑失败')
    router.back()
  }
}

function formatDateForPicker(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}

async function handleSubmit({ validateResult }: { validateResult: boolean }) {
  if (!validateResult) return

  loading.value = true
  try {
    const data = {
      ...form,
      eventDate: form.eventDate,
    }

    if (isEdit.value) {
      await milestoneApi.update(Number(route.params.id), data)
      MessagePlugin.success('保存成功')
    } else {
      await milestoneApi.create(data)
      MessagePlugin.success('创建成功')
    }
    router.push('/milestones')
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchMilestone)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>