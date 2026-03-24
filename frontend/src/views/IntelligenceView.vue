<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">情报管理</h2>
      <t-button theme="primary" @click="$router.push('/intelligence/create')">
        <template #icon><AddIcon /></template>
        新建
      </t-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'
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

onMounted(fetchIntelligences)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>