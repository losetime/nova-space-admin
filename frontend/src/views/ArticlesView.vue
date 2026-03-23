<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">科普管理</h2>
      <t-space>
        <t-button theme="primary" @click="showImportModal = true">
          <template #icon><UploadIcon /></template>
          导入
        </t-button>
        <t-button theme="primary" @click="$router.push('/articles/create')">
          <template #icon><AddIcon /></template>
          新建
        </t-button>
      </t-space>
    </div>

    <t-table bordered
      :columns="columns"
      :data="articles"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #category="{ row }">
        <t-tag :theme="getCategoryTheme(row.category)" variant="light">
          {{ getCategoryText(row.category) }}
        </t-tag>
      </template>
      <template #isPublished="{ row }">
        <t-tag :theme="row.isPublished ? 'success' : 'warning'" variant="light">
          {{ row.isPublished ? '已发布' : '草稿' }}
        </t-tag>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="$router.push(`/articles/${row.id}/edit`)">
            编辑
          </t-link>
          <t-popconfirm content="确定要删除这篇科普吗？" @confirm="handleDelete(row.id)">
            <t-link theme="danger">删除</t-link>
          </t-popconfirm>
        </t-space>
      </template>
    </t-table>

    <!-- Import Modal -->
    <t-dialog
      v-model:visible="showImportModal"
      header="导入科普"
      :confirm-btn="{ content: '导入', loading: importLoading }"
      @confirm="handleImport"
    >
      <t-form :data="importForm" layout="vertical">
        <t-form-item label="文件格式" name="format">
          <t-radio-group v-model="importForm.format">
            <t-radio value="csv">CSV</t-radio>
            <t-radio value="excel">Excel (xlsx)</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="选择文件" name="file">
          <t-upload
            v-model="fileList"
            :auto-upload="false"
            :multiple="false"
            accept=".csv,.xlsx,.xls"
          />
        </t-form-item>
      </t-form>
      <div class="text-gray-500 text-sm mt-2">
        <p>CSV/Excel 格式要求：</p>
        <ul class="list-disc list-inside">
          <li>第一行为字段名</li>
          <li>必填字段：title, content, category</li>
          <li>可选字段：summary, cover, tags</li>
          <li>category 可选值：basic, advanced, mission, people</li>
        </ul>
        <t-link theme="primary" class="mt-2 inline-block" @click="downloadTemplate">
          <DownloadIcon />
          下载模板
        </t-link>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { AddIcon, UploadIcon, DownloadIcon } from 'tdesign-icons-vue-next'
import dayjs from 'dayjs'
import { articleApi, type Article } from '@/api'

const loading = ref(false)
const articles = ref<Article[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'title', title: '标题', ellipsis: true },
  { colKey: 'category', title: '分类', width: 100 },
  { colKey: 'views', title: '浏览', width: 80 },
  { colKey: 'isPublished', title: '状态', width: 80 },
  { colKey: 'createdAt', title: '创建时间', width: 140 },
  { colKey: 'action', title: '操作', width: 120 },
]

const showImportModal = ref(false)
const importLoading = ref(false)
const importForm = reactive({
  format: 'csv' as 'csv' | 'excel',
})
const fileList = ref<any[]>([])

const categoryMap: Record<string, { text: string; theme: 'default' | 'primary' | 'success' | 'warning' }> = {
  basic: { text: '基础', theme: 'primary' },
  advanced: { text: '进阶', theme: 'warning' },
  mission: { text: '任务', theme: 'success' },
  people: { text: '人物', theme: 'default' },
}

function getCategoryText(category: string) {
  return categoryMap[category]?.text || category
}

function getCategoryTheme(category: string) {
  return categoryMap[category]?.theme || 'default'
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
    MessagePlugin.error('获取科普列表失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchArticles()
}

async function handleDelete(id: number) {
  try {
    await articleApi.delete(id)
    MessagePlugin.success('删除成功')
    fetchArticles()
  } catch (error) {
    MessagePlugin.error('删除失败')
  }
}

async function handleImport() {
  if (fileList.value.length === 0) {
    MessagePlugin.warning('请选择文件')
    return
  }
  importLoading.value = true
  try {
    const file = fileList.value[0].raw
    const res = await articleApi.import(file, importForm.format)
    if (res.success) {
      MessagePlugin.success(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
      if (res.data.errors.length > 0) {
        console.log('Import errors:', res.data.errors)
      }
      showImportModal.value = false
      fileList.value = []
      fetchArticles()
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '导入失败')
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