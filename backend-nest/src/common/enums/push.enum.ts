// 推送订阅状态
export enum PushSubscriptionStatus {
  ACTIVE = 'active',     // 活跃
  PAUSED = 'paused',     // 已暂停
  CANCELLED = 'cancelled', // 已取消
}

// 推送触发类型
export enum PushTriggerType {
  SCHEDULED = 'scheduled', // 定时推送
  MANUAL = 'manual',       // 手动推送
}

// 订阅内容类型
export enum SubscriptionType {
  SPACE_WEATHER = 'space_weather', // 空间天气预警
  INTELLIGENCE = 'intelligence',   // 航天情报
}

// 推送记录状态
export enum PushRecordStatus {
  SENT = 'sent',     // 已发送
  FAILED = 'failed', // 发送失败
}