<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">会员套餐管理</h2>
      <t-button theme="primary" @click="showCreateDialog = true">新建套餐</t-button>
    </div>

    <t-table
      bordered
      :columns="columns"
      :data="plans"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #name="{ row }">
        <span class="font-medium">{{ row.name }}</span>
      </template>
      
      <template #planCode="{ row }">
        <t-tag theme="primary" variant="light">{{ row.planCode }}</t-tag>
      </template>
      
      <template #level="{ row }">
        <t-tag :theme="getLevelTheme(row.level)" variant="light">
          {{ getLevelText(row.level) }}
        </t-tag>
      </template>
      
      <template #price="{ row }">
        ¥{{ row.price }}
      </template>
      
      <template #pointsPrice="{ row }">
        {{ row.pointsPrice ? `${row.pointsPrice} 积分` : '不支持' }}
      </template>
      
      <template #durationMonths="{ row }">
        {{ row.durationMonths === 1200 ? '永久' : `${row.durationMonths}个月` }}
      </template>
      
      <template #isActive="{ row }">
        <t-tag :theme="row.isActive ? 'success' : 'warning'" variant="light">
          {{ row.isActive ? '上架' : '下架' }}
        </t-tag>
      </template>
      
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      
      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
          <t-link theme="warning" @click="handleToggleStatus(row)">
            {{ row.isActive ? '下架' : '上架' }}
          </t-link>
          <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
        </t-space>
      </template>
    </t-table>

    <t-dialog
      v-model:visible="showCreateDialog"
      header="新建套餐"
      width="600px"
      :confirm-btn="{ content: '创建', loading: submitLoading }"
      @confirm="handleCreate"
    >
      <t-form :data="formData" :rules="formRules" ref="formRef" label-align="left">
        <t-form-item label="套餐名称" name="name">
          <t-input v-model="formData.name" placeholder="如：月卡、季卡" />
        </t-form-item>
        <t-form-item label="套餐代码" name="planCode">
          <t-select v-model="formData.planCode">
            <t-option value="monthly" label="monthly（月卡）" />
            <t-option value="quarterly" label="quarterly（季卡）" />
            <t-option value="yearly" label="yearly（年卡）" />
            <t-option value="lifetime" label="lifetime（永久卡）" />
            <t-option value="custom" label="custom（自定义）" />
          </t-select>
        </t-form-item>
        <t-form-item label="有效期" name="durationMonths">
          <t-input-number v-model="formData.durationMonths" :min="1" placeholder="月数，永久卡填1200" />
        </t-form-item>
        <t-form-item label="会员等级" name="level">
          <t-select v-model="formData.level" :options="levelOptions" placeholder="请选择会员等级" />
        </t-form-item>
        <t-form-item label="价格（元）" name="price">
          <t-input-number v-model="formData.price" :min="0" :decimalPlaces="2" />
        </t-form-item>
        <t-form-item label="积分兑换价">
          <t-input-number v-model="formData.pointsPrice" :min="0" placeholder="不填则不支持积分兑换" />
        </t-form-item>
        <t-form-item label="描述">
          <t-textarea v-model="formData.description" placeholder="套餐描述" />
        </t-form-item>
        <t-form-item label="排序">
          <t-input-number v-model="formData.sortOrder" :min="0" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog
      v-model:visible="showEditDialog"
      header="编辑套餐"
      width="600px"
      :confirm-btn="{ content: '保存', loading: submitLoading }"
      @confirm="handleUpdate"
    >
      <t-form :data="editFormData" :rules="formRules" ref="editFormRef" label-align="left">
        <t-form-item label="套餐名称" name="name">
          <t-input v-model="editFormData.name" />
        </t-form-item>
        <t-form-item label="有效期" name="durationMonths">
          <t-input-number v-model="editFormData.durationMonths" :min="1" />
        </t-form-item>
        <t-form-item label="会员等级" name="level">
          <t-select v-model="editFormData.level" :options="levelOptions" placeholder="请选择会员等级" />
        </t-form-item>
        <t-form-item label="价格（元）" name="price">
          <t-input-number v-model="editFormData.price" :min="0" :decimalPlaces="2" />
        </t-form-item>
        <t-form-item label="积分兑换价">
          <t-input-number v-model="editFormData.pointsPrice" :min="0" />
        </t-form-item>
        <t-form-item label="描述">
          <t-textarea v-model="editFormData.description" />
        </t-form-item>
        <t-form-item label="排序">
          <t-input-number v-model="editFormData.sortOrder" :min="0" />
        </t-form-item>
        <t-form-item label="状态">
          <t-switch v-model="editFormData.isActive" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import dayjs from 'dayjs'
import { membershipApi, type MembershipPlan, type MemberLevel } from '@/api'

const loading = ref(false)
const submitLoading = ref(false)
const plans = ref<MembershipPlan[]>([])
const levels = ref<MemberLevel[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
})

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const formRef = ref()
const editFormRef = ref()
const editingPlan = ref<MembershipPlan | null>(null)

const formData = reactive({
  name: '',
  planCode: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'lifetime' | 'custom',
  durationMonths: 1,
  level: '' as string,
  price: 0,
  pointsPrice: null as number | null,
  description: '',
  sortOrder: 0,
})

