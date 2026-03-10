# 实现任务拆解 — 仓库库存盘点模块

## 任务总览

共 **8 个阶段 / 28 个任务**，预计总复杂度 **~160 Story Points**（1 SP ≈ 半天工作量）

### 依赖关系概览

```
Phase 1: 项目基础
    ↓
Phase 2: 领域层 & 数据层
    ↓
Phase 3: Provider 接口 & Mock
    ↓
Phase 4: 业务服务层
    ↓
Phase 5: Web 管理端        Phase 6: Mobile PWA（可并行）
    ↓                          ↓
Phase 7: AI 决策引擎（依赖 Phase 4）
    ↓
Phase 8: 集成测试 & 优化
```

---

## Phase 1: 项目基础设施（8 SP）

### Task 1.1: 项目初始化
**复杂度：** 3 SP  
**依赖：** 无  
**完成标准：**
- [ ] Vite + React + TypeScript 项目初始化完成
- [ ] 安装依赖：antd, antd-mobile, dexie, zustand, react-router-dom, html5-qrcode, vite-plugin-pwa
- [ ] tsconfig.json 配置路径别名（@domain, @providers, @services, @stores, @web, @mobile, @shared）
- [ ] ESLint + Prettier 配置
- [ ] 项目目录结构按 design.md 创建完毕
- [ ] `npm run dev` 可正常启动

### Task 1.2: PWA 配置
**复杂度：** 3 SP  
**依赖：** Task 1.1  
**完成标准：**
- [ ] manifest.json 配置完成（name, icons, theme_color, start_url, display: standalone）
- [ ] vite-plugin-pwa 配置 Service Worker（precache 静态资源）
- [ ] 图标准备（192x192, 512x512）
- [ ] 安装到桌面功能可用
- [ ] 离线访问基础页面正常

### Task 1.3: 路由与布局
**复杂度：** 2 SP  
**依赖：** Task 1.1  
**完成标准：**
- [ ] React Router 配置 Web 端路由（`/` 前缀）和 Mobile 端路由（`/m/` 前缀）
- [ ] AdminLayout 组件：侧边栏导航 + 顶部栏 + 内容区
- [ ] MobileLayout 组件：顶部导航栏 + 内容区 + 底部安全区
- [ ] 根据 URL 自动选择 Layout（`/m/*` → MobileLayout）
- [ ] 404 页面

---

## Phase 2: 领域层 & 数据层（12 SP）

### Task 2.1: 领域模型定义
**复杂度：** 3 SP  
**依赖：** Task 1.1  
**完成标准：**
- [ ] 所有实体 TypeScript interface 定义（CountPlan, CountTask, CountDetail, VarianceRecord, InventorySnapshot, SnapshotItem）
- [ ] 所有枚举定义（CountPlanStatus, CountTaskStatus, CountType, ScanMethod, Resolution 等）
- [ ] 所有值对象定义（LocationInfo, ProductInfo, VarianceSummary, AIDecisionContext）
- [ ] 领域事件类型定义
- [ ] 统一 export（index.ts）

### Task 2.2: 数据库层（Dexie.js）
**复杂度：** 4 SP  
**依赖：** Task 2.1  
**完成标准：**
- [ ] Dexie 数据库定义（所有表 + 索引）
- [ ] 数据库迁移机制（version 管理）
- [ ] Repository 类实现：
  - CountPlanRepo: CRUD + 按状态筛选 + 分页
  - CountTaskRepo: CRUD + 按 planId/assigneeId/status 筛选
  - CountDetailRepo: CRUD + 按 taskId/locationId 筛选 + 批量写入
  - SnapshotRepo: CRUD + 按 planId 查询
  - VarianceRecordRepo: CRUD + 按 planId 查询
  - SyncQueueRepo: 队列操作（enqueue, dequeue, peek, markSynced）
- [ ] 每个 Repo 的基本操作可通过控制台验证

### Task 2.3: 状态管理（Zustand）
**复杂度：** 3 SP  
**依赖：** Task 2.1, Task 2.2  
**完成标准：**
- [ ] countPlanStore: 当前计划列表、活跃计划、CRUD actions
- [ ] countTaskStore: 当前任务列表、我的任务（Mobile）、进度统计
- [ ] authStore: 当前用户、登录/登出
- [ ] syncStore: 同步状态（pendingCount, lastSyncTime, isSyncing）
- [ ] uiStore: 网络状态、当前设备类型、通知队列

