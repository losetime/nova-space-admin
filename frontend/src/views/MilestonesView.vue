<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">里程碑管理</h2>
      <t-button theme="primary" @click="$router.push('/milestones/create')">
        <template #icon><AddIcon /></template>
        新建
      </t-button>
    </div>

    <div class="filter-section mb-4">
      <t-input
        v-model="searchKeyword"
        placeholder="搜索标题或描述"
        class="search-input"
        @enter="handleSearch"
        clearable
        @clear="handleSearch"
      >
        <template #suffix-icon>
          <SearchIcon />
        </template>
      </t-input>

      <t-select
        v-model="selectedCategory"
        placeholder="分类筛选"
        class="filter-select"
        clearable
        @change="handleFilter"
      >
        <t-option value="launch" label="发射任务" />
        <t-option value="recovery" label="回收任务" />
        <t-option value="orbit" label="在轨测试" />
        <t-option value="mission" label="深空探测" />
        <t-option value="other" label="其他" />
      </t-select>

      <t-select
        v-model="selectedImportance"
        placeholder="重要性"
        class="filter-select"
        clearable
        @change="handleFilter"
      >
        <t-option :value="1" label="★" />
        <t-option :value="2" label="★★" />
        <t-option :value="3" label="★★★" />
        <t-option :value="4" label="★★★★" />
        <t-option :value="5" label="★★★★★" />
      </t-select>

      <t-select
        v-model="selectedPublishStatus"
        placeholder="发布状态"
        class="filter-select"
        clearable
        @change="handleFilter"
      >
        <t-option :value="true" label="已发布" />
        <t-option :value="false" label="未发布" />
      </t-select>
    </div>

    <t-table
      bordered
      :columns="columns"
      :data="milestones"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #title="{ row }">
        <div class="milestone-title">
          {{ row.title }}
        </div>
      </template>
      <template #eventDate="{ row }">
        {{ formatDate(row.eventDate) }}
      </template>
      <template #category="{ row }">
        <t-tag :theme="getCategoryTheme(row.category)" variant="light">
          {{ getCategoryText(row.category) }}
        </t-tag>
      </template>
      <template #importance="{ row }">
        <span class="importance-stars">
          {{ getImportanceStars(row.importance) }}
        </span>
      </template>
      <template #isPublished="{ row }">
        <t-tag :theme="row.isPublished ? 'success' : 'warning'" variant="light">
          {{ row.isPublished ? '已发布' : '未发布' }}
        </t-tag>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="$router.push(`/milestones/${row.id}/edit`)">
            编辑
          </t-link>
          <t-link
            :theme="row.isPublished ? 'warning' : 'success'"
            @click="handleTogglePublish(row)"
          >
            {{ row.isPublished ? '取消发布' : '发布' }}
          </t-link>
          <t-popconfirm content="确定要删除这个里程碑吗？" @confirm="handleDelete(row.id)">
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
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next'
import dayjs from 'dayjs'
import { milestoneApi, type Milestone } from '@/api'

const loading = ref(false)
const milestones = ref<Milestone[]>([])
const searchKeyword = ref('')
const selectedCategory = ref<string | undefined>()
const selectedImportance = ref<number | undefined>()
const selectedPublishStatus = ref<boolean | undefined>()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'title', title: '标题', ellipsis: true },
  { colKey: 'eventDate', title: '事件日期', width: 120 },
  { colKey: 'category', title: '分类', width: 100 },
  { colKey: 'importance', title: '重要性', width: 100 },
  { colKey: 'isPublished', title: '状态', width: 80 },
  { colKey: 'createdAt', title: '创建时间', width: 140 },
  { colKey: 'action', title: '操作', width: 180 },
]

const categoryMap: Record<string, { text: string; theme: 'default' | 'primary' | 'success' | 'warning' }> = {
  launch: { text: '发射任务', theme: 'primary' },
  recovery: { text: '回收任务', theme: 'success' },
  orbit: { text: '在轨测试', theme: 'warning' },
  mission: { text: '深空探测', theme: 'primary' },
  other: { text: '其他', theme: 'default' },
}

function getCategoryText(category: string) {
  return categoryMap[category]?.text || category
}

function getCategoryTheme(category: string) {
  return categoryMap[category]?.theme || 'default'
}

function getImportanceStars(importance: number) {
  return '★'.repeat(importance)
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD')
}

async function fetchMilestones() {
  loading.value = true
  try {
    const res = await milestoneApi.getList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      category: selectedCategory.value,
      importance: selectedImportance.value,
      isPublished: selectedPublishStatus.value,
      search: searchKeyword.value || undefined,
    })
    if (res.success) {
      milestones.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    MessagePlugin.error('获取里程碑列表失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchMilestones()
}

function handleSearch() {
  pagination.current = 1
  fetchMilestones()
}

function handleFilter() {
  pagination.current = 1
  fetchMilestones()
}

async function handleDelete(id: number) {
  try {
    await milestoneApi.delete(id)
    MessagePlugin.success('删除成功')
    fetchMilestones()
  } catch (error) {
    MessagePlugin.error('删除失败')
  }
}

async function handleTogglePublish(row: Milestone) {
  try {
    const res = await milestoneApi.togglePublish(row.id)
    if (res.success) {
      MessagePlugin.success(row.isPublished ? '已取消发布' : '已发布')
      fetchMilestones()
    }
  } catch (error) {
    MessagePlugin.error('操作失败')
  }
}

onMounted(fetchMilestones)
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.filter-section {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.filter-select {
  width: 120px;
}

.milestone-title {
  font-weight: 500;
}

.importance-stars {
  color: #f59e0b;
}
</style>