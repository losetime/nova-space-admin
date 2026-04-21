<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">卫星元数据管理</h2>
    </div>

    <t-card :bordered="false" class="mb-4">
      <t-form layout="inline">
        <t-form-item label="NORAD ID">
          <t-input
            v-model="searchForm.noradId"
            placeholder="精确搜索"
            clearable
            style="width: 180px"
            @enter="handleSearch"
          />
        </t-form-item>
        <t-form-item label="卫星名称">
          <t-input
            v-model="searchForm.name"
            placeholder="模糊搜索名称"
            clearable
            style="width: 200px"
            @enter="handleSearch"
          />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSearch">
              搜索
            </t-button>
            <t-button variant="outline" @click="handleReset">
              重置
            </t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>

    <div class="table-scroll-container">
      <t-table
        bordered
        :columns="columns"
        :data="metadataList"
        :loading="loading"
        :pagination="pagination"
        row-key="noradId"
        @page-change="handlePageChange"
      >
      <template #noradId="{ row }">
        <t-link theme="primary" @click="$router.push(`/satellite-metadata/${row.noradId}`)">
          {{ row.noradId }}
        </t-link>
      </template>
      <template #name="{ row }">
        <span :title="row.name">{{ row.name || '-' }}</span>
      </template>
      <template #countryCode="{ row }">
        <span>{{ row.countryCode || '-' }}</span>
      </template>
      <template #objectType="{ row }">
        <t-tag variant="light">{{ row.objectType || '-' }}</t-tag>
      </template>
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" variant="light">
          {{ row.status || '-' }}
        </t-tag>
      </template>
      <template #launchDate="{ row }">
        <span>{{ row.launchDate || '-' }}</span>
      </template>
      <template #orbit="{ row }">
        <span v-if="row.inclination !== null">
          {{ row.inclination?.toFixed(2) }}° / {{ row.apogee?.toFixed(0) }}km / {{ row.perigee?.toFixed(0) }}km
        </span>
        <span v-else>-</span>
      </template>
      <template #dataSources="{ row }">
        <t-space>
          <t-tag v-if="row.hasKeepTrackData" size="small" theme="primary">KT</t-tag>
          <t-tag v-if="row.hasSpaceTrackData" size="small" theme="warning">ST</t-tag>
          <t-tag v-if="row.hasDiscosData" size="small" theme="success">DC</t-tag>
          <span v-if="!row.hasKeepTrackData && !row.hasSpaceTrackData && !row.hasDiscosData">-</span>
        </t-space>
      </template>
      <template #action="{ row }">
        <t-link theme="primary" @click="$router.push(`/satellite-metadata/${row.noradId}`)">
          查看详情
        </t-link>
      </template>
    </t-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { satelliteMetadataApi, type SatelliteMetadataListItem } from '@/api'

const loading = ref(false)
const metadataList = ref<SatelliteMetadataListItem[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})
const searchForm = reactive({
  noradId: '',
  name: '',
})

const columns = [
  { colKey: 'noradId', title: 'NORAD ID', width: 100, fixed: 'left' },
  { colKey: 'name', title: '卫星名称', width: 200, ellipsis: true },
  { colKey: 'countryCode', title: '国家', width: 80 },
  { colKey: 'objectType', title: '对象类型', width: 100 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'launchDate', title: '发射日期', width: 110 },
  { colKey: 'orbit', title: '轨道参数', width: 220 },
  { colKey: 'dataSources', title: '数据源', width: 120 },
  { colKey: 'action', title: '操作', width: 100, fixed: 'right' },
]

function getStatusTheme(status: string | null) {
  if (!status) return 'default'
  const map: Record<string, string> = {
    '+': 'success',
    '-': 'danger',
    'D': 'warning',
  }
  return map[status] || 'default'
}

async function fetchMetadataList() {
  loading.value = true
  try {
    const res = await satelliteMetadataApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
      noradId: searchForm.noradId || undefined,
      name: searchForm.name || undefined,
    })
    if (res.success) {
      metadataList.value = res.data.data
      pagination.total = res.data.total
    } else {
      MessagePlugin.error('获取卫星元数据列表失败')
    }
  } catch (error) {
    MessagePlugin.error('获取卫星元数据列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchMetadataList()
}

function handleReset() {
  searchForm.noradId = ''
  searchForm.name = ''
  pagination.current = 1
  fetchMetadataList()
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchMetadataList()
}

onMounted(() => {
  fetchMetadataList()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.mb-4 {
  margin-bottom: 16px;
}

.table-scroll-container {
  overflow-x: auto;
  width: 100%;
}
</style>