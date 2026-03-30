-- 更新 satellite_metadata 表中 DISCOS 相关字段的长度限制
-- 用于存储 ESA DISCOS 返回的较长值
-- 执行时间：2026-03-30
--
-- 实测数据（15 颗卫星）表明：只有 shape 字段超长（最大 24 字符），
-- 其他字段如 cosparId(10)、objectClass(29)、mission(25)、operator(47) 都在限制范围内

-- shape: 卫星形状描述，从 20 增加到 100
-- 示例值："Hex Cyl + 2 Pan + 1 Dish" (24 字符)
ALTER TABLE satellite_metadata
ALTER COLUMN shape TYPE VARCHAR(100);
