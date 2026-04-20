<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">会员管理</h2>
      <t-button theme="primary" @click="handleCreateLevel">新增等级</t-button>
    </div>

    <div class="level-grid">
      <div v-for="level in levels" :key="level.id" class="level-card">
        <div class="level-header">
          <span class="level-icon">{{ level.icon }}</span>
          <span class="level-name">{{ level.name }}</span>
          <t-tag v-if="level.isDefault" theme="warning" variant="light" size="small">默认</t-tag>
        </div>
        <div class="level-code">编码: {{ level.code }}</div>
        <div class="level-desc">{{ level.description || '暂无描述' }}</div>
        
        <div class="benefits-section">
          <div class="benefits-title">已配置权益</div>
          <div class="benefits-list">
            <div v-for="benefit in level.benefits" :key="benefit.id" class="benefit-item">
              <span class="benefit-name">{{ benefit.name }}</span>
              <span class="benefit-value">{{ benefit.displayText || `${benefit.value} ${benefit.unit || ''}` }}</span>
            </div>
            <div v-if="level.benefits?.length === 0" class="no-benefit">
              暂未配置权益
            </div>
          </div>
        </div>

        <div class="level-footer">
          <span class="user-count">{{ level.userCount }} 人使用</span>
          <t-space>
            <t-link theme="primary" @click="handleEditLevel(level)">编辑</t-link>
            <t-link theme="danger" @click="handleDeleteLevel(level)">删除</t-link>
          </t-space>
        </div>
      </div>
    </div>

    <!-- 新增/编辑等级弹窗 -->
    <t-dialog
      v-model:visible="showLevelDialog"
      :header="isEditLevel ? '编辑等级' : '新增等级'"
      width="550px"
      :confirm-btn="{ content: '确认', loading: submitLoading }"
      @confirm="handleLevelSubmit"
    >
      <t-form :data="levelForm" :rules="levelRules" ref="levelFormRef" label-align="left">
        <t-form-item label="等级名称" name="name">
          <t-input v-model="levelForm.name" placeholder="如：VIP会员" @change="handleNameChange" />
        </t-form-item>
        <t-form-item label="等级编码">
          <t-input v-model="levelForm.code" placeholder="自动生成，可手动修改" />
        </t-form-item>
        <t-form-item label="等级描述">
          <t-input v-model="levelForm.description" placeholder="等级说明" />
        </t-form-item>
        <t-form-item label="等级图标">
          <t-input v-model="levelForm.icon" placeholder="emoji图标，如：⭐ 💎 👑 🏆" />
        </t-form-item>
        <t-form-item label="默认等级">
          <t-switch v-model="levelForm.isDefault" />
          <span class="ml-2 text-gray-500 text-sm">新用户自动分配此等级</span>
        </t-form-item>
        <t-form-item label="排序">
          <t-input-number v-model="levelForm.sortOrder" />
        </t-form-item>

        <div v-if="isEditLevel" class="benefits-config">
          <div class="config-title">权益配置</div>

          <div class="configured-benefits">
            <div v-for="(config, index) in levelForm.benefits" :key="index" class="config-item">
              <span class="config-name">{{ getBenefitName(config.benefitId) }}</span>
              <t-input v-model="config.displayText" class="config-display-input" placeholder="展示文案（用户看到的）" />
              <div class="config-switch">
                <t-switch
                  v-if="getBenefitValueType(config.benefitId) === 'boolean'"
                  :model-value="config.value === 'true'"
                  disabled
                />
                <t-input v-else v-model="config.value" class="config-input" placeholder="权益值（控制逻辑）" />
              </div>
              <t-link theme="danger" @click="removeBenefitConfig(index)">移除</t-link>
            </div>
          </div>

          <div class="add-benefit-section">
            <t-select
              v-model="addBenefitId"
              placeholder="选择权益"
              class="add-select"
              :options="benefitOptions"
              @change="handleBenefitSelectChange"
            />
            <t-input v-model="addBenefitDisplayText" placeholder="展示文案" class="add-display-input" />
            <div class="config-switch">
              <t-switch
                v-if="selectedBenefitValueType === 'boolean'"
                :model-value="true"
                disabled
              />
              <t-input v-else v-model="addBenefitValue" placeholder="权益值（控制逻辑）" class="add-input" />
            </div>
            <t-button theme="default" @click="addBenefitConfig">添加</t-button>
          </div>
        </div>
      </t-form>
    </t-dialog>

    <!-- 删除等级确认弹窗 -->
    <t-dialog
      v-model:visible="showDeleteLevelDialog"
      header="确认删除"
      width="400px"
      :confirm-btn="{ content: '确认删除', loading: submitLoading, theme: 'danger' }"
      @confirm="confirmDeleteLevel"
    >
      <div class="delete-content">
        <p>确定要删除等级「{{ deletingLevel?.name }}」吗？</p>
        <div v-if="deletingLevel?.userCount > 0" class="delete-warning">
          <p>⚠️ 有 {{ deletingLevel.userCount }} 个用户正在使用该等级</p>
          <p class="text-sm">请先将这些用户调整到其他等级后再删除</p>
        </div>
        <div v-if="deletingLevel?.isDefault" class="delete-warning">
          <p>⚠️ 默认等级不能删除</p>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { membershipApi, type MemberLevel, type Benefit } from '@/api'

