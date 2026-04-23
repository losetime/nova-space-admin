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
          <t-descriptions-item label="NORAD ID (norad_id)">{{ metadata.noradId }}</t-descriptions-item>
          <t-descriptions-item label="名称 (name)">{{ metadata.name || '-' }}</t-descriptions-item>
          <t-descriptions-item label="COSPAR ID (cospar_id)">{{ metadata.cosparId || '-' }}</t-descriptions-item>
          <t-descriptions-item label="Object ID (object_id)">{{ metadata.objectId || '-' }}</t-descriptions-item>
          <t-descriptions-item label="别名 (alt_name)">{{ metadata.altName || '-' }}</t-descriptions-item>
          <t-descriptions-item label="对象类型 (object_type)">{{ metadata.objectType || '-' }}</t-descriptions-item>
          <t-descriptions-item label="状态 (status)">{{ metadata.status || '-' }}</t-descriptions-item>
          <t-descriptions-item label="国家代码 (country_code)">{{ metadata.countryCode || '-' }}</t-descriptions-item>
          <t-descriptions-item label="对象类别 (object_class)">{{ metadata.objectClass || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="发射信息" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="发射日期 (launch_date)">{{ metadata.launchDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="稳定日期 (stable_date)">{{ metadata.stableDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="衰减日期 (decay_date)">{{ metadata.decayDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="预测衰减日期 (pred_decay_date)">{{ metadata.predDecayDate || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射地点 (launch_site)">{{ metadata.launchSite || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射工位 (launch_pad)">{{ metadata.launchPad || '-' }}</t-descriptions-item>
          <t-descriptions-item label="运载火箭 (launch_vehicle)">{{ metadata.launchVehicle || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射序号 (flight_no)">{{ metadata.flightNo || '-' }}</t-descriptions-item>
          <t-descriptions-item label="COSPAR发射号 (cospar_launch_no)">{{ metadata.cosparLaunchNo || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射失败 (launch_failure)">{{ metadata.launchFailure ? '是' : '否' }}</t-descriptions-item>
          <t-descriptions-item label="发射场名称 (launch_site_name)">{{ metadata.launchSiteName || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="轨道参数" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="周期分钟 (period)">
            {{ metadata.period !== null ? metadata.period?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="倾角度 (inclination)">
            {{ metadata.inclination !== null ? metadata.inclination?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="远地点km (apogee)">
            {{ metadata.apogee !== null ? metadata.apogee?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="近地点km (perigee)">
            {{ metadata.perigee !== null ? metadata.perigee?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="偏心率 (eccentricity)">
            {{ metadata.eccentricity !== null ? metadata.eccentricity?.toFixed(7) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="升交点赤经度 (raan)">
            {{ metadata.raan !== null ? metadata.raan?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="近地点幅角度 (arg_of_perigee)">
            {{ metadata.argOfPerigee !== null ? metadata.argOfPerigee?.toFixed(4) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="TLE历元 (tle_epoch)">{{ metadata.tleEpoch || '-' }}</t-descriptions-item>
          <t-descriptions-item label="TLE年龄天 (tle_age)">
            {{ metadata.tleAge !== null ? metadata.tleAge : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="首次历元 (first_epoch)">{{ metadata.firstEpoch || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="物理特性" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="RCS (rcs)">{{ metadata.rcs || '-' }}</t-descriptions-item>
          <t-descriptions-item label="标准星等 (std_mag)">
            {{ metadata.stdMag !== null ? metadata.stdMag?.toFixed(2) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="形状 (shape)">{{ metadata.shape || '-' }}</t-descriptions-item>
          <t-descriptions-item label="尺寸 (dimensions)">{{ metadata.dimensions || '-' }}</t-descriptions-item>
          <t-descriptions-item label="展开跨度m (span)">
            {{ metadata.span !== null ? metadata.span?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="长度m (length)">
            {{ metadata.length !== null ? metadata.length?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="直径m (diameter)">
            {{ metadata.diameter !== null ? metadata.diameter?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="干质量kg (dry_mass)">
            {{ metadata.dryMass !== null ? metadata.dryMass?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="发射质量kg (launch_mass)">
            {{ metadata.launchMass !== null ? metadata.launchMass?.toFixed(3) : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="材料组成 (material_composition)">{{ metadata.materialComposition || '-' }}</t-descriptions-item>
          <t-descriptions-item label="颜色 (color)">{{ metadata.color || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="电气与通信系统" :bordered="false" class="mb-4">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="电源系统 (power)">{{ metadata.power || '-' }}</t-descriptions-item>
          <t-descriptions-item label="推进系统 (motor)">{{ metadata.motor || '-' }}</t-descriptions-item>
          <t-descriptions-item label="ADCS (adcs)">{{ metadata.adcs || '-' }}</t-descriptions-item>
          <t-descriptions-item label="发射频率 (transmitter_frequencies)">{{ metadata.transmitterFrequencies || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="运营商与制造商" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="运营商 (operator)">{{ metadata.operator || '-' }}</t-descriptions-item>
          <t-descriptions-item label="制造商 (manufacturer)">{{ metadata.manufacturer || '-' }}</t-descriptions-item>
          <t-descriptions-item label="承包商 (contractor)">{{ metadata.contractor || '-' }}</t-descriptions-item>
          <t-descriptions-item label="总线 (bus)">{{ metadata.bus || '-' }}</t-descriptions-item>
          <t-descriptions-item label="构型 (configuration)">{{ metadata.configuration || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="任务信息" :bordered="false" class="mb-4">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="任务 (mission)">{{ metadata.mission || '-' }}</t-descriptions-item>
          <t-descriptions-item label="用途 (purpose)">{{ metadata.purpose || '-' }}</t-descriptions-item>
          <t-descriptions-item label="有效载荷 (payload)">{{ metadata.payload || '-' }}</t-descriptions-item>
          <t-descriptions-item label="设备 (equipment)">{{ metadata.equipment || '-' }}</t-descriptions-item>
          <t-descriptions-item label="设计寿命 (lifetime)">{{ metadata.lifetime || '-' }}</t-descriptions-item>
          <t-descriptions-item label="异常标志 (anomaly_flags)">{{ metadata.anomalyFlags || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="编队与星座" :bordered="false" class="mb-4">
        <t-descriptions :column="2" bordered>
          <t-descriptions-item label="星座名称 (constellation_name)">{{ metadata.constellationName || '-' }}</t-descriptions-item>
          <t-descriptions-item label="相关卫星 (related_satellites)">{{ metadata.relatedSatellites || '-' }}</t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card title="数据来源" :bordered="false" class="mb-4">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="KeepTrack (has_keeptrack_data)">
            <t-tag :theme="metadata.hasKeepTrackData ? 'success' : 'default'" variant="light">
              {{ metadata.hasKeepTrackData ? '有数据' : '无' }}
            </t-tag>
          </t-descriptions-item>
          <t-descriptions-item label="Space-Track (has_spacetrack_data)">
            <t-tag :theme="metadata.hasSpaceTrackData ? 'success' : 'default'" variant="light">
              {{ metadata.hasSpaceTrackData ? '有数据' : '无' }}
            </t-tag>
          </t-descriptions-item>
          <t-descriptions-item label="ESA DISCOS (has_discos_data)">
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
          <t-descriptions-item label="创建时间 (created_at)">{{ metadata.createdAt }}</t-descriptions-item>
          <t-descriptions-item label="更新时间 (updated_at)">{{ metadata.updatedAt }}</t-descriptions-item>
          <t-descriptions-item label="最后审核 (last_reviewed)">{{ metadata.lastReviewed || '-' }}</t-descriptions-item>
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