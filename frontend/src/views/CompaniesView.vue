<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">公司管理</h2>
      <t-space>
        <t-button theme="primary" @click="$router.push('/companies/create')">
          <template #icon><AddIcon /></template>
          新建
        </t-button>
        <t-input
          v-model="searchName"
          placeholder="搜索公司名称"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 200px"
        />
        <t-input
          v-model="searchCountry"
          placeholder="搜索国家"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 150px"
        />
      </t-space>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <t-card>
        <t-statistic title="公司总数" :value="statistics.total" />
      </t-card>
      <t-card>
        <t-statistic title="国家/地区数量" :value="statistics.countries?.length || 0" />
      </t-card>
    </div>

    <t-table
      bordered
      :columns="columns"
      :data="companies"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #logoUrl="{ row }">
        <div v-if="row.logoUrl" class="flex items-center">
          <img :src="row.logoUrl" :alt="row.name" class="w-12 h-12 object-contain rounded" />
        </div>
        <div v-else class="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
          {{ row.name.charAt(0) }}
        </div>
      </template>
      <template #website="{ row }">
        <a v-if="row.website" :href="row.website" target="_blank" class="text-blue-600 hover:underline">
          {{ row.website }}
        </a>
        <span v-else>-</span>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="$router.push(`/companies/${row.id}/edit`)">
            编辑
          </t-link>
          <t-popconfirm content="确定要删除这家公司吗？" @confirm="handleDelete(row.id)">
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
import { companyApi, type Company } from '@/api'

const loading = ref(false)
const companies = ref<Company[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showJumper: true,
})

const searchName = ref('')
const searchCountry = ref('')

const statistics = reactive({
  total: 0,
  countries: [] as any[],
})

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'logoUrl', title: 'Logo', width: 80 },
  { colKey: 'name', title: '公司名称', ellipsis: true },
  { colKey: 'country', title: '国家', width: 100 },
  { colKey: 'foundedYear', title: '成立年份', width: 100 },
  { colKey: 'website', title: '官网', ellipsis: true },
  { colKey: 'createdAt', title: '创建时间', width: 140 },
  { colKey: 'action', title: '操作', width: 120 },
]

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchCompanies() {
  loading.value = true
  try {
    const res = await companyApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
      name: searchName.value || undefined,
      country: searchCountry.value || undefined,
    })
    if (res.success) {
      companies.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    MessagePlugin.error('获取公司列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchStatistics() {
  try {
    const res = await companyApi.getStatistics()
    if (res.success) {
      statistics.total = res.data.total
      statistics.countries = res.data.countries
    }
  } catch (error) {
    console.error('获取统计数据失败')
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchCompanies()
}

function handleSearch() {
  pagination.current = 1
  fetchCompanies()
}

async function handleDelete(id: number) {
  try {
    await companyApi.delete(id)
    MessagePlugin.success('删除成功')
    fetchCompanies()
    fetchStatistics()
  } catch (error) {
    MessagePlugin.error('删除失败')
  }
}

onMounted(() => {
  fetchCompanies()
  fetchStatistics()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>