const loading = ref(false)
const submitLoading = ref(false)
const levels = ref<MemberLevel[]>([])
const benefits = ref<Benefit[]>([])
const showLevelDialog = ref(false)
const showDeleteLevelDialog = ref(false)
const isEditLevel = ref(false)
const levelFormRef = ref()
const editingLevel = ref<MemberLevel | null>(null)
const deletingLevel = ref<MemberLevel | null>(null)

const levelForm = reactive({
  name: '',
  code: '',
  description: '',
  icon: '',
  isDefault: false,
  sortOrder: 0,
  benefits: [] as { benefitId: string; value: string; displayText?: string }[],
})

const addBenefitId = ref('')
const addBenefitValue = ref('')
const addBenefitDisplayText = ref('')
const selectedBenefitValueType = ref<'number' | 'text' | 'boolean' | null>(null)

function getBenefitValueType(benefitId: string): 'number' | 'text' | 'boolean' | null {
  const benefit = benefits.value.find((b) => b.id === benefitId)
  return benefit?.valueType || null
}

function handleBenefitSelectChange() {
  const benefit = benefits.value.find((b) => b.id === addBenefitId.value)
  selectedBenefitValueType.value = benefit?.valueType || null
  if (selectedBenefitValueType.value === 'boolean') {
    addBenefitValue.value = 'true'
  } else {
    addBenefitValue.value = ''
  }
}

const levelRules = {
  name: [{ required: true, message: '请输入等级名称' }],
}

const benefitOptions = computed(() => {
  return benefits.value.map((b) => ({
    value: b.id,
    label: b.name,
  }))
})

function getBenefitName(benefitId: string) {
  const benefit = benefits.value.find((b) => b.id === benefitId)
  return benefit?.name || '未知权益'
}

function generateCode(name: string): string {
  const pinyinMap: Record<string, string> = {
    '普通': 'basic',
    '高级': 'advanced',
    '专业': 'professional',
    '至尊': 'supreme',
    '钻石': 'diamond',
    '黄金': 'gold',
    '白银': 'silver',
    'VIP': 'vip',
  }
  
  for (const [key, value] of Object.entries(pinyinMap)) {
    if (name.includes(key)) {
      return value
    }
  }
  
  return name.toLowerCase().replace(/[^\w]/g, '_').slice(0, 20) || 'level'
}

function handleNameChange(value: string) {
  if (!isEditLevel.value) {
    levelForm.code = generateCode(value)
  }
}

async function fetchLevels() {
  loading.value = true
  try {
    const res = await membershipApi.getLevels()
    if (res.success) {
      levels.value = res.data.data
    }
  } catch (error) {
    MessagePlugin.error('获取等级列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchBenefits() {
  try {
    const res = await membershipApi.getBenefits()
    if (res.success) {
      benefits.value = res.data.data
    }
  } catch (error) {
    console.error('获取权益列表失败')
  }
}

function resetLevelForm() {
  levelForm.name = ''
  levelForm.code = ''
  levelForm.description = ''
  levelForm.icon = ''
  levelForm.isDefault = false
  levelForm.sortOrder = 0
  levelForm.benefits = []
  addBenefitId.value = ''
  addBenefitValue.value = ''
  addBenefitDisplayText.value = ''
  selectedBenefitValueType.value = null
}

function handleCreateLevel() {
  isEditLevel.value = false
  editingLevel.value = null
  resetLevelForm()
  showLevelDialog.value = true
}

function handleEditLevel(level: MemberLevel) {
  isEditLevel.value = true
  editingLevel.value = level
  levelForm.name = level.name
  levelForm.code = level.code
  levelForm.description = level.description || ''
  levelForm.icon = level.icon || ''
  levelForm.isDefault = level.isDefault
  levelForm.sortOrder = level.sortOrder || 0
  levelForm.benefits = (level.benefits || []).map((b) => ({
    benefitId: b.id,
    value: b.value,
    displayText: b.displayText || '',
  }))
  showLevelDialog.value = true
}

function addBenefitConfig() {
  if (!addBenefitId.value || !addBenefitValue.value) {
    MessagePlugin.warning('请选择权益并填写权益值')
    return
  }
  
  const existing = levelForm.benefits.find((b) => b.benefitId === addBenefitId.value)
  if (existing) {
    existing.value = addBenefitValue.value
    existing.displayText = addBenefitDisplayText.value
  } else {
    levelForm.benefits.push({
      benefitId: addBenefitId.value,
      value: addBenefitValue.value,
      displayText: addBenefitDisplayText.value,
    })
  }

  addBenefitId.value = ''
  addBenefitValue.value = ''
  addBenefitDisplayText.value = ''
  selectedBenefitValueType.value = null
}

function removeBenefitConfig(index: number) {
  levelForm.benefits.splice(index, 1)
}

async function handleLevelSubmit() {
  const valid = await levelFormRef.value?.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEditLevel.value && editingLevel.value) {
      await membershipApi.updateLevel(editingLevel.value.id, {
        name: levelForm.name,
        code: levelForm.code,
        description: levelForm.description,
        icon: levelForm.icon,
        isDefault: levelForm.isDefault,
        sortOrder: levelForm.sortOrder,
      })
      
      if (levelForm.benefits.length > 0) {
        await membershipApi.configureLevelBenefits(editingLevel.value.id, {
          benefits: levelForm.benefits,
        })
      }
      MessagePlugin.success('编辑成功')
    } else {
      await membershipApi.createLevel({
        name: levelForm.name,
        code: levelForm.code,
        description: levelForm.description,
        icon: levelForm.icon,
        isDefault: levelForm.isDefault,
        sortOrder: levelForm.sortOrder,
      })
      MessagePlugin.success('新增成功')
    }
    showLevelDialog.value = false
    fetchLevels()
  } catch (error: any) {
    MessagePlugin.error(error.response?.data?.message || (isEditLevel.value ? '编辑失败' : '新增失败'))
  } finally {
    submitLoading.value = false
  }
}

function handleDeleteLevel(level: MemberLevel) {
  deletingLevel.value = level
  showDeleteLevelDialog.value = true
}

async function confirmDeleteLevel() {
  if (!deletingLevel.value) return

  if (deletingLevel.value.isDefault) {
    MessagePlugin.warning('默认等级不能删除')
    showDeleteLevelDialog.value = false
    deletingLevel.value = null
    return
  }

  if (deletingLevel.value.userCount > 0) {
    MessagePlugin.warning(`有 ${deletingLevel.value.userCount} 个用户使用该等级，请先调整后再删除`)
    showDeleteLevelDialog.value = false
    deletingLevel.value = null
    return
  }

  submitLoading.value = true
  try {
    await membershipApi.deleteLevel(deletingLevel.value.id)
    MessagePlugin.success('删除成功')
    showDeleteLevelDialog.value = false
    fetchLevels()
  } catch (error: any) {
    MessagePlugin.error(error.response?.data?.message || '删除失败')
  } finally {
    submitLoading.value = false
    deletingLevel.value = null
  }
}

onMounted(() => {
  fetchLevels()
  fetchBenefits()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.level-card {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.level-icon {
  font-size: 24px;
}

.level-name {
  font-size: 16px;
  font-weight: 600;
}

.level-code {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.level-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.benefits-section {
  margin-bottom: 16px;
}

.benefits-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.benefit-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.benefit-name {
  color: #333;
}

.benefit-value {
  color: #0052d9;
  font-weight: 500;
}

.no-benefit {
  padding: 12px;
  text-align: center;
  color: #888;
  font-size: 13px;
}

.level-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
}

.user-count {
  font-size: 13px;
  color: #888;
}

.benefits-config {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.config-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.configured-benefits {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-name {
  flex: 1;
  font-size: 13px;
}

.config-input {
  width: 100px;
}

.config-switch {
  width: 100px;
}

.config-display-input {
  width: 160px;
}

.add-benefit-section {
  display: flex;
  gap: 8px;
}

.add-select {
  width: 150px;
}

.add-input {
  width: 100px;
}

.add-display-input {
  width: 160px;
}

.delete-content {
  padding: 8px 0;
}

.delete-warning {
  margin-top: 12px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 4px;
  color: #ed7b2f;
}
</style>