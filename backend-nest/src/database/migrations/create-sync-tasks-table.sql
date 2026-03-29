-- 创建 satellite_sync_tasks 表（如果不存在）
CREATE TABLE IF NOT EXISTS satellite_sync_tasks (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  total INT NOT NULL DEFAULT 0,
  processed INT NOT NULL DEFAULT 0,
  success INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  startedAt TIMESTAMP NOT NULL,
  completedAt TIMESTAMP,
  error TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_satellite_sync_tasks_status ON satellite_sync_tasks(status);
CREATE INDEX IF NOT EXISTS idx_satellite_sync_tasks_type ON satellite_sync_tasks(type);
CREATE INDEX IF NOT EXISTS idx_satellite_sync_tasks_startedAt ON satellite_sync_tasks(startedAt);