### Task 2.4: 工具函数
**复杂度：** 2 SP  
**依赖：** Task 2.1  
**完成标准：**
- [ ] idGenerator: UUID 生成、业务编号生成（CP-YYYYMMDD-NNN, CT-...）
- [ ] formatters: 日期格式化、数量格式化、百分比格式化
- [ ] variance: 差异计算（数量差、百分比差、金额差）
- [ ] validators: 计划数据校验、导入数据校验

---

## Phase 3: Provider 接口 & Mock 实现（10 SP）

### Task 3.1: Provider 接口定义
**复杂度：** 2 SP  
**依赖：** Task 2.1  
**完成标准：**
- [ ] IInventoryProvider interface（getInventory）
- [ ] ILocationProvider interface（getLocations）
- [ ] IProductProvider interface（getProducts, getProductByBarcode, searchProducts）
- [ ] IAuthProvider interface（login, getCurrentUser, getUsers）
- [ ] IAdjustmentPublisher interface（publishResult）
- [ ] IAIDecisionProvider interface（analyze）
- [ ] ProviderRegistry 实现（register, get）

### Task 3.2: Mock 数据准备
**复杂度：** 3 SP  
**依赖：** Task 3.1  
**完成标准：**
- [ ] locations.json: 20 个库位（A/B 两个区域，包含不同类型）
- [ ] products.json: 30 个产品（多品类、不同价格段、含条码）
- [ ] inventory.json: ~100 条库存记录（每个库位 3-8 种商品）
- [ ] users.json: 4 个用户（1 管理员 + 3 操作员）
- [ ] 数据逻辑自洽（库存引用的库位和产品存在）

### Task 3.3: Mock Provider 实现
**复杂度：** 5 SP  
**依赖：** Task 3.1, Task 3.2  
**完成标准：**
- [ ] MockInventoryProvider: 从 JSON 加载库存，支持按 warehouseId 筛选
- [ ] MockLocationProvider: 从 JSON 加载库位
- [ ] MockProductProvider: 从 JSON 加载产品，支持条码查询和关键字搜索
- [ ] MockAuthProvider: 本地用户认证（username 匹配即可）
- [ ] MockAdjustmentPublisher: console.log + 保存到 IndexedDB
- [ ] ProviderRegistry 默认注册所有 Mock
- [ ] 模拟延迟（200-500ms）模拟真实网络

---

## Phase 4: 业务服务层（20 SP）

### Task 4.1: CountPlanService
**复杂度：** 5 SP  
**依赖：** Phase 2, Phase 3  
**完成标准：**
- [ ] createPlan(): 创建计划，生成编号，状态 DRAFT
- [ ] updatePlan(): 更新计划（仅 DRAFT 可修改）
- [ ] markReady(): DRAFT → READY，验证必填字段
- [ ] freezeInventory(): READY → FROZEN，调用 SnapshotService 生成快照
- [ ] cancelPlan(): 取消计划，级联取消任务
- [ ] completePlan(): REVIEWING → COMPLETED，调用 ReportService 生成报告
- [ ] triggerRecount(): REVIEWING → IN_PROGRESS，生成新一轮任务
- [ ] 状态转换校验（非法转换抛异常）

### Task 4.2: SnapshotService
**复杂度：** 3 SP  
**依赖：** Phase 2, Phase 3  
**完成标准：**
- [ ] createSnapshot(): 调用 IInventoryProvider，生成快照和快照明细
- [ ] 快照写入 IndexedDB
- [ ] 统计信息计算（totalLocations, totalProducts, totalQuantity）
- [ ] 快照生成后不可修改

### Task 4.3: CountTaskService
**复杂度：** 5 SP  
**依赖：** Task 4.2  
**完成标准：**
- [ ] generateTasks(): 根据快照按 zone/aisle 拆分任务，生成 CountDetail
- [ ] assignTask(): 分配任务给操作员
- [ ] batchAssign(): 批量分配
- [ ] startTask(): ASSIGNED → IN_PROGRESS
- [ ] pauseTask() / resumeTask(): 暂停/恢复
- [ ] submitTask(): 提交校验（所有 detail 已处理）→ SUBMITTED
- [ ] getMyTasks(): 按 assigneeId 查询
- [ ] getTaskProgress(): 计算进度统计

