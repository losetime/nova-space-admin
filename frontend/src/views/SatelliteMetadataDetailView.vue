<template>
  <div class="page-container">
    <div class="flex items-center mb-4">
      <t-button theme="default" variant="outline" @click="$router.push('/satellite-metadata')">
        <template #icon><ArrowLeftIcon /></template>
        返回列表
      </t-button>
      <h2 class="text-xl font-bold ml-4">卫星元数据详情</h2>
    </div>

    <div v-if="loading" class="loading-container">
      <t-loading text="加载中..." />
    </div>

    <div v-else-if="metadata" class="detail-content">
      <t-card title="基本信息" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="NORAD ID">{{ metadata.noradId }}</t-descriptions-item>
          <t-descriptions-item label="名称">{{ metadata.name || '-' }}</t-descriptions-item>
          <t-descriptions-item label="COSPAR ID">{{ metadata.cosparId || '-' }}</t-descriptions-item>
          <t-descriptions-item label="Object ID">{{ metadata.objectId || '-' }}</t-descriptions-item>
          <t-descriptions-item label="别名">{{ metadata.altName || '-' }}</t-descriptions-item>
          <t-descriptions-item label="对象类型">{{ metadata.objectType || '-' }}</t-descriptions-item>
          <t-descriptions-item label="状态">{{ metadata.status || '-' }}</t-descriptions-item>
          <t-descriptions-item label="国家代码">{{ metadata.countryCode || '-' }}</t-descriptions-item>
          <t-descriptions-item label="对象类别">{{ metadata.objectClass || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="发射信息" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="发射日期">{{ metadata.launchDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="稳定日期">{{ metadata.stableDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="_decay日期">{{ metadata.decayDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="预测_decay日期">{{ metadata.predDecayDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射场">{{ metadata.launchSite || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射工位">{{ metadata.launchPad || '-' }}</t-descriptions-item>
          <t-descriptions-item label="运载火箭">{{ metadata.launchVehicle || '-' }}</t-descriptions-item>
          <t-descriptions-item label="航班号">{{ metadata.flightNo || '-' }}</t-descriptions-item>
          <t-descriptions-item label="COSPAR发射号">{{ metadata.cosparLaunchNo || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射失败">{{ metadata.launchFailure ? '是' : '否' }}</t-descriptions-item>
          <t-descriptions-item label="发射场名称">{{ metadata.launchSiteName || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="轨道参数" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="周期 (分钟)">
            {{ metadata.period !== null ? metadata.period?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="倾角 (度)">
            {{ metadata.inclination !== null ? metadata.inclination?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="远地点 (km)">
            {{ metadata.apogee !== null ? metadata.apogee?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="近地点 (km)">
            {{ metadata.perigee !== null ? metadata.perigee?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="偏心率">
            {{ metadata.eccentricity !== null ? metadata.eccentricity?.toFixed(7) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="升交点赤经 (度)">
            {{ metadata.raan !== null ? metadata.raan?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="近地点幅角 (度)">
            {{ metadata.argOfPerigee !== null ? metadata.argOfPerigee?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="TLE历元">{{ metadata.tleEpoch || '-' }}</t-descriptions-item>
          <t-descriptions-item label="TLE年龄 (天)">
            {{ metadata.tleAge !== null ? metadata.tleAge : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="首次历元">{{ metadata.firstEpoch || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="物理特性" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="RCS">{{ metadata.rcs || '-' }}</t-descriptions-item>
          <t-descriptions-item label="标准星等">
            {{ metadata.stdMag !== null ? metadata.stdMag?.toFixed(2) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="形状">{{ metadata.shape || '-' }}</t-descriptions-item>
          <t-descriptions-item label="尺寸">{{ metadata.dimensions || '-' }}</t-descriptions-item>
          <t-descriptions-item label="展开跨度 (m)">
            {{ metadata.span !== null ? metadata.span?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="长度 (m)">
            {{ metadata.length !== null ? metadata.length?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="直径 (m)">
            {{ metadata.diameter !== null ? metadata.diameter?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="干质量 (kg)">
            {{ metadata.dryMass !== null ? metadata.dryMass?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="发射质量 (kg)">
            {{ metadata.launchMass !== null ? metadata.launchMass?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="材料组成">{{ metadata.materialComposition || '-' }}</t-descriptions-item>
          <t-descriptions-item label="颜色">{{ metadata.color || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="电气与通信系统" :bordered="false" class="mb-4">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="电源系统">{{ metadata.power || '-' }}</t-descriptions-item>
          <t-descriptions-item label="推进系统">{{ metadata.motor || '-' }}</t-descriptions-item>
          <t-descriptions-item label="ADCS">{{ metadata.adcs || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射频率">{{ metadata.transmitterFrequencies || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="运营商与制造商" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="运营商">{{ metadata.operator || '-' }}</t-descriptions-item>
          <t-descriptions-item label="制造商">{{ metadata.manufacturer || '-' }}</t-descriptions-item>
          <t-descriptions-item label="承包商">{{ metadata.contractor || '-' }}</t-descriptions-item>
          <t-descriptions-item label="总线">{{ metadata.bus || '-' }}</t-descriptions-item>
          <t-descriptions-item label="构型">{{ metadata.configuration || '-' }}</t-descriptions-item>
          <t-descriptions-item label="平台">{{ metadata.platform || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="任务信息" :bordered="false" class="mb-4">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="任务">{{ metadata.mission || '-' }}</t-descriptions-item>
          <t-descriptions-item label="用途">{{ metadata.purpose || '-' }}</t-descriptions-item>
          <t-descriptions-item label="有效载荷">{{ metadata.payload || '-' }}</t-descriptions-item>
          <t-descriptions-item label="设备">{{ metadata.equipment || '-' }}</t-descriptions-item>
          <t-descriptions-item label="设计寿命">{{ metadata.lifetime || '-' }}</t-descriptions-item>
          <t-descriptions-item label="异常标志">{{ metadata.anomalyFlags || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="编队与星座" :bordered="false" class="mb-4">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="星座名称">{{ metadata.constellationName || '-' }}</t-descriptions-item>
          <t-descriptions-item label="相关卫星">{{ metadata.relatedSatellites || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="数据来源" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="KeepTrack">
            <t-tag :theme="metadata.hasKeepTrackData ? 'success' : 'default'" variant="light">
              {{ metadata.hasKeepTrackData ? '有数据' : '无' }}
            </t-tag>
          </t-descriptions-item>
          <t-descriptions-item label="Space-Track">
            <t-tag :theme="metadata.hasSpaceTrackData ? 'success' : 'default'" variant="light">
              {{ metadata.hasSpaceTrackData ? '有数据' : '无' }}
            </t-tag>
          </t-descriptions-item>
          <t-descriptions-item label="ESA DISCOS">
            <t-tag :theme="metadata.hasDiscosData ? 'success' : 'default'" variant="light">
              {{ metadata.hasDiscosData ? '有数据' : '无' }}
            </t-tag>
          </t-descriptions-item>
        </t-descriptions>
        <div v-if="metadata.sources" class="mt-4">
          <div class="field-label">数据来源说明</div>
          <div class="field-content">{{ metadata.sources }}</div>
        </div>
        <div v-if="metadata.referenceUrls" class="mt-4">
          <div class="field-label">参考链接</div>
          <div class="field-content">{{ metadata.referenceUrls }}</div>
        </div>
      </t-card>

      <t-card title="重大事件" :bordered="false" class="mb-4">
        <div class="field-content">{{ metadata.majorEvents || '暂无记录' }}</div>
      </t-card>

      <t-card title="摘要" :bordered="false" class="mb-4">
        <div class="field-content">{{ metadata.summary || '暂无摘要' }}</div>
      </t-card>

      <t-card title="系统信息" :bordered="false">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="创建时间">{{ metadata.createdAt }}</t-descriptions-item>
          <t-descriptions-item label="更新时间">{{ metadata.updatedAt }}</t-descriptions-item>
          <t-descriptions-item label="最后审核">{{ metadata.lastReviewed || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>
    </div>

    <div v-else class="empty-container">
      <t-empty description="未找到该卫星元数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { ArrowLeftIcon } from 'tdesign-icons-vue-next'
import { satelliteMetadataApi, type SatelliteMetadataDetail } from '@/api'

const route = useRoute()
const loading = ref(false)
const metadata = ref<SatelliteMetadataDetail | null>(null)

async function fetchMetadataDetail() {
  const noradId = route.params.noradId as string
  if (!noradId) {
    MessagePlugin.error('无效的 NORAD ID')
    return
  }

  loading.value = true
  try {
    const res = await satelliteMetadataApi.getOne(noradId)
    if (res.success && res.data) {
      metadata.value = res.data
    } else {
      metadata.value = null
    }
  } catch (error) {
    MessagePlugin.error('获取卫星元数据详情失败')
    metadata.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMetadataDetail()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 3px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-4 {
  margin-left: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
  margin-bottom: 8px;
}

.field-content {
  font-size: 14px;
  color: var(--td-text-color-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>