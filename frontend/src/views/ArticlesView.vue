<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">科普管理</h2>
      <t-button theme="primary" @click="$router.push('/articles/create')">
        <template #icon><AddIcon /></template>
        新建
      </t-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'
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

onMounted(fetchArticles)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>