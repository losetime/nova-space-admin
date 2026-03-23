<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">情报管理</h2>
      <t-space>
        <t-button theme="primary" @click="showImportModal = true">
          <template #icon><UploadIcon /></template>
          导入
        </t-button>
        <t-button theme="primary" @click="$router.push('/intelligence/create')">
          <template #icon><AddIcon /></template>
          新建
        </t-button>
      </t-space>
    </div>

    <t-table bordered
      :columns="columns"
      :data="intelligences"
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
      <template #level="{ row }">
        <t-tag :theme="getLevelTheme(row.level)" variant="light">
          {{ getLevelText(row.level) }}
        </t-tag>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="$router.push(`/intelligence/${row.id}/edit`)">
            编辑
          </t-link>
          <t-popconfirm content="确定要删除这条情报吗？" @confirm="handleDelete(row.id)">
            <t-link theme="danger">删除</t-link>
          </t-popconfirm>
        </t-space>
      </template>
    </t-table>

    <!-- Import Modal -->
    <t-dialog
      v-model:visible="showImportModal"
      header="导入情报"
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
          <li>必填字段：title, content, summary, category, level, source</li>
          <li>可选字段：cover, tags, sourceUrl</li>
          <li>category 可选值：launch, satellite, industry, research, environment</li>
          <li>level 可选值：free, advanced, professional</li>
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
import { intelligenceApi, type Intelligence } from '@/api'

const loading = ref(false)
const intelligences = ref<Intelligence[]>([])
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
  { colKey: 'level', title: '等级', width: 100 },
  { colKey: 'source', title: '来源', width: 120 },
  { colKey: 'views', title: '浏览', width: 80 },
  { colKey: 'createdAt', title: '创建时间', width: 140 },
  { colKey: 'action', title: '操作', width: 120 },
]

const showImportModal = ref(false)
const importLoading = ref(false)
const importForm = reactive({
  format: 'excel' as 'csv' | 'excel',
})
const fileList = ref<any[]>([])

const categoryMap: Record<string, { text: string; theme: 'danger' | 'primary' | 'success' | 'warning' | 'default' }> = {
  launch: { text: '发射', theme: 'danger' },
  satellite: { text: '卫星', theme: 'primary' },
  industry: { text: '行业', theme: 'success' },
  research: { text: '科研', theme: 'warning' },
  environment: { text: '环境', theme: 'default' },
}

const levelMap: Record<string, { text: string; theme: 'success' | 'primary' | 'warning' }> = {
  free: { text: '免费', theme: 'success' },
  advanced: { text: '进阶', theme: 'primary' },
  professional: { text: '专业', theme: 'warning' },
}

function getCategoryText(category: string) {
  return categoryMap[category]?.text || category
}

function getCategoryTheme(category: string) {
  return categoryMap[category]?.theme || 'default'
}

function getLevelText(level: string) {
  return levelMap[level]?.text || level
}

function getLevelTheme(level: string) {
  return levelMap[level]?.theme || 'default'
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
    MessagePlugin.error('获取情报列表失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchIntelligences()
}

async function handleDelete(id: number) {
  try {
    await intelligenceApi.delete(id)
    MessagePlugin.success('删除成功')
    fetchIntelligences()
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
    const res = await intelligenceApi.import(file, importForm.format)
    if (res.success) {
      MessagePlugin.success(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
      if (res.data.errors.length > 0) {
        console.log('Import errors:', res.data.errors)
      }
      showImportModal.value = false
      fileList.value = []
      fetchIntelligences()
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '导入失败')
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