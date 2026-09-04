<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">情报管理</h2>
      <div class="action-buttons">
        <t-button
          v-if="selectedRowKeys.length > 0"
          theme="danger"
          variant="outline"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedRowKeys.length }})
        </t-button>
        <t-button theme="default" variant="outline" @click="showImportDialog = true">
          <template #icon><UploadIcon /></template>
          导入HW专报
        </t-button>
        <t-button theme="primary" @click="$router.push('/intelligence/create')">
          <template #icon><AddIcon /></template>
          新建
        </t-button>
      </div>
    </div>

    <t-table bordered
      :columns="columns"
      :data="intelligences"
      :loading="loading"
      :pagination="pagination"
      :selected-row-keys="selectedRowKeys"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: handleSelectChange }"
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

    <!-- HW专报导入弹窗 -->
    <HwReportImportDialog
      v-model:visible="showImportDialog"
      @success="fetchIntelligences"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { AddIcon, UploadIcon } from 'tdesign-icons-vue-next'
import dayjs from 'dayjs'
import { intelligenceApi, membershipApi, type Intelligence } from '@/api'
import HwReportImportDialog from '@/components/HwReportImportDialog.vue'

interface MemberLevel {
  id: string
  code: string
  name: string
}

const showImportDialog = ref(false)
const loading = ref(false)
const intelligences = ref<Intelligence[]>([])
const selectedRowKeys = ref<(string | number)[]>([])
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
  { colKey: 'level', title: '等级', width: 140 },
  { colKey: 'source', title: '来源', width: 160 },
  { colKey: 'views', title: '浏览', width: 80 },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'action', title: '操作', width: 120 },
]

const categoryMap: Record<string, { text: string; theme: 'danger' | 'primary' | 'success' | 'warning' | 'default' }> = {
  launch: { text: '发射', theme: 'danger' },
  satellite: { text: '卫星', theme: 'primary' },
  industry: { text: '行业', theme: 'success' },
  research: { text: '科研', theme: 'warning' },
  environment: { text: '环境', theme: 'default' },
}

// 等级映射，动态从会员管理获取
const levelMap: Record<string, { text: string; theme: string }> = {
  free: { text: '免费', theme: 'success' },
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

// 获取会员等级列表，动态构建等级映射
async function fetchLevelMap() {
  try {
    const res = await membershipApi.getLevels({ page: 1, limit: 100 })
    if (res.success && res.data?.data) {
      res.data.data.forEach((level: MemberLevel) => {
        levelMap[level.code] = {
          text: level.name,
          theme: 'primary',
        }
      })
    }
  } catch (error) {
    console.error('获取会员等级失败', error)
  }
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

function handleSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请选择要删除的情报')
    return
  }

  try {
    const ids = selectedRowKeys.value.map(id => id as number)
    await intelligenceApi.batchDelete(ids)
    MessagePlugin.success(`成功删除 ${ids.length} 条情报`)
    selectedRowKeys.value = []
    fetchIntelligences()
  } catch (error) {
    MessagePlugin.error('批量删除失败')
  }
}

onMounted(() => {
  fetchLevelMap()
  fetchIntelligences()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>
