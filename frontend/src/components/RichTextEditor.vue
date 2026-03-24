<template>
  <div class="editor-wrapper">
    <!-- 工具栏 -->
    <div class="toolbar" v-if="editor">
      <!-- 文字格式 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('bold') }"
          @click.prevent="editor.chain().focus().toggleBold().run()"
          title="加粗"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('italic') }"
          @click.prevent="editor.chain().focus().toggleItalic().run()"
          title="斜体"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('underline') }"
          @click.prevent="editor.chain().focus().toggleUnderline().run()"
          title="下划线"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('strike') }"
          @click.prevent="editor.chain().focus().toggleStrike().run()"
          title="删除线"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('highlight') }"
          @click.prevent="editor.chain().focus().toggleHighlight().run()"
          title="高亮"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242zm6.364 3.535l-1.414 1.414-4.243-4.243 1.414-1.414a2 2 0 0 1 2.828 0l1.415 1.415a2 2 0 0 1 0 2.828zM4.283 16.89l-.283.849-.849.283L1 19.586 4.414 23l1.564-2.151.283-.849.849-.283 1.04-1.04-2.828-2.828-1.04 1.04z"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 标题 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('heading', { level: 1 }) }"
          @click.prevent="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          title="标题1"
        >H1</button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('heading', { level: 2 }) }"
          @click.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          title="标题2"
        >H2</button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('heading', { level: 3 }) }"
          @click.prevent="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          title="标题3"
        >H3</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 列表 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('bulletList') }"
          @click.prevent="editor.chain().focus().toggleBulletList().run()"
          title="无序列表"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('orderedList') }"
          @click.prevent="editor.chain().focus().toggleOrderedList().run()"
          title="有序列表"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('taskList') }"
          @click.prevent="editor.chain().focus().toggleTaskList().run()"
          title="待办列表"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 对齐 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive({ textAlign: 'left' }) }"
          @click.prevent="editor.chain().focus().setTextAlign('left').run()"
          title="左对齐"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive({ textAlign: 'center' }) }"
          @click.prevent="editor.chain().focus().setTextAlign('center').run()"
          title="居中"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive({ textAlign: 'right' }) }"
          @click.prevent="editor.chain().focus().setTextAlign('right').run()"
          title="右对齐"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 插入 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('blockquote') }"
          @click.prevent="editor.chain().focus().toggleBlockquote().run()"
          title="引用"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('codeBlock') }"
          @click.prevent="editor.chain().focus().toggleCodeBlock().run()"
          title="代码块"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          @click.prevent="editor.chain().focus().setHorizontalRule().run()"
          title="分割线"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h16v2H4z"/></svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('link') }"
          @click.prevent="setLink"
          title="链接"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        </button>
        <button class="toolbar-btn" @click.prevent="addImage" title="图片">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
        <button class="toolbar-btn" @click.prevent="insertTable" title="表格">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 导入 -->
      <div class="toolbar-group">
        <button class="toolbar-btn" @click.prevent="importMarkdown" title="导入 Markdown">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zM19.69 12h-1.92V8.81h-1.92V12h-1.92l2.88 3.28L19.69 12z"/></svg>
        </button>
        <button class="toolbar-btn" @click.prevent="importDocx" title="导入 Word">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-2-3h-2l-1-3-1 3H10l-1-5h1.5l.5 3 1-3h1l1 3 .5-3H16l-1 5z"/></svg>
        </button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-container">
      <EditorContent :editor="editor" class="editor-content" />
    </div>

    <!-- 隐藏的文件输入 -->
    <input ref="markdownInput" type="file" accept=".md,.txt" style="display: none" @change="handleMarkdownFile" />
    <input ref="docxInput" type="file" accept=".docx" style="display: none" @change="handleDocxFile" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import { MessagePlugin } from 'tdesign-vue-next'
import mammoth from 'mammoth'
import { uploadApi } from '@/api'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const markdownInput = ref<HTMLInputElement>()
const docxInput = ref<HTMLInputElement>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
    }),
    Image,
    Placeholder.configure({ placeholder: props.placeholder || '请输入内容...' }),
    Underline,
    Highlight,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value)
    }
  }
)

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('请输入链接地址', previousUrl)
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

