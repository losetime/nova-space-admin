<template>
  <div class="dashboard-container">
    <!-- 顶部统计卡片 -->
    <t-row :gutter="16" class="dashboard-top">
      <t-col v-for="(item, index) in statsList" :key="item.title" :span="3">
        <t-card
          :title="item.title"
          :bordered="false"
          class="dashboard-item"
          :class="{ 'dashboard-item--main': index === 0 }"
        >
          <div class="dashboard-item-top">
            <span class="dashboard-item-number">{{ item.value }}</span>
          </div>
          <div class="dashboard-item-left">
            <span class="dashboard-item-icon" :style="{ background: item.bgColor }">
              <component :is="item.icon" :style="{ color: item.iconColor }" />
            </span>
          </div>
          <template #footer>
            <div class="dashboard-item-bottom">
              <div class="dashboard-item-block">
                <span>{{ item.subtitle }}</span>
              </div>
              <t-icon name="chevron-right" />
            </div>
          </template>
        </t-card>
      </t-col>
    </t-row>

    <!-- 中部图表区 -->
    <t-row :gutter="16" class="dashboard-middle">
      <t-col :span="9">
        <t-card title="数据趋势" :bordered="false" class="dashboard-chart-card">
          <div class="chart-container" ref="lineChartRef"></div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card title="分类统计" :bordered="false" class="dashboard-chart-card">
          <div class="chart-container pie-chart" ref="pieChartRef"></div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 底部快捷操作 -->
    <t-card title="快捷操作" :bordered="false" class="dashboard-actions">
      <t-space size="large">
        <t-button theme="primary" @click="$router.push('/articles/create')">
          <template #icon><AddIcon /></template>
          新建科普
        </t-button>
        <t-button theme="primary" @click="$router.push('/intelligence/create')">
          <template #icon><AddIcon /></template>
          新建情报
        </t-button>
        <t-button variant="outline" @click="$router.push('/feedback')">
          <template #icon><ChatIcon /></template>
          查看反馈
        </t-button>
        <t-button variant="outline" @click="$router.push('/users')">
          <template #icon><UserIcon /></template>
          用户管理
        </t-button>
      </t-space>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, shallowRef, markRaw } from 'vue'
import { FileTxtIcon, LightbulbIcon, UserIcon, ChatIcon, AddIcon } from 'tdesign-icons-vue-next'
import { articleApi, intelligenceApi, userApi, feedbackApi } from '@/api'
import * as echarts from 'echarts'

const lineChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
const lineChart = shallowRef<echarts.ECharts>()
const pieChart = shallowRef<echarts.ECharts>()

const stats = reactive({
  articles: 0,
  intelligences: 0,
  users: 0,
  feedbacks: 0,
})

const statsList = computed(() => [
  {
    title: '科普总数',
    value: stats.articles,
    subtitle: '科普文章统计',
    icon: markRaw(FileTxtIcon),
    bgColor: 'rgba(0, 82, 217, 0.1)',
    iconColor: '#0052D9',
  },
  {
    title: '情报总数',
    value: stats.intelligences,
    subtitle: '情报内容统计',
    icon: markRaw(LightbulbIcon),
    bgColor: 'rgba(168, 85, 247, 0.1)',
    iconColor: '#A855F7',
  },
  {
    title: '用户总数',
    value: stats.users,
    subtitle: '注册用户统计',
    icon: markRaw(UserIcon),
    bgColor: 'rgba(16, 185, 129, 0.1)',
    iconColor: '#10B981',
  },
  {
    title: '反馈总数',
    value: stats.feedbacks,
    subtitle: '用户反馈统计',
    icon: markRaw(ChatIcon),
    bgColor: 'rgba(249, 115, 22, 0.1)',
    iconColor: '#F97316',
  },
])

import { computed } from 'vue'

