<template>
  <t-dialog
    :visible="visible"
    :width="SYNC_DIALOG_WIDTH"
    :footer="false"
    :top="80"
    :body-style="{ maxHeight: '80vh', overflow: 'auto' }"
    @update:visible="onVisibleChange"
  >
    <template #header>卫星数据同步流程</template>

    <!-- 核心规则 -->
    <section class="sec">
      <h3 class="sec-title">核心规则：不会清库</h3>
      <p class="sec-desc">所有同步均按 <code>norad_id</code> 逐条合并（UPSERT）：</p>
      <ul>
        <li>已存在的卫星 → 更新本次拉取的字段</li>
        <li>新出现的卫星 → 插入新行</li>
        <li>源中消失的卫星 → 历史记录保留</li>
      </ul>
    </section>

    <!-- 两条同步链路 -->
    <section class="sec">
      <h3 class="sec-title">同步链路</h3>
      <div class="flow">
        <div class="flow-head">
          <span class="flow-name">轨道数据（TLE）</span>
          <span class="flow-source">KeepTrack · Space-Track · CelesTrak</span>
        </div>
        <div class="flow-path">来源 → 同步任务 → <code>satellite_tle</code></div>
        <p class="flow-desc">写入 TLE 轨道根数，完成后回填元数据中的 <code>tle_epoch</code> 与轨道根数。</p>
      </div>
      <div class="flow">
        <div class="flow-head">
          <span class="flow-name">卫星元数据</span>
          <span class="flow-source">KeepTrack · Space-Track · ESA DISCOS</span>
        </div>
        <div class="flow-path">来源 → 同步任务 → <code>satellite_metadata</code></div>
        <p class="flow-desc">写入名称、国家、运营方、发射信息等展示字段。</p>
      </div>
    </section>

    <!-- 两表联动 -->
    <section class="sec">
      <h3 class="sec-title">两表联动</h3>
      <ul>
        <li>
          两表以 <code>norad_id</code> 一一对应，外键
          <code>satellite_tle.norad_id → satellite_metadata.norad_id</code>
        </li>
        <li>TLE → 元数据：新卫星由 KeepTrack 自动补建元数据行，每轮回填轨道根数</li>
        <li>元数据 → TLE：Space-Track / CelesTrak 写入前检查元数据存在，不存在则跳过（防孤儿）</li>
        <li>删除元数据会级联删除对应 TLE</li>
      </ul>
    </section>

    <!-- 自动回退 -->
    <section class="sec sec-highlight">
      <h3 class="sec-title">自动回退</h3>
      <p class="sec-desc">
        TLE 定时同步时若 KeepTrack 接口报错，自动改用 <b>Space-Track</b> 完成本次更新，保证数据不中断。
      </p>
    </section>
  </t-dialog>
</template>

<script setup lang="ts">
import { SYNC_DIALOG_WIDTH } from '@/utils/sync'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
}>()

function onVisibleChange(val: boolean) {
  emit('update:visible', val)
}
</script>

<style scoped>
.sec {
  margin-bottom: 20px;
}

.sec-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.sec-desc {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  line-height: 1.6;
}

.sec ul {
  margin: 0;
  padding-left: 18px;
}

.sec li {
  font-size: 13px;
  color: var(--td-text-color-secondary);
  line-height: 1.8;
}

code {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: var(--td-brand-color);
  background: var(--td-bg-color-component);
  padding: 1px 4px;
  border-radius: 3px;
}

.flow {
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 10px;
}

.flow-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.flow-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.flow-source {
  font-size: 12px;
  color: var(--td-text-color-tertiary);
}

.flow-path {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-bottom: 4px;
}

.flow-desc {
  margin: 0;
  font-size: 12px;
  color: var(--td-text-color-tertiary);
  line-height: 1.6;
}

.sec-highlight {
  border-left: 3px solid var(--td-warning-color);
  padding-left: 12px;
}
</style>