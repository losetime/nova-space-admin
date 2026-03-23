<template>
  <div class="dashboard">
    <h2 class="text-2xl font-bold mb-6">仪表盘</h2>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-card-blue">
        <div class="stat-icon">
          <FileTxtIcon />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.articles }}</div>
          <div class="stat-label">科普总数</div>
        </div>
      </div>

      <div class="stat-card stat-card-purple">
        <div class="stat-icon">
          <LightbulbIcon />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.intelligences }}</div>
          <div class="stat-label">情报总数</div>
        </div>
      </div>

      <div class="stat-card stat-card-green">
        <div class="stat-icon">
          <UserIcon />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.users }}</div>
          <div class="stat-label">用户总数</div>
        </div>
      </div>

      <div class="stat-card stat-card-orange">
        <div class="stat-icon">
          <ChatIcon />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.feedbacks }}</div>
          <div class="stat-label">反馈总数</div>
        </div>
      </div>
    </div>

    <!-- 反馈状态统计 -->
    <div class="feedback-status-section" v-if="feedbackStats.length > 0">
      <h3 class="section-title">反馈状态分布</h3>
      <div class="feedback-status-grid">
        <div class="status-item status-pending">
          <span class="status-count">{{ feedbackStats.find(s => s.status === 'pending')?.count || 0 }}</span>
          <span class="status-label">待处理</span>
        </div>
        <div class="status-item status-processing">
          <span class="status-count">{{ feedbackStats.find(s => s.status === 'processing')?.count || 0 }}</span>
          <span class="status-label">处理中</span>
        </div>
        <div class="status-item status-resolved">
          <span class="status-count">{{ feedbackStats.find(s => s.status === 'resolved')?.count || 0 }}</span>
          <span class="status-label">已解决</span>
        </div>
        <div class="status-item status-closed">
          <span class="status-count">{{ feedbackStats.find(s => s.status === 'closed')?.count || 0 }}</span>
          <span class="status-label">已关闭</span>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h3 class="section-title">快捷操作</h3>
      <t-space>
        <t-button theme="primary" size="large" @click="$router.push('/articles/create')">
          <template #icon><AddIcon /></template>
          新建科普
        </t-button>
        <t-button theme="primary" size="large" @click="$router.push('/intelligence/create')">
          <template #icon><AddIcon /></template>
          新建情报
        </t-button>
        <t-button variant="outline" size="large" @click="$router.push('/feedback')">
          <template #icon><ChatIcon /></template>
          查看反馈
        </t-button>
      </t-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { FileTxtIcon, LightbulbIcon, UserIcon, ChatIcon, AddIcon } from 'tdesign-icons-vue-next'
import { articleApi, intelligenceApi, userApi, feedbackApi } from '@/api'

const stats = reactive({
  articles: 0,
  intelligences: 0,
  users: 0,
  feedbacks: 0,
})

const feedbackStats = ref<{ status: string; count: number }[]>([])

onMounted(async () => {
  try {
    const [articlesRes, intelligencesRes, usersRes, feedbacksRes] = await Promise.all([
      articleApi.getList({ limit: 1 }),
      intelligenceApi.getList({ limit: 1 }),
      userApi.getList({ limit: 1 }),
      feedbackApi.getList({ limit: 100 }),
    ])
    stats.articles = articlesRes.data.total
    stats.intelligences = intelligencesRes.data.total
    stats.users = usersRes.data.total
    stats.feedbacks = feedbacksRes.data.total

    const statusCounts: Record<string, number> = {}
    feedbacksRes.data.data.forEach((f: any) => {
      statusCounts[f.status] = (statusCounts[f.status] || 0) + 1
    })
    feedbackStats.value = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 24px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-card-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-purple {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
}

.stat-card-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
  opacity: 0.9;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.feedback-status-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feedback-status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 800px) {
  .feedback-status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #f9fafb;
}

.status-count {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.status-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.status-pending .status-count {
  color: #f97316;
}

.status-processing .status-count {
  color: #3b82f6;
}

.status-resolved .status-count {
  color: #10b981;
}

.status-closed .status-count {
  color: #6b7280;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>