async function addImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/gif,image/webp'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    // 检查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      MessagePlugin.warning(`图片大小不能超过 5MB，当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadApi.uploadImage(formData)
      if (res.success && res.data?.url) {
        editor.value?.chain().focus().setImage({ src: res.data.url }).run()
      }
    } catch (error: any) {
      MessagePlugin.error(error.message || '图片上传失败')
    }
  }
  input.click()
}

function insertTable() {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function importMarkdown() {
  markdownInput.value?.click()
}

async function handleMarkdownFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 检查文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    MessagePlugin.warning(`文件大小不能超过 10MB，当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    ;(e.target as HTMLInputElement).value = ''
    return
  }

  try {
    const text = await file.text()
    const html = markdownToHtml(text)
    editor.value?.chain().focus().insertContent(html).run()
    MessagePlugin.success('Markdown 导入成功')
  } catch {
    MessagePlugin.error('Markdown 解析失败')
  }
  ;(e.target as HTMLInputElement).value = ''
}

function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

function importDocx() {
  docxInput.value?.click()
}

async function handleDocxFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 检查文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    MessagePlugin.warning(`文件大小不能超过 10MB，当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    ;(e.target as HTMLInputElement).value = ''
    return
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    if (result.value) {
      editor.value?.chain().focus().insertContent(result.value).run()
      MessagePlugin.success('Word 文档导入成功')
    }
  } catch {
    MessagePlugin.error('Word 文档解析失败')
  }
  ;(e.target as HTMLInputElement).value = ''
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
}

.toolbar-btn:hover {
  background: #e5e7eb;
}

.toolbar-btn.active {
  background: #dbeafe;
  color: #2563eb;
}

/* 编辑区域 */
.editor-container {
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
}

.editor-content {
  padding: 16px;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 268px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* 标题 */
.editor-content :deep(.ProseMirror h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
}
.editor-content :deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0.875rem 0 0.5rem;
}
.editor-content :deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
}

/* 对齐 */
.editor-content :deep(.ProseMirror[style*="text-align: center"]),
.editor-content :deep(.ProseMirror p[style*="text-align: center"]) {
  text-align: center;
}
.editor-content :deep(.ProseMirror[style*="text-align: right"]),
.editor-content :deep(.ProseMirror p[style*="text-align: right"]) {
  text-align: right;
}

/* 列表 */
.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.editor-content :deep(.ProseMirror ul) {
  list-style-type: disc;
}
.editor-content :deep(.ProseMirror ol) {
  list-style-type: decimal;
}

/* 待办列表 */
.editor-content :deep(.ProseMirror ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}
.editor-content :deep(.ProseMirror ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0;
}
.editor-content :deep(.ProseMirror ul[data-type="taskList"] li > label) {
  flex-shrink: 0;
  margin-top: 4px;
}
.editor-content :deep(.ProseMirror ul[data-type="taskList"] li > div) {
  flex: 1;
}

/* 引用 */
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #6b7280;
}

/* 代码块 */
.editor-content :deep(.ProseMirror pre) {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.editor-content :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  color: inherit;
}
.editor-content :deep(.ProseMirror code) {
  background: #f3f4f6;
  color: #dc2626;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
}

/* 高亮 */
.editor-content :deep(.ProseMirror mark) {
  background: #fef08a;
  padding: 2px 0;
}

/* 链接 */
.editor-content :deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
}
.editor-content :deep(.ProseMirror a:hover) {
  color: #1d4ed8;
}

/* 图片 */
.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 8px 0;
}

/* 分割线 */
.editor-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 1rem 0;
}

/* 表格 */
.editor-content :deep(.ProseMirror table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}
.editor-content :deep(.ProseMirror th),
.editor-content :deep(.ProseMirror td) {
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  text-align: left;
}
.editor-content :deep(.ProseMirror th) {
  background: #f9fafb;
  font-weight: 600;
}
.editor-content :deep(.ProseMirror .selectedCell) {
  background: #eff6ff;
}
</style>