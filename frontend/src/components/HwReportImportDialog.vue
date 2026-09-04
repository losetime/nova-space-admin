<template>
  <t-dialog
    :visible="visible"
    header="导入HW专报"
    :width="640"
    :footer="false"
    @update:visible="handleVisibleChange"
    @close="handleClose"
  >
    <div class="import-container">
      <!-- 文件上传区域 -->
      <div v-if="!importing && !result" class="upload-area">
        <div class="upload-tip">
          <t-alert theme="info" :close="false">
            请选择3个文件：xlsx跟踪表、原文.docx、译文.docx
          </t-alert>
        </div>

        <div class="file-inputs">
          <t-upload
            v-model="uploadFiles"
            :auto-upload="false"
            :multiple="true"
            :max="3"
            :accept="'.xlsx,.docx'"
            theme="file"
            :size-limit="{ size: 20, unit: 'MB' }"
            placeholder="点击选择文件，支持多选"
          >
            <t-button theme="default" variant="outline">
              <template #icon><UploadIcon /></template>
              选择文件
            </t-button>
          </t-upload>
        </div>

        <div class="dialog-footer">
          <t-button theme="default" variant="outline" @click="handleClose">
            取消
          </t-button>
          <t-button
            theme="primary"
            :loading="importing"
            :disabled="uploadFiles.length !== 3"
            @click="handleImport"
          >
            开始导入
          </t-button>
        </div>
      </div>

      <!-- 导入中 -->
      <div v-if="importing" class="importing-area">
        <t-loading size="large" />
        <p class="importing-text">正在解析并导入文件，请稍候...</p>
      </div>

      <!-- 导入结果 -->
      <div v-if="result" class="result-area">
        <t-alert
          :theme="result.articles?.length > 0 ? 'success' : 'warning'"
          :title="result.articles?.length > 0 ? '导入成功' : '导入完成'"
          :close="false"
        >
          成功导入 {{ result.articles?.length || 0 }} 篇文章
        </t-alert>

        <div v-if="result.warnings?.length > 0" class="warnings-section">
          <t-alert theme="warning" :close="false" class="warnings-alert">
            <template #title>警告信息</template>
            <ul class="warnings-list">
              <li v-for="(warning, index) in result.warnings" :key="index">
                {{ warning }}
              </li>
            </ul>
          </t-alert>
        </div>

        <div v-if="result.articles?.length > 0" class="articles-section">
          <h4>导入的文章</h4>
          <t-table
            :columns="resultColumns"
            :data="result.articles"
            :pagination="false"
            size="small"
            bordered
          />
        </div>

        <div class="dialog-footer">
          <t-button theme="primary" @click="handleClose">
            完成
          </t-button>
        </div>
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { UploadIcon } from 'tdesign-icons-vue-next'
import { parserApi, type DailyReportResult, type DailyReportArticle } from '@/api'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const uploadFiles = ref<any[]>([])
const importing = ref(false)
const result = ref<DailyReportResult | null>(null)

const resultColumns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'titleCn', title: '中文标题', ellipsis: true },
  { colKey: 'titleEn', title: '英文标题', ellipsis: true },
  { colKey: 'matchScore', title: '匹配度', width: 80, formatter: (row: DailyReportArticle) => `${row.matchScore}%` },
]

async function handleImport() {
  console.log("uploadFiles--", uploadFiles.value);
  if (uploadFiles.value.length !== 3) {
    MessagePlugin.warning('请选择3个文件')
    return
  }

  importing.value = true
  result.value = null

  try {
    const formData = new FormData()

    for (let i = 0; i < uploadFiles.value.length; i++) {
      const file = uploadFiles.value[i]
      console.log("file--", file.raw);
      formData.append('files', file.raw)
    }

    const res = await parserApi.parseDailyReport(formData)
    if (res.success) {
      result.value = res.data
      if (res.data.articles.length > 0) {
        MessagePlugin.success(`成功导入 ${res.data.articles.length} 篇文章`)
        emit('success')
      }
    } else {
      MessagePlugin.error(res.message || '导入失败')
    }
  } catch (error: any) {
    MessagePlugin.error(error?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

function handleVisibleChange(value: boolean) {
  emit('update:visible', value)
}

function handleClose() {
  uploadFiles.value = []
  importing.value = false
  result.value = null
  emit('update:visible', false)
}
</script>

<style scoped>
.import-container {
  min-height: 400px;
}

.upload-tip {
  margin-bottom: 24px;
}

.file-inputs {
  margin-bottom: 16px;
}

.file-list {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--td-bg-color-container);
  border-radius: 4px;
}

.file-list h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.file-list ul {
  margin: 0;
  padding-left: 20px;
}

.file-list li {
  margin: 4px 0;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--td-component-stroke);
}

.importing-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.importing-text {
  margin-top: 16px;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.result-area {
  padding: 20px 0;
}

.warnings-section {
  margin-top: 16px;
  text-align: left;
}

.warnings-alert {
  margin-bottom: 16px;
}

.warnings-list {
  margin: 0;
  padding-left: 20px;
}

.warnings-list li {
  margin: 4px 0;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.articles-section {
  margin-top: 20px;
  text-align: left;
}

.articles-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
}
</style>