### Task 4.4: VarianceAnalysisService
**复杂度：** 4 SP  
**依赖：** Task 4.1, Task 4.3  
**完成标准：**
- [ ] analyzeVariance(): 比对盘点数据与快照，生成 VarianceRecord
- [ ] 计算差异：数量差、百分比差、金额差
- [ ] 分类：无差异 / 在容忍度内 / 超出容忍度
- [ ] 生成 VarianceSummary 汇总统计
- [ ] 多轮对比：计算复盘后差异收敛情况
- [ ] 自动触发 AI 决策分析

### Task 4.5: SyncService
**复杂度：** 3 SP  
**依赖：** Task 2.2  
**完成标准：**
- [ ] enqueueChange(): 写入同步队列
- [ ] pushPending(): 推送所有待同步项
- [ ] 去重：通过 clientSyncId 防止重复写入
- [ ] 重试：失败后指数退避重试（最多 3 次）
- [ ] 冲突检测和记录
- [ ] 监听 navigator.onLine 事件，在线时自动同步
- [ ] 同步进度事件（供 UI 显示）

---

## Phase 5: Web 管理端（30 SP）

### Task 5.1: Dashboard 页面
**复杂度：** 3 SP  
**依赖：** Phase 4  
**完成标准：**
- [ ] 统计卡片：进行中、待审核、已完成、总计
- [ ] 活跃盘点计划列表（带进度条）
- [ ] 近期完成列表（带准确率）
- [ ] 页面响应式布局

### Task 5.2: 盘点计划列表 & 创建
**复杂度：** 5 SP  
**依赖：** Task 4.1  
**完成标准：**
- [ ] PlanList: 表格展示所有计划，支持状态筛选、排序、分页
- [ ] PlanCreate: 表单创建计划（所有字段、校验、默认值）
- [ ] 状态 Badge 颜色区分
- [ ] 列表中可快速操作（删除草稿、取消）

### Task 5.3: 盘点计划详情页
**复杂度：** 5 SP  
**依赖：** Task 4.1, Task 4.2  
**完成标准：**
- [ ] 计划基本信息展示
- [ ] 状态流程步骤条（Step 组件）
- [ ] 操作按钮根据状态动态显示（就绪、冻结、生成任务等）
- [ ] 快照信息展示
- [ ] Tab 切换：任务管理 / 差异分析 / AI 决策 / 报告

### Task 5.4: 任务管理页
**复杂度：** 5 SP  
**依赖：** Task 4.3  
**完成标准：**
- [ ] 任务列表表格（状态、操作员、库位范围、进度）
- [ ] 任务分配：选择操作员弹窗，支持批量分配
- [ ] 任务进度实时展示（已完成/总数）
- [ ] 重新分配功能
- [ ] 按状态/操作员/区域筛选

### Task 5.5: 差异分析页
**复杂度：** 5 SP  
**依赖：** Task 4.4  
**完成标准：**
- [ ] 差异汇总卡片（准确率、总差异金额、超差项数）
- [ ] 差异明细表格（库位、产品、系统量、盘点量、差异量/百分比/金额）
- [ ] 颜色标识（绿/黄/红）
- [ ] 排序和筛选
- [ ] 多轮次数据对比视图
- [ ] 可点击查看某项的详细盘点记录（含照片）

### Task 5.6: AI 决策 & 审批页
**复杂度：** 4 SP  
**依赖：** Phase 7 (AI Engine)  
**完成标准：**
- [ ] AI 建议展示（推荐动作、置信度条、决策理由）
- [ ] 建议复盘目标列表
- [ ] 管理员操作按钮：批准完成 / 触发全量复盘 / 触发部分复盘 / 手动选择
- [ ] 手动选择复盘范围的交互（多选库位）
- [ ] 操作确认弹窗

### Task 5.7: 最终报告页
**复杂度：** 3 SP  
**依赖：** Task 4.4  
**完成标准：**
- [ ] 盘点汇总信息
- [ ] 完整差异明细表
- [ ] 审计轨迹（操作日志时间线）
- [ ] 导出 JSON 按钮

---

## Phase 6: Mobile PWA 手持端（35 SP）

### Task 6.1: 登录页
**复杂度：** 2 SP  
**依赖：** Phase 3  
**完成标准：**
- [ ] 用户名输入 + 登录按钮
- [ ] 记住登录状态（LocalStorage）
- [ ] 登录失败提示
- [ ] 登录后跳转任务列表

### Task 6.2: 任务列表页
**复杂度：** 3 SP  
**依赖：** Task 4.3  
**完成标准：**
- [ ] 显示当前操作员的任务（按状态分组）
- [ ] 每个任务卡片：编号、库位范围、状态、进度
- [ ] 下拉刷新（在线时）
- [ ] 点击进入任务执行

### Task 6.3: 任务执行 — 库位列表
**复杂度：** 3 SP  
**依赖：** Task 6.2  
**完成标准：**
- [ ] 库位列表（按编码排序）
- [ ] 每个库位卡片显示进度（已盘/总数）
- [ ] 状态标识（待盘点/进行中/已完成）
- [ ] 整体任务进度条
- [ ] 底部"提交任务"按钮

### Task 6.4: 条码扫描组件
**复杂度：** 5 SP  
**依赖：** Task 1.1  
**完成标准：**
- [ ] 摄像头扫描器（html5-qrcode）集成
- [ ] 支持 1D（EAN-13/UPC）和 2D（QR）条码
- [ ] 扫描框视觉引导（矩形框 + 提示文字）
- [ ] 扫码成功反馈：震动 + 声音 + 视觉
- [ ] 扫码失败反馈和重试提示
- [ ] 外接蓝牙扫码枪支持（监听键盘输入，检测快速连续字符）
- [ ] 手动切换：摄像头扫描 ↔ 手动输入
- [ ] 连续扫码模式开关

### Task 6.5: 库位盘点页（核心）
**复杂度：** 8 SP  
**依赖：** Task 6.4, Task 4.3  
**完成标准：**
- [ ] 顶部显示当前库位信息和进度
- [ ] 扫码区域（Task 6.4 组件）
- [ ] 扫码后显示商品信息（名称、编码、条码）
- [ ] 盲盘模式下隐藏系统数量
- [ ] 数量输入：大号数字键盘 + /-按钮
- [ ] 确认录入按钮（大按钮，适合戴手套操作）
- [ ] 标记异常按钮（输入原因 + 可选数量 + 可选照片）
- [ ] 跳过按钮（输入原因）
- [ ] 已盘点列表（可展开/折叠）
- [ ] 操作撤销（未提交前可修改已录入数据）
- [ ] 所有数据实时写入 IndexedDB
- [ ] 数量差异较大时二次确认弹窗（>50% 差异提醒）

### Task 6.6: 拍照组件
**复杂度：** 3 SP  
**依赖：** Task 1.1  
**完成标准：**
- [ ] 调用设备摄像头拍照
- [ ] 照片预览和确认
- [ ] 支持多张照片
- [ ] 照片存储到 IndexedDB（Blob/Base64）
- [ ] 照片删除
- [ ] 照片与 CountDetail 关联

### Task 6.7: 任务汇总与提交
**复杂度：** 3 SP  
**依赖：** Task 6.5  
**完成标准：**
- [ ] 汇总统计：已盘点/跳过/异常/未处理
- [ ] 未处理项警告（不允许提交或强制确认）
- [ ] 提交确认弹窗
- [ ] 提交后状态变更（写入 IndexedDB + SyncQueue）
- [ ] 离线时标记"待同步"

### Task 6.8: 网络状态与同步
**复杂度：** 5 SP  
**依赖：** Task 4.5  
**完成标准：**
- [ ] NetworkIndicator 组件（顶部常驻，显示在线/离线状态）
- [ ] SyncBadge 组件（显示待同步条数）
- [ ] SyncStatus 页面：同步历史、待同步列表、手动同步按钮
- [ ] 自动同步：在线时每 30 秒检查一次
- [ ] 手动同步按钮
- [ ] 同步进度和结果 toast 通知
- [ ] 同步失败重试机制

### Task 6.9: 手持端 UI 优化
**复杂度：** 3 SP  
**依赖：** Task 6.5  
**完成标准：**
- [ ] 大按钮（最小 48px 高度，适合戴手套操作）
- [ ] 高对比度颜色方案（仓库光线差）
- [ ] 字体大小优化（最小 16px）
- [ ] 触摸反馈（按压效果 + 震动）
- [ ] 横屏/竖屏自适应
- [ ] 安全区域适配（底部、顶部 notch）

---

## Phase 7: AI 决策引擎（8 SP）

### Task 7.1: 规则引擎实现
**复杂度：** 5 SP  
**依赖：** Task 4.4  
**完成标准：**
- [ ] AIDecisionService 完整实现（5 条决策规则）
- [ ] 可配置参数（阈值通过配置传入）
- [ ] 输入校验
- [ ] 决策结果包含完整推理过程（reasoning 字段）
- [ ] 复盘目标推荐（哪些库位/商品需要复盘）
- [ ] 多轮收敛分析（对比前后轮差异变化）
- [ ] 单元测试覆盖所有规则分支

### Task 7.2: AI 接口预留
**复杂度：** 3 SP  
**依赖：** Task 7.1  
**完成标准：**
- [ ] IAIDecisionProvider interface 定义
- [ ] RuleBasedDecisionProvider 实现（包装 Task 7.1）
- [ ] LLMDecisionProvider 骨架（二期实现，含 prompt 模板设计）
- [ ] ProviderRegistry 注册
- [ ] 切换 Provider 不影响业务逻辑

---

## Phase 8: 集成测试 & 优化（10 SP + 持续）

### Task 8.1: 端到端流程测试
**复杂度：** 5 SP  
**依赖：** Phase 5, 6, 7  
**完成标准：**
- [ ] 完整流程走通：创建计划 → 冻结 → 生成任务 → 分配 → 手持端执行 → 提交 → 差异分析 → AI 决策 → 完成
- [ ] 复盘流程走通：AI 建议复盘 → 生成二次任务 → 执行 → 完成
- [ ] 离线场景测试：断网操作 → 恢复网络 → 自动同步
- [ ] 异常场景测试：未知商品、扫码失败、空库位
- [ ] 边界测试：大量数据（1000 条 detail）

### Task 8.2: 性能优化
**复杂度：** 3 SP  
**依赖：** Task 8.1  
**完成标准：**
- [ ] 首页加载 < 3 秒
- [ ] 扫码识别 < 1 秒
- [ ] IndexedDB 批量写入优化（事务合并）
- [ ] 虚拟滚动（长列表）
- [ ] Service Worker 缓存策略验证
- [ ] PWA Lighthouse 评分 > 90

### Task 8.3: README 与文档
**复杂度：** 2 SP  
**依赖：** Task 8.1  
**完成标准：**
- [ ] README.md：项目说明、快速开始、架构概述
- [ ] Provider 对接指南（如何替换 Mock 为真实 API）
- [ ] 部署说明（静态文件部署）
- [ ] 已知限制和二期规划

---

## 任务排序与里程碑

### Milestone 1: 骨架可运行（Phase 1-3）— ~30 SP
目标：项目基础搭建完毕，Mock 数据就绪，可在控制台验证 Provider 和 Repository。

### Milestone 2: 核心流程可演示（Phase 4-5 部分）— ~50 SP
目标：Web 端可以创建计划 → 冻结 → 生成任务 → 查看差异。

### Milestone 3: 手持端可用（Phase 6）— ~35 SP
目标：操作员可在 Mobile PWA 上执行盘点，含离线支持。

### Milestone 4: AI + 完整流程（Phase 7-8）— ~18 SP
目标：AI 决策引擎工作，完整流程端到端走通。

---

## 关键技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| PWA 离线 + IndexedDB 性能 | 大量数据时可能卡顿 | 分页加载、延迟写入、批量事务 |
| 摄像头扫码兼容性 | 不同设备/浏览器表现不一 | 降级方案（手动输入）+ 蓝牙扫码枪 |
| iOS Safari PWA 限制 | Service Worker 行为不一致 | 测试 iOS 主要版本、记录已知限制 |
| IndexedDB 跨 Tab 同步 | Web 和 Mobile 在同一浏览器可能冲突 | 使用 BroadcastChannel API 或 SharedWorker |
| 照片存储（Base64 in IDB） | 大量照片占用空间 | 压缩照片质量、限制每条最多 3 张 |
