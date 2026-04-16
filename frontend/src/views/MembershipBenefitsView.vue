<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">权益管理</h2>
      <t-button theme="primary" @click="handleCreate">新增权益</t-button>
    </div>

    <t-table
      bordered
      :columns="columns"
      :data="benefits"
      :loading="loading"
      row-key="id"
    >
      <template #valueType="{ row }">
        <t-tag :theme="getValueTypeTheme(row.valueType)" variant="light">
          {{ getValueTypeText(row.valueType) }}
        </t-tag>
      </template>

      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>

      <template #action="{ row }">
        <t-space>
          <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
          <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
        </t-space>
      </template>
    </t-table>

    <!-- 新增/编辑权益弹窗 -->
    <t-dialog
      v-model:visible="showDialog"
      :header="isEdit ? '编辑权益' : '新增权益'"
      width="400px"
      :confirm-btn="{ content: '确认', loading: submitLoading }"
      @confirm="handleSubmit"
    >
      <t-form :data="form" :rules="rules" ref="formRef" label-align="left">
        <t-form-item label="权益名称" name="name">
          <t-input v-model="form.name" placeholder="如：每日推送次数" />
        </t-form-item>
        <t-form-item label="权益描述" name="description">
          <t-input v-model="form.description" placeholder="权益说明" />
        </t-form-item>
        <t-form-item label="值类型" name="valueType">
          <t-select v-model="form.valueType">
            <t-option value="number" label="数字" />
            <t-option value="text" label="文本" />
            <t-option value="boolean" label="布尔" />
          </t-select>
        </t-form-item>
        <t-form-item label="单位">
          <t-input v-model="form.unit" placeholder="如：次/天、倍" />
        </t-form-item>
        <t-form-item label="排序">
          <t-input-number v-model="form.sortOrder" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 删除确认弹窗 -->
    <t-dialog
      v-model:visible="showDeleteDialog"
      header="确认删除"
      width="350px"
      :confirm-btn="{ content: '确认删除', loading: submitLoading, theme: 'danger' }"
      @confirm="confirmDelete"
    >
      <p>确定要删除权益「{{ deletingBenefit?.name }}」吗？</p>
      <p class="text-gray-500 text-sm mt-2">删除后，所有等级中该权益的配置也将被删除</p>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import dayjs from 'dayjs'
import { membershipApi, type Benefit } from '@/api'

const loading = ref(false)
const submitLoading = ref(false)
const benefits = ref<Benefit[]>([])
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()
const editingBenefit = ref<Benefit | null>(null)
const deletingBenefit = ref<Benefit | null>(null)

const form = reactive({
  name: '',
  description: '',
  valueType: 'number',
  unit: '',
  sortOrder: 0,
})

const rules = {
  name: [{ required: true, message: '请输入权益名称' }],
  valueType: [{ required: true, message: '请选择值类型' }],
}

const columns = [
  { colKey: 'name', title: '权益名称', width: 150 },
  { colKey: 'description', title: '权益描述', width: 200 },
  { colKey: 'valueType', title: '值类型', width: 100 },
  { colKey: 'unit', title: '单位', width: 80 },
  { colKey: 'sortOrder', title: '排序', width: 60 },
  { colKey: 'createdAt', title: '创建时间', width: 150 },
  { colKey: 'action', title: '操作', width: 100 },
]

const valueTypeMap = {
  number: { text: '数字', theme: 'primary' },
  text: { text: '文本', theme: 'success' },
  boolean: { text: '布尔', theme: 'warning' },
}

function getValueTypeText(type: string) {
  return valueTypeMap[type as keyof typeof valueTypeMap]?.text || type
}

function getValueTypeTheme(type: string) {
  return valueTypeMap[type as keyof typeof valueTypeMap]?.theme || 'default'
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchBenefits() {
  loading.value = true
  try {
    const res = await membershipApi.getBenefits()
    if (res.success) {
      benefits.value = res.data.data
    }
  } catch (error) {
    MessagePlugin.error('获取权益列表失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.valueType = 'number'
  form.unit = ''
  form.sortOrder = 0
}

function handleCreate() {
  isEdit.value = false
  editingBenefit.value = null
  resetForm()
  showDialog.value = true
}

function handleEdit(row: Benefit) {
  isEdit.value = true
  editingBenefit.value = row
  form.name = row.name
  form.description = row.description || ''
  form.valueType = row.valueType || 'number'
  form.unit = row.unit || ''
  form.sortOrder = row.sortOrder || 0
  showDialog.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value && editingBenefit.value) {
      await membershipApi.updateBenefit(editingBenefit.value.id, {
        name: form.name,
        description: form.description,
        valueType: form.valueType,
        unit: form.unit,
        sortOrder: form.sortOrder,
      })
      MessagePlugin.success('编辑成功')
    } else {
      await membershipApi.createBenefit({
        name: form.name,
        description: form.description,
        valueType: form.valueType,
        unit: form.unit,
        sortOrder: form.sortOrder,
      })
      MessagePlugin.success('新增成功')
    }
    showDialog.value = false
    fetchBenefits()
  } catch (error) {
    MessagePlugin.error(isEdit.value ? '编辑失败' : '新增失败')
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row: Benefit) {
  deletingBenefit.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingBenefit.value) return

  submitLoading.value = true
  try {
    await membershipApi.deleteBenefit(deletingBenefit.value.id)
    MessagePlugin.success('删除成功')
    showDeleteDialog.value = false
    fetchBenefits()
  } catch (error) {
    MessagePlugin.error('删除失败')
  } finally {
    submitLoading.value = false
    deletingBenefit.value = null
  }
}

onMounted(() => {
  fetchBenefits()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}
</style>