const editFormData = reactive({
  name: '',
  durationMonths: 1,
  level: '' as string,
  price: 0,
  pointsPrice: null as number | null,
  description: '',
  sortOrder: 0,
  isActive: true,
})

const formRules = {
  name: [{ required: true, message: '请输入套餐名称' }],
  planCode: [{ required: true, message: '请选择套餐代码' }],
  durationMonths: [{ required: true, message: '请输入有效期' }],
  level: [{ required: true, message: '请选择会员等级' }],
  price: [{ required: true, message: '请输入价格' }],
}

const columns = [
  { colKey: 'name', title: '套餐名称', width: 120 },
  { colKey: 'planCode', title: '套餐代码', width: 100 },
  { colKey: 'level', title: '会员等级', width: 100 },
  { colKey: 'price', title: '价格', width: 80 },
  { colKey: 'pointsPrice', title: '积分兑换价', width: 100 },
  { colKey: 'durationMonths', title: '有效期', width: 80 },
  { colKey: 'isActive', title: '状态', width: 80 },
  { colKey: 'sortOrder', title: '排序', width: 60 },
  { colKey: 'createdAt', title: '创建时间', width: 140 },
  { colKey: 'action', title: '操作', width: 150 },
]

const levelMap: Record<string, { text: string; theme: string }> = {}

const levelOptions = computed(() => {
  return levels.value.map((l) => ({
    value: l.code,
    label: `${l.icon || ''} ${l.name}`,
  }))
})

function getLevelText(level: string) {
  if (levelMap[level]) {
    return levelMap[level].text
  }
  const foundLevel = levels.value.find((l) => l.code === level)
  return foundLevel?.name || level
}

function getLevelTheme(level: string) {
  if (levelMap[level]) {
    return levelMap[level].theme
  }
  const foundLevel = levels.value.find((l) => l.code === level)
  if (!foundLevel) return 'default'
  if (foundLevel.sortOrder >= 2) return 'warning'
  if (foundLevel.sortOrder >= 1) return 'primary'
  return 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchPlans() {
  loading.value = true
  try {
    const res = await membershipApi.getPlans({
      page: pagination.current,
      limit: pagination.pageSize,
    })
    if (res.success) {
      plans.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    MessagePlugin.error('获取套餐列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchLevels() {
  try {
    const res = await membershipApi.getLevels({ limit: 100 })
    if (res.success) {
      levels.value = res.data.data
    }
  } catch (error) {
    console.error('获取会员等级失败')
  }
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchPlans()
}

function handleEdit(row: MembershipPlan) {
  editingPlan.value = row
  editFormData.name = row.name
  editFormData.durationMonths = row.durationMonths
  editFormData.level = row.level
  editFormData.price = Number(row.price)
  editFormData.pointsPrice = row.pointsPrice
  editFormData.description = row.description || ''
  editFormData.sortOrder = row.sortOrder
  editFormData.isActive = row.isActive
  showEditDialog.value = true
}

async function handleToggleStatus(row: MembershipPlan) {
  const confirmDialog = DialogPlugin.confirm({
    header: '确认操作',
    body: `确定要${row.isActive ? '下架' : '上架'}该套餐吗？`,
    onConfirm: async () => {
      try {
        await membershipApi.updatePlan(row.id, { isActive: !row.isActive })
        MessagePlugin.success('操作成功')
        fetchPlans()
      } catch (error) {
        MessagePlugin.error('操作失败')
      }
      confirmDialog.hide()
    },
  })
}

async function handleDelete(row: MembershipPlan) {
  const confirmDialog = DialogPlugin.confirm({
    header: '确认删除',
    body: '删除后无法恢复，确定要删除该套餐吗？',
    theme: 'danger',
    onConfirm: async () => {
      try {
        await membershipApi.deletePlan(row.id)
        MessagePlugin.success('删除成功')
        fetchPlans()
      } catch (error) {
        MessagePlugin.error('删除失败')
      }
      confirmDialog.hide()
    },
  })
}

async function handleCreate() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    await membershipApi.createPlan({
      name: formData.name,
      planCode: formData.planCode,
      durationMonths: formData.durationMonths,
      level: formData.level,
      price: formData.price,
      pointsPrice: formData.pointsPrice || undefined,
      description: formData.description,
      sortOrder: formData.sortOrder,
    })
    MessagePlugin.success('创建成功')
    showCreateDialog.value = false
    resetForm()
    fetchPlans()
  } catch (error) {
    MessagePlugin.error('创建失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleUpdate() {
  if (!editingPlan.value) return

  const valid = await editFormRef.value?.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    await membershipApi.updatePlan(editingPlan.value.id, {
      name: editFormData.name,
      durationMonths: editFormData.durationMonths,
      level: editFormData.level,
      price: editFormData.price,
      pointsPrice: editFormData.pointsPrice || undefined,
      description: editFormData.description,
      sortOrder: editFormData.sortOrder,
      isActive: editFormData.isActive,
    })
    MessagePlugin.success('更新成功')
    showEditDialog.value = false
    fetchPlans()
  } catch (error) {
    MessagePlugin.error('更新失败')
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  formData.name = ''
  formData.planCode = 'monthly'
  formData.durationMonths = 1
  formData.level = ''
  formData.price = 0
  formData.pointsPrice = null
  formData.description = ''
  formData.sortOrder = 0
}

onMounted(() => {
  fetchLevels()
  fetchPlans()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>