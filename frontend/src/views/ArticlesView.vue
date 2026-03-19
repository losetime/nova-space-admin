<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">科普管理</h2>
      <a-space>
        <a-button type="primary" @click="showImportModal = true">
          <UploadOutlined />
          导入
        </a-button>
        <a-button type="primary" @click="$router.push('/articles/create')">
          <PlusOutlined />
          新建
        </a-button>
      </a-space>
    </div>

    <a-table
      :columns="columns"
      :data-source="articles"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'category'">
          <a-tag :color="getCategoryColor(record.category)">
            {{ getCategoryText(record.category) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'isPublished'">
          <a-tag :color="record.isPublished ? 'green' : 'orange'">
            {{ record.isPublished ? '已发布' : '草稿' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="$router.push(`/articles/${record.id}/edit`)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这篇科普吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- Import Modal -->
    <a-modal
      v-model:open="showImportModal"
      title="导入科普"
      @ok="handleImport"
      :confirm-loading="importLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="文件格式">
          <a-radio-group v-model:value="importFormat">
            <a-radio value="csv">CSV</a-radio>
            <a-radio value="excel">Excel (xlsx)</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="选择文件">
          <a-upload
            :file-list="fileList"
            :before-upload="beforeUpload"
            :max-count="1"
            accept=".csv,.xlsx,.xls"
          >
            <a-button>
              <UploadOutlined />
              选择文件
            </a-button>
          </a-upload>
        </a-form-item>
      </a-form>
      <div class="text-gray-500 text-sm mt-2">
        <p>CSV/Excel 格式要求：</p>
        <ul class="list-disc list-inside">
          <li>第一行为字段名</li>
          <li>必填字段：title, content, category</li>
          <li>可选字段：summary, cover, tags</li>
          <li>category 可选值：basic, advanced, mission, people</li>
        </ul>
        <a-button type="link" size="small" class="p-0 mt-2" @click="downloadTemplate">
          <DownloadOutlined />
          下载模板
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { articleApi, type Article } from '@/api'

const loading = ref(false)
const articles = ref<Article[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '分类', key: 'category', width: 100 },
  { title: '浏览', dataIndex: 'views', width: 80 },
  { title: '状态', key: 'isPublished', width: 80 },
  { title: '创建时间', key: 'createdAt', width: 120 },
  { title: '操作', key: 'action', width: 120 },
]

const showImportModal = ref(false)
const importLoading = ref(false)
const importFormat = ref<'csv' | 'excel'>('csv')
const fileList = ref<any[]>([])
const uploadFile = ref<File | null>(null)

const categoryMap: Record<string, { text: string; color: string }> = {
  basic: { text: '基础', color: 'blue' },
  advanced: { text: '进阶', color: 'purple' },
  mission: { text: '任务', color: 'green' },
  people: { text: '人物', color: 'orange' },
}

function getCategoryText(category: string) {
  return categoryMap[category]?.text || category
}

function getCategoryColor(category: string) {
  return categoryMap[category]?.color || 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchArticles() {
  loading.value = true
  try {
    const res = await articleApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
    })
    if (res.success) {
      articles.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    message.error('获取科普列表失败')
  } finally {
    loading.value = false
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchArticles()
}

async function handleDelete(id: number) {
  try {
    await articleApi.delete(id)
    message.success('删除成功')
    fetchArticles()
  } catch (error) {
    message.error('删除失败')
  }
}

function beforeUpload(file: File) {
  uploadFile.value = file
  fileList.value = [file as any]
  return false
}

async function handleImport() {
  if (!uploadFile.value) {
    message.warning('请选择文件')
    return
  }
  importLoading.value = true
  try {
    const res = await articleApi.import(uploadFile.value, importFormat.value)
    if (res.success) {
      message.success(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
      if (res.data.errors.length > 0) {
        console.log('Import errors:', res.data.errors)
      }
      showImportModal.value = false
      fileList.value = []
      uploadFile.value = null
      fetchArticles()
    }
  } catch (error: any) {
    message.error(error.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

function downloadTemplate() {
  const headers = ['title', 'content', 'category', 'summary', 'cover', 'tags', 'type', 'duration', 'isPublished']
  const sampleData = [
    '科普标题示例',
    '科普内容示例，支持长文本',
    'basic',
    '科普摘要示例',
    '',
    '标签1,标签2',
    'article',
    '',
    'true'
  ]

  const csvContent = [
    headers.join(','),
    sampleData.map(field => `"${field}"`).join(',')
  ].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '科普导入模板.csv'
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(fetchArticles)
</script>