function initLineChart() {
  if (!lineChartRef.value) return
  lineChart.value = echarts.init(lineChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '科普',
        type: 'line',
        smooth: true,
        data: [12, 15, 18, 22, 25, 28, 30],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 82, 217, 0.3)' },
            { offset: 1, color: 'rgba(0, 82, 217, 0.05)' },
          ]),
        },
        lineStyle: { color: '#0052D9' },
        itemStyle: { color: '#0052D9' },
      },
      {
        name: '情报',
        type: 'line',
        smooth: true,
        data: [8, 12, 15, 18, 20, 22, 25],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(168, 85, 247, 0.3)' },
            { offset: 1, color: 'rgba(168, 85, 247, 0.05)' },
          ]),
        },
        lineStyle: { color: '#A855F7' },
        itemStyle: { color: '#A855F7' },
      },
    ],
  }
  lineChart.value.setOption(option)
}

function initPieChart() {
  if (!pieChartRef.value) return
  pieChart.value = echarts.init(pieChartRef.value)
  const option = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: '5%',
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: stats.articles, name: '科普', itemStyle: { color: '#0052D9' } },
          { value: stats.intelligences, name: '情报', itemStyle: { color: '#A855F7' } },
          { value: stats.users, name: '用户', itemStyle: { color: '#10B981' } },
          { value: stats.feedbacks, name: '反馈', itemStyle: { color: '#F97316' } },
        ],
      },
    ],
  }
  pieChart.value.setOption(option)
}

onMounted(async () => {
  try {
    const [articlesRes, intelligencesRes, usersRes, feedbacksRes] = await Promise.all([
      articleApi.getList({ limit: 1 }),
      intelligenceApi.getList({ limit: 1 }),
      userApi.getList({ limit: 1 }),
      feedbackApi.getList({ limit: 1 }),
    ])
    stats.articles = articlesRes.data.total
    stats.intelligences = intelligencesRes.data.total
    stats.users = usersRes.data.total
    stats.feedbacks = feedbacksRes.data.total

    // 初始化图表
    initLineChart()
    initPieChart()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: var(--td-bg-color-page);
  margin: -24px;
  min-height: calc(100vh - 64px - 48px - 48px);
}

.dashboard-container > :deep(*) {
  position: relative;
  z-index: 1;
}

.dashboard-top {
  margin-bottom: 16px;
}

.dashboard-item {
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-item :deep(.t-card__header) {
  padding: 0;
}

.dashboard-item :deep(.t-card__footer) {
  padding: 0;
}

.dashboard-item :deep(.t-card__title) {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.dashboard-item :deep(.t-card__body) {
  padding: 0;
  margin-top: 8px;
  margin-bottom: 16px;
  position: relative;
}

.dashboard-item--main {
  background: var(--td-brand-color);
}

.dashboard-item--main :deep(.t-card__title),
.dashboard-item--main .dashboard-item-number,
.dashboard-item--main .dashboard-item-bottom {
  color: #fff;
}

.dashboard-item--main .dashboard-item-block {
  color: rgba(255, 255, 255, 0.7);
}

.dashboard-item-top {
  display: flex;
  align-items: flex-start;
}

.dashboard-item-number {
  font-size: 28px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.dashboard-item-left {
  position: absolute;
  right: 0;
  top: 0;
}

.dashboard-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 24px;
}

.dashboard-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-item-block {
  font-size: 14px;
  color: var(--td-text-color-placeholder);
}

.dashboard-middle {
  margin-bottom: 16px;
}

.dashboard-chart-card {
  height: 360px;
}

.dashboard-chart-card :deep(.t-card__header) {
  padding: 16px 24px 0;
}

.dashboard-chart-card :deep(.t-card__body) {
  padding: 16px 24px;
  height: calc(100% - 60px);
}

.chart-container {
  width: 100%;
  height: 100%;
}

.pie-chart {
  max-width: 280px;
  margin: 0 auto;
}

.dashboard-actions {
  padding: 24px;
}

.dashboard-actions :deep(.t-card__header) {
  padding: 0 0 16px;
}
</style>