<template>
  <div class="image-upload">
    <t-upload
      v-model="files"
      :multiple="false"
      accept="image/*"
      theme="image"
      :tips="tips"
      :size-limit="{ size: 5, unit: 'MB' }"
      :request-method="customRequest"
      @success="handleSuccess"
      @fail="handleFail"
      @remove="handleRemove"
    />
    <div v-if="modelValue && files.length === 0" class="preview-container">
      <img :src="getFullImageUrl(modelValue)" class="preview-image" />
      <t-button
        theme="danger"
        variant="text"
        size="small"
        class="remove-btn"
        @click="handleRemovePreview"
      >
        删除
      </t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { uploadApi } from '@/api'
import { getFullImageUrl } from '@/utils/image-url'

interface Props {
  modelValue?: string
  tips?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  tips: '支持 jpg、png、gif 格式，最大 5MB',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const files = ref<any[]>([])

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && files.value.length === 0) {
      files.value = [
        {
          url: newVal,
          name: 'current-image',
          status: 'success',
        },
      ]
    } else if (!newVal) {
      files.value = []
    }
  },
  { immediate: true }
)

async function customRequest(params: any) {
  let fileObj = null
  
  if (params && params.file && params.file.raw) {
    fileObj = params.file.raw
  } else if (params && params.raw) {
    fileObj = params.raw
  } else {
    console.error('Upload params:', params)
    return {
      status: 'fail',
      error: '文件参数错误',
    }
  }

  const formData = new FormData()
  formData.append('file', fileObj)

  try {
    const response = await uploadApi.uploadImage(formData)
    return {
      status: 'success',
      response: response,
    }
  } catch (error: any) {
    return {
      status: 'fail',
      error: error.message || '上传失败',
    }
  }
}

function handleSuccess({ response }: any) {
  if (response?.success && response.data?.url) {
    emit('update:modelValue', response.data.url)
    MessagePlugin.success('上传成功')
  } else {
    MessagePlugin.error(response?.message || '上传失败')
  }
}

function handleFail({ file }: any) {
  MessagePlugin.error(`${file.name} 上传失败`)
}

function handleRemove() {
  files.value = []
  emit('update:modelValue', '')
}

function handleRemovePreview() {
  files.value = []
  emit('update:modelValue', '')
}
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.preview-container {
  position: relative;
  display: inline-block;
  margin-top: 8px;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #dcdcdc;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>