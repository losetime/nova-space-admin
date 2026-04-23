# TODO: 单颗卫星同步功能

## 需求描述

实现单颗卫星同步功能，允许用户通过输入 NORAD ID 单独同步一颗卫星的 KeepTrack 数据。

## 后端

- [ ] 新增 `syncOneKeepTrackDetail(noradId: string)` 方法
  - 位置: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts`
  - 参考现有 `syncKeepTrackDetail` 方法的实现
  - 不创建 TaskRecord，直接获取并保存单颗卫星数据

- [ ] 新增 Controller 端点
  - 位置: `backend-nest/src/modules/satellite-sync/satellite-sync.controller.ts`
  - POST `/satellite-sync/sync-one`
  - 请求体: `{ noradId: string }`
  - 返回: 同步结果（成功/失败及错误信息）

## 前端

- [ ] 新增 API 方法 `syncOneSatellite(noradId: string)`
  - 位置: `frontend/src/api/index.ts`

- [ ] 在 SatelliteSyncView 添加输入框和按钮
  - KeepTrack 同步行添加 NORAD ID 输入框和"同步"按钮
  - 位置: `frontend/src/views/SatelliteSyncView.vue`

## 验收标准

1. 用户输入 NORAD ID 后点击同步，后端能正确获取该卫星的 KeepTrack 数据并保存
2. 如果卫星不存在或 API 返回错误，应显示友好的错误提示
3. 不需要创建 TaskRecord，直接同步并返回结果
