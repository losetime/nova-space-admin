<template>
  <t-dialog
    :visible="visible"
    :header="`推送记录 - ${email}`"
    width="90%"
    :footer="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="push-records-dialog">
      <div class="flex justify-between items-center mb-4">
        <t-space>
          <t-select
            v-model="filterTriggerType"
            style="width: 120px"
            placeholder="触发类型"
            clearable
            @change="handleFilter"
          >
            <t-option value="scheduled" label="定时推送" />
            <t-option value="manual" label="手动推送" />
          </t-select>
          <t-select
            v-model="filterStatus"
            style="width: 120px"
            placeholder="发送状态"
            clearable
            @change="handleFilter"
          >
            <t-option value="sent" label="已发送" />
            <t-option value="failed" label="失败" />
          </t-select>
        </t-space>
        
        <t-button theme="primary" @click="fetchRecords">
          刷新
        </t-button>
      </div>

      <t-table
        bordered
        :columns="columns"
        :data="records"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        max-height="500px"
        @page-change="handleTableChange"
      >
        <template #triggerType="{ row }">
          <t-tag :theme="getTriggerTypeTheme(row.triggerType)" variant="light">
            {{ getTriggerTypeText(row.triggerType) }}
          </t-tag>
        </template>
        
        <template #subject="{ row }">
          <t-tooltip :content="row.subject">
            <span>{{ row.subject.slice(0, 40) }}{{ row.subject.length > 40 ? '...' : '' }}</span>
          </t-tooltip>
        </template>
        
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ getStatusText(row.status) }}
          </t-tag>
        </template>
        
        <template #sentAt="{ row }">
          {{ formatDate(row.sentAt) }}
        </template>
        
        <template #errorMessage="{ row }">
          <t-tooltip v-if="row.errorMessage" :content="row.errorMessage">
            <span style="color: #ef4444;">{{ row.errorMessage.slice(0, 30) }}...</span>
          </t-tooltip>
          <span v-else>-</span>
        </template>
      </t-table>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import dayjs from 'dayjs'
import { pushRecordApi, type PushRecord, type PushTriggerType, type PushRecordStatus } from '@/api'

const props = defineProps<{
  visible: boolean
  email: string
}>()

const emit = defineEmits(['update:visible'])

const loading = ref(false)
const records = ref<PushRecord[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const filterTriggerType = ref<PushTriggerType | undefined>()
const filterStatus = ref<PushRecordStatus | undefined>()

const columns = [
  { colKey: 'id', title: 'ID', width: 200, ellipsis: true },
  { colKey: 'triggerType', title: '触发类型', width: 100 },
  { colKey: 'subject', title: '主题', ellipsis: true },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'sentAt', title: '发送时间', width: 140 },
  { colKey: 'errorMessage', title: '错误信息', width: 200, ellipsis: true },
]

const triggerTypeMap = {
  scheduled: { text: '定时推送', theme: 'primary' },
  manual: { text: '手动推送', theme: 'warning' },
}

const statusMap = {
  sent: { text: '已发送', theme: 'success' },
  failed: { text: '失败', theme: 'danger' },
}

function getTriggerTypeText(type: string) {
  return triggerTypeMap[type]?.text || type
}

function getTriggerTypeTheme(type: string) {
  return triggerTypeMap[type]?.theme || 'default'
}

function getStatusText(status: string) {
  return statusMap[status]?.text || status
}

function getStatusTheme(status: string) {
  return statusMap[status]?.theme || 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchRecords() {
  if (!props.email) return
  
  loading.value = true
  try {
    const res = await pushRecordApi.getList({
      page: pagination.current,
      limit: pagination.pageSize,
      triggerType: filterTriggerType.value,
      status: filterStatus.value,
      email: props.email,
    })
    if (res.success) {
      records.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    MessagePlugin.error('获取推送记录失败')
  } finally {
    loading.value = false
  }
}

function handleTableChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchRecords()
}

function handleFilter() {
  pagination.current = 1
  fetchRecords()
}

watch(() => props.visible, (visible) => {
  if (visible && props.email) {
    pagination.current = 1
    fetchRecords()
  }
})
</script>

<style scoped>
.push-records-dialog {
  min-height: 300px;
}
</style>