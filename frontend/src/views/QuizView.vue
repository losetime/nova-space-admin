<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">问答管理</h2>
      <t-space>
        <t-input v-model="searchKeyword" placeholder="搜索题目" clearable style="width: 200px" @enter="fetchQuizList" />
        <t-select v-model="searchCategory" placeholder="分类" clearable style="width: 120px" @change="fetchQuizList">
          <t-option value="basic" label="基础" />
          <t-option value="advanced" label="进阶" />
          <t-option value="mission" label="任务" />
          <t-option value="people" label="人物" />
        </t-select>
        <t-button theme="primary" @click="openCreateModal">
          <template #icon><AddIcon /></template>
          新建题目
        </t-button>
      </t-space>
    </div>

    <t-table bordered
      :data="quizList"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @page-change="onPageChange"
    >
      <template #question="{ row }">
        <div class="question-cell" :title="row.question">{{ row.question }}</div>
      </template>
      <template #options="{ row }">
        <t-space direction="vertical" size="small">
          <div v-for="(opt, idx) in row.options" :key="idx" :class="['option-item', { correct: idx === row.correctIndex }]">
            {{ String.fromCharCode(65 + idx) }}. {{ opt }}
          </div>
        </t-space>
      </template>
      <template #category="{ row }">
        <t-tag :theme="getCategoryTheme(row.category)">{{ getCategoryLabel(row.category) }}</t-tag>
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link theme="primary" hover="color" @click="openEditModal(row)">编辑</t-link>
          <t-popconfirm content="确定删除此题目吗？" @confirm="handleDelete(row.id)">
            <t-link theme="danger" hover="color">删除</t-link>
          </t-popconfirm>
        </t-space>
      </template>
    </t-table>

    <!-- 编辑/新建弹窗 -->
    <t-dialog
      v-model:visible="editVisible"
      :header="editForm?.id ? '编辑题目' : '新建题目'"
      :confirm-btn="{ content: '保存', loading: editLoading }"
      @confirm="handleSubmit"
    >
      <t-form v-if="editForm" :data="editForm" label-width="80px">
        <t-form-item label="题目" required>
          <t-textarea v-model="editForm.question" :autosize="{ minRows: 2 }" placeholder="请输入题目" />
        </t-form-item>
        <t-form-item label="选项" required>
          <t-radio-group v-model="editForm.correctIndex" class="options-radio-group">
            <div v-for="(opt, idx) in editForm.options" :key="idx" class="option-edit-row">
              <t-radio :value="idx">{{ String.fromCharCode(65 + idx) }}.</t-radio>
              <t-input v-model="editForm.options[idx]" :placeholder="`选项${String.fromCharCode(65 + idx)}`" />
            </div>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="解析">
          <t-textarea v-model="editForm.explanation" :autosize="{ minRows: 2 }" placeholder="选填" />
        </t-form-item>
        <t-form-item label="分类">
          <t-select v-model="editForm.category">
            <t-option value="basic" label="基础" />
            <t-option value="advanced" label="进阶" />
            <t-option value="mission" label="任务" />
            <t-option value="people" label="人物" />
          </t-select>
        </t-form-item>
        <t-form-item label="分值">
          <t-input-number v-model="editForm.points" :min="1" :max="100" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'
import { quizApi, type Quiz } from '@/api'

const loading = ref(false)
const editVisible = ref(false)
const editLoading = ref(false)

// 列表相关
const quizList = ref<Quiz[]>([])
const searchKeyword = ref('')
const searchCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: totalItems.value,
}))

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'question', title: '题目', width: 200, ellipsis: true },
  { colKey: 'options', title: '选项', width: 280 },
  { colKey: 'category', title: '分类', width: 80 },
  { colKey: 'points', title: '分值', width: 60 },
  { colKey: 'operation', title: '操作', width: 120 },
]

// 编辑表单
const editForm = ref<Partial<Quiz> & { options: string[]; correctIndex: number } | null>(null)

function getCategoryTheme(category: string) {
  const map: Record<string, string> = {
    basic: 'primary',
    advanced: 'warning',
    mission: 'success',
    people: 'default',
  }
  return map[category] || 'default'
}

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    basic: '基础',
    advanced: '进阶',
    mission: '任务',
    people: '人物',
  }
  return map[category] || category
}

async function fetchQuizList() {
  loading.value = true
  try {
    const res = await quizApi.getList({
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value || undefined,
      category: searchCategory.value || undefined,
    })
    if (res.success) {
      quizList.value = res.data.data
      totalItems.value = res.data.total
    }
  } catch (error) {
    console.error('获取列表失败', error)
  } finally {
    loading.value = false
  }
}

function onPageChange(pageInfo: { current: number; pageSize: number }) {
  currentPage.value = pageInfo.current
  pageSize.value = pageInfo.pageSize
  fetchQuizList()
}

function openCreateModal() {
  editForm.value = {
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    category: 'basic',
    points: 10,
  }
  editVisible.value = true
}

function openEditModal(row: Quiz) {
  editForm.value = {
    id: row.id,
    question: row.question,
    options: [...row.options],
    correctIndex: row.correctIndex,
    explanation: row.explanation || '',
    category: row.category,
    points: row.points,
  }
  editVisible.value = true
}

async function handleSubmit() {
  if (!editForm.value) return

  // 验证
  if (!editForm.value.question.trim()) {
    MessagePlugin.warning('请输入题目')
    return
  }
  if (editForm.value.options.some(o => !o.trim())) {
    MessagePlugin.warning('请填写所有选项')
    return
  }

  editLoading.value = true
  try {
    const data = {
      question: editForm.value.question,
      options: editForm.value.options,
      correctIndex: editForm.value.correctIndex,
      explanation: editForm.value.explanation,
      category: editForm.value.category,
      points: editForm.value.points,
    }

    let res
    if (editForm.value.id) {
      res = await quizApi.update(editForm.value.id, data)
    } else {
      res = await quizApi.create(data)
    }

    if (res.success) {
      MessagePlugin.success(editForm.value.id ? '保存成功' : '创建成功')
      editVisible.value = false
      fetchQuizList()
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    const res = await quizApi.delete(id)
    if (res.success) {
      MessagePlugin.success('删除成功')
      fetchQuizList()
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '删除失败')
  }
}

onMounted(() => {
  fetchQuizList()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.question-cell {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.option-item {
  font-size: 13px;
  line-height: 1.5;
}

.option-item.correct {
  color: #00a870;
  font-weight: 500;
}

.options-radio-group {
  display: flex;
  gap: 6px;
  width: 100%;
}

.option-edit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  .t-radio {
    width: 14%;
  }
}

.option-edit-row :deep(.t-input__wrap) {
  width: 86%;
}
</style>