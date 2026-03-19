<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">情报管理</h2>
      <a-space>
        <a-button type="primary" @click="showImportModal = true">
          <UploadOutlined />
          导入
        </a-button>
        <a-button type="primary" @click="$router.push('/intelligence/create')">
          <PlusOutlined />
          新建
        </a-button>
      </a-space>
    </div>

    <a-table
      :columns="columns"
      :data-source="intelligences"
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
        <template v-else-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)">
            {{ getLevelText(record.level) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="$router.push(`/intelligence/${record.id}/edit`)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这条情报吗？"
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
      title="导入情报"
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
          <li>必填字段：title, content, summary, category, level, source</li>
          <li>可选字段：cover, tags, sourceUrl</li>
          <li>category 可选值：launch, satellite, industry, research, environment</li>
          <li>level 可选值：free, advanced, professional</li>
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
import { intelligenceApi, type Intelligence } from '@/api'

const loading = ref(false)
const intelligences = ref<Intelligence[]>([])
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
  { title: '等级', key: 'level', width: 100 },
  { title: '来源', dataIndex: 'source', width: 120 },
  { title: '浏览', dataIndex: 'views', width: 80 },
  { title: '创建时间', key: 'createdAt', width: 120 },
  { title: '操作', key: 'action', width: 120 },
]

const showImportModal = ref(false)
const importLoading = ref(false)
const importFormat = ref<'csv' | 'excel'>('excel')
const fileList = ref<any[]>([])
const uploadFile = ref<File | null>(null)

const categoryMap: Record<string, { text: string; color: string }> = {
  launch: { text: '发射', color: 'red' },
  satellite: { text: '卫星', color: 'blue' },
  industry: { text: '行业', color: 'green' },
  research: { text: '科研', color: 'purple' },
  environment: { text: '环境', color: 'orange' },
}

const levelMap: Record<string, { text: string; color: string }> = {
  free: { text: '免费', color: 'green' },
  advanced: { text: '进阶', color: 'blue' },
  professional: { text: '专业', color: 'purple' },
}

function getCategoryText(category: string) {
  return categoryMap[category]?.text || category
}

function getCategoryColor(category: string) {
  return categoryMap[category]?.color || 'default'
}

function getLevelText(level: string) {
  return levelMap[level]?.text || level
}

function getLevelColor(level: string) {
  return levelMap[level]?.color || 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchIntelligences() {
  loading.value = true
  try {
    const res = await intelligenceApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
    })
    if (res.success) {
      intelligences.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    message.error('获取情报列表失败')
  } finally {
    loading.value = false
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchIntelligences()
}

async function handleDelete(id: number) {
  try {
    await intelligenceApi.delete(id)
    message.success('删除成功')
    fetchIntelligences()
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
    const res = await intelligenceApi.import(uploadFile.value, importFormat.value)
    if (res.success) {
      message.success(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
      if (res.data.errors.length > 0) {
        console.log('Import errors:', res.data.errors)
      }
      showImportModal.value = false
      fileList.value = []
      uploadFile.value = null
      fetchIntelligences()
    }
  } catch (error: any) {
    message.error(error.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

function downloadTemplate() {
  const headers = ['title', 'content', 'summary', 'category', 'level', 'source', 'cover', 'tags', 'sourceUrl', 'analysis', 'trend']
  const sampleData = [
    '情报标题示例',
    '情报内容示例，支持长文本',
    '情报摘要示例',
    'launch',
    'free',
    '信息来源',
    '',
    '标签1,标签2',
    'https://example.com',
    '',
    ''
  ]

  const csvContent = [
    headers.join(','),
    sampleData.map(field => `"${field}"`).join(',')
  ].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '情报导入模板.csv'
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(fetchIntelligences)
</script>