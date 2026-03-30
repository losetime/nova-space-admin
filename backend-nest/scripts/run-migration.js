const { Client } = require('pg');

// 从环境变量读取数据库配置
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'nwbd@123',
  database: process.env.DB_NAME || 'nova_space',
});

const migrationSql = `
-- 更新 satellite_metadata 表中 DISCOS 相关字段的长度限制
-- 执行时间：2026-03-30
-- 实测数据（15 颗卫星）表明：只有 shape 字段超长（最大 24 字符）

-- shape: 卫星形状描述，从 20 增加到 100
ALTER TABLE satellite_metadata ALTER COLUMN shape TYPE VARCHAR(100);
`;

async function runMigration() {
  console.log('开始执行数据库迁移...');
  console.log(`数据库配置：${client.user}@${client.host}:${client.port}/${client.database}`);

  try {
    await client.connect();
    console.log('数据库连接成功');

    await client.query(migrationSql);
    console.log('迁移执行成功');
    console.log('已更新以下字段长度：');
    console.log('  - shape: VARCHAR(20) → VARCHAR(100)');
    console.log('');
    console.log('说明：实测 15 颗卫星数据，只有 shape 字段超长（最大 24 字符）');
    console.log('     其他字段（cosparId、objectClass、mission、operator 等）都在限制范围内');
  } catch (error) {
    console.error('迁移失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
