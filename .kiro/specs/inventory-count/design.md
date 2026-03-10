# 系统设计 — 仓库库存盘点模块

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用层                                │
│                                                                 │
│  ┌──────────────────────┐     ┌─────────────────────────────┐  │
│  │  Web 管理端            │     │  Mobile PWA 手持端           │  │
│  │  (React + AntD)       │     │  (React + AntD Mobile)      │  │
│  │                       │     │                              │  │
│  │  · 盘点计划管理        │     │  · 任务列表                  │  │
│  │  · 任务分配            │     │  · 扫码盘点                  │  │
│  │  · 差异分析            │     │  · 离线缓存                  │  │
│  │  · AI 决策展示         │     │  · 数据同步                  │  │
│  │  · 最终报告            │     │  · 拍照取证                  │  │
│  └──────────┬───────────┘     └──────────┬──────────────────┘  │
│             │                            │                      │
│             └────────────┬───────────────┘                      │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │   共享服务层            │                          │
│              │                        │                          │
│              │  · API Client          │                          │
│              │  · State Store         │                          │
│              │  · Offline Manager     │                          │
│              │  · AI Decision Engine  │                          │
│              │  · Sync Engine         │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │   数据层               │                          │
│              │                        │                          │
│              │  · IndexedDB (Dexie)   │                          │
│              │  · LocalStorage        │                          │
│              │  · Service Worker      │                          │
│              └───────────┬───────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   接口适配层 (Providers) │
              │                         │
              │  · IInventoryProvider   │ ←── Mock / 三方 WMS API
              │  · ILocationProvider    │ ←── Mock / 三方 WMS API
              │  · IProductProvider     │ ←── Mock / 三方 ERP API
              │  · IAuthProvider        │ ←── Mock / 三方 SSO
              │  · IAdjustmentPublisher │ ←── Mock / 三方 WMS API
              └─────────────────────────┘
```

### 1.2 一期架构简化

一期为**纯前端应用**，无独立后端服务：
- 数据存储在浏览器 IndexedDB 中
- Provider 接口使用 Mock 实现（内存或本地 JSON）
- Web 端和 Mobile 端共享同一个 Vite 项目，通过路由区分
- 多设备间通过导出/导入 JSON 同步（一期简化方案）

### 1.3 项目结构

```
inventory-count/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # PWA icons
├── src/
│   ├── main.tsx               # 入口
│   ├── App.tsx                # 路由配置
│   ├── vite-env.d.ts
│   │
│   ├── domain/                # 领域层
│   │   ├── entities/          # 实体定义
│   │   │   ├── CountPlan.ts
│   │   │   ├── CountTask.ts
│   │   │   ├── CountDetail.ts
│   │   │   ├── VarianceRecord.ts
│   │   │   ├── InventorySnapshot.ts
│   │   │   └── index.ts
│   │   ├── enums/             # 枚举定义
│   │   │   ├── CountPlanStatus.ts
│   │   │   ├── CountTaskStatus.ts
│   │   │   ├── CountType.ts
│   │   │   └── index.ts
│   │   ├── value-objects/     # 值对象
│   │   │   ├── LocationInfo.ts
│   │   │   ├── ProductInfo.ts
│   │   │   ├── VarianceSummary.ts
│   │   │   └── index.ts
│   │   └── events/            # 领域事件
│   │       └── index.ts
│   │
│   ├── providers/             # 外部接口适配层
│   │   ├── interfaces/        # 接口定义
│   │   │   ├── IInventoryProvider.ts
│   │   │   ├── ILocationProvider.ts
│   │   │   ├── IProductProvider.ts
│   │   │   ├── IAuthProvider.ts
│   │   │   ├── IAdjustmentPublisher.ts
│   │   │   └── index.ts
│   │   ├── mock/              # Mock 实现
│   │   │   ├── MockInventoryProvider.ts
│   │   │   ├── MockLocationProvider.ts
│   │   │   ├── MockProductProvider.ts
│   │   │   ├── MockAuthProvider.ts
│   │   │   ├── MockAdjustmentPublisher.ts
│   │   │   └── data/         # Mock 数据
│   │   │       ├── inventory.json
│   │   │       ├── locations.json
│   │   │       └── products.json
│   │   └── ProviderRegistry.ts  # Provider 注册/切换
│   │
│   ├── services/              # 业务服务层
│   │   ├── CountPlanService.ts
│   │   ├── CountTaskService.ts
│   │   ├── SnapshotService.ts
│   │   ├── VarianceAnalysisService.ts
│   │   ├── AIDecisionService.ts
│   │   ├── SyncService.ts
│   │   └── ReportService.ts
│   │
│   ├── stores/                # 状态管理 (Zustand)
│   │   ├── countPlanStore.ts
│   │   ├── countTaskStore.ts
│   │   ├── authStore.ts
│   │   ├── syncStore.ts
│   │   └── uiStore.ts
│   │
│   ├── db/                    # 数据库层
│   │   ├── database.ts        # Dexie 数据库定义
│   │   ├── migrations.ts      # 数据库迁移
│   │   └── repositories/      # 数据访问
│   │       ├── CountPlanRepo.ts
│   │       ├── CountTaskRepo.ts
│   │       ├── CountDetailRepo.ts
│   │       └── SnapshotRepo.ts
│   │
│   ├── web/                   # Web 管理端页面
│   │   ├── layouts/
│   │   │   └── AdminLayout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PlanList.tsx
│   │   │   ├── PlanCreate.tsx
│   │   │   ├── PlanDetail.tsx
│   │   │   ├── TaskManagement.tsx
│   │   │   ├── VarianceAnalysis.tsx
│   │   │   ├── AIDecisionView.tsx
│   │   │   └── FinalReport.tsx
│   │   └── components/
│   │       ├── PlanForm.tsx
│   │       ├── TaskTable.tsx
│   │       ├── VarianceTable.tsx
│   │       ├── VarianceChart.tsx
│   │       ├── AIRecommendation.tsx
│   │       └── ProgressOverview.tsx
│   │
│   ├── mobile/                # 手持端页面
│   │   ├── layouts/
│   │   │   └── MobileLayout.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── CountExecution.tsx
│   │   │   ├── LocationCount.tsx
│   │   │   ├── ProductScan.tsx
│   │   │   ├── TaskSummary.tsx
│   │   │   └── SyncStatus.tsx
│   │   └── components/
│   │       ├── BarcodeScanner.tsx
│   │       ├── QuantityInput.tsx
│   │       ├── PhotoCapture.tsx
│   │       ├── NetworkIndicator.tsx
│   │       ├── SyncBadge.tsx
│   │       └── LocationCard.tsx
│   │
│   ├── shared/                # 共享组件
│   │   ├── components/
│   │   │   ├── StatusBadge.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useOnlineStatus.ts
│   │   │   ├── useSync.ts
│   │   │   ├── useBarcodeScanner.ts
│   │   │   └── useVibrate.ts
│   │   └── utils/
│   │       ├── variance.ts
│   │       ├── formatters.ts
│   │       └── idGenerator.ts
│   │
│   └── styles/
│       ├── web.css
│       └── mobile.css
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. 数据模型

> 完整数据模型（字段、类型、关系）见 [domain-analysis.md](./domain-analysis.md) 第 3-4 节。

### 2.1 IndexedDB Schema（Dexie.js）

```typescript
import Dexie, { Table } from 'dexie';

class InventoryCountDB extends Dexie {
  countPlans!: Table<CountPlan>;
  countTasks!: Table<CountTask>;
  countDetails!: Table<CountDetail>;
  varianceRecords!: Table<VarianceRecord>;
  inventorySnapshots!: Table<InventorySnapshot>;
  snapshotItems!: Table<SnapshotItem>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('InventoryCountDB');
    this.version(1).stores({
      countPlans: 'id, planNo, status, warehouseId, createdAt',
      countTasks: 'id, taskNo, countPlanId, status, assigneeId, round, [countPlanId+round]',
      countDetails: 'id, countTaskId, countPlanId, locationId, productId, status, clientSyncId, [countTaskId+locationId], [countPlanId+round]',
      varianceRecords: 'id, countPlanId, productId, locationId, resolution, [countPlanId+resolution]',
      inventorySnapshots: 'id, countPlanId, status',
      snapshotItems: 'id, snapshotId, locationId, productId, [snapshotId+locationId]',
      syncQueue: 'id, entityType, entityId, action, status, createdAt',
    });
  }
}
```

### 2.2 同步队列

```typescript
interface SyncQueueItem {
  id: string;
  entityType: 'countDetail' | 'countTask' | 'photo';
  entityId: string;
  action: 'create' | 'update';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
  error?: string;
}
```

---

## 3. API 接口设计

> 一期为纯前端应用，以下 API 定义作为**服务层接口**和**未来后端 API 的规范**。所有操作通过 Service 类直接操作 IndexedDB。

### 3.1 盘点计划 API

#### `POST /api/count-plans` — 创建盘点计划
```typescript
// Request
interface CreateCountPlanRequest {
  name: string;
  type: 'FULL' | 'PARTIAL' | 'CYCLE';
  warehouseId: string;
  scopeDescription?: string;
  plannedStartDate: string;   // ISO 8601
  plannedEndDate?: string;
  varianceTolerancePercent: number;  // 默认 5
  varianceToleranceQty?: number;
  varianceToleranceValue?: number;
  maxRecountRounds: number;   // 默认 2
  isBlindCount: boolean;      // 默认 true
  aiDecisionEnabled: boolean; // 默认 true
  notes?: string;
}

// Response: 201 Created
interface CountPlanResponse {
  id: string;
  planNo: string;
  status: 'DRAFT';
  // ... all CountPlan fields
}
```

#### `GET /api/count-plans` — 获取盘点计划列表
```typescript
// Query Parameters
interface ListCountPlansQuery {
  status?: CountPlanStatus;
  warehouseId?: string;
  page?: number;       // 默认 1
  pageSize?: number;   // 默认 20
  sortBy?: 'createdAt' | 'plannedStartDate';
  sortOrder?: 'asc' | 'desc';
}

// Response: 200 OK
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### `GET /api/count-plans/:id` — 获取盘点计划详情
```typescript
// Response: 200 OK
interface CountPlanDetailResponse extends CountPlanResponse {
  snapshot?: InventorySnapshotSummary;
  tasksSummary: {
    total: number;
    pending: number;
    assigned: number;
    inProgress: number;
    submitted: number;
    verified: number;
  };
  varianceSummary?: VarianceSummary;
  aiDecisionResult?: AIDecisionContext;
}
```

#### `PUT /api/count-plans/:id` — 更新盘点计划
```typescript
// Request: Partial<CreateCountPlanRequest>
// Constraint: 仅 DRAFT 状态可修改
// Response: 200 OK → CountPlanResponse
```

#### `POST /api/count-plans/:id/ready` — 标记就绪
```typescript
// Constraint: DRAFT → READY，验证必填字段完整
// Response: 200 OK → CountPlanResponse { status: 'READY' }
```

#### `POST /api/count-plans/:id/freeze` — 冻结库存
```typescript
// Constraint: READY → FROZEN
// Side Effect: 调用 IInventoryProvider.getInventory() 生成快照
// Response: 200 OK
interface FreezeResponse {
  plan: CountPlanResponse;
  snapshot: {
    id: string;
    snapshotTime: string;
    totalLocations: number;
    totalProducts: number;
    totalQuantity: number;
  };
}
```

#### `POST /api/count-plans/:id/generate-tasks` — 生成盘点任务
```typescript
// Request
interface GenerateTasksRequest {
  splitBy: 'zone' | 'aisle' | 'manual';
  manualSplit?: { taskName: string; locationIds: string[] }[];
}

// Constraint: FROZEN → IN_PROGRESS
// Response: 200 OK
interface GenerateTasksResponse {
  plan: CountPlanResponse;
  tasks: CountTaskResponse[];
}
```

#### `POST /api/count-plans/:id/complete` — 完成盘点
```typescript
// Constraint: REVIEWING → COMPLETED
// Side Effect: 生成最终报告，调用 IAdjustmentPublisher
// Response: 200 OK → CountPlanResponse { status: 'COMPLETED' }
```

#### `POST /api/count-plans/:id/recount` — 触发复盘
```typescript
// Request
interface RecountRequest {
  scope: 'full' | 'partial';
  locationIds?: string[];  // partial 时必填
}

// Constraint: REVIEWING → IN_PROGRESS, round + 1
// Response: 200 OK → GenerateTasksResponse
```

#### `POST /api/count-plans/:id/cancel` — 取消盘点
```typescript
// Constraint: 非 COMPLETED/CANCELLED 状态可取消
// Side Effect: 级联取消所有未完成任务
// Response: 200 OK → CountPlanResponse { status: 'CANCELLED' }
```

### 3.2 盘点任务 API

#### `GET /api/count-tasks` — 获取任务列表
```typescript
interface ListCountTasksQuery {
  countPlanId?: string;
  assigneeId?: string;
  status?: CountTaskStatus;
  round?: number;
  page?: number;
  pageSize?: number;
}
```

#### `GET /api/count-tasks/:id` — 获取任务详情（含明细）
```typescript
interface CountTaskDetailResponse extends CountTaskResponse {
  details: CountDetailResponse[];
  progress: {
    totalLocations: number;
    completedLocations: number;
    totalItems: number;
    countedItems: number;
    skippedItems: number;
    flaggedItems: number;
  };
}
```

#### `POST /api/count-tasks/:id/assign` — 分配任务
```typescript
// Request
interface AssignTaskRequest {
  assigneeId: string;
  assigneeName: string;
}
// Constraint: PENDING → ASSIGNED
```

#### `POST /api/count-tasks/batch-assign` — 批量分配
```typescript
interface BatchAssignRequest {
  assignments: { taskId: string; assigneeId: string; assigneeName: string }[];
}
```

#### `POST /api/count-tasks/:id/start` — 开始执行
```typescript
// Constraint: ASSIGNED → IN_PROGRESS
// Side Effect: 记录 startedAt, deviceId
```

#### `POST /api/count-tasks/:id/pause` — 暂停
```typescript
// Constraint: IN_PROGRESS → PAUSED
```

#### `POST /api/count-tasks/:id/resume` — 恢复
```typescript
// Constraint: PAUSED → IN_PROGRESS
```

#### `POST /api/count-tasks/:id/submit` — 提交任务
```typescript
// Constraint: IN_PROGRESS → SUBMITTED
// Validation: 所有 PENDING 的 detail 必须有处理（COUNTED/SKIPPED/FLAGGED）
// Response: 200 OK
interface SubmitResponse {
  task: CountTaskResponse;
  summary: {
    totalItems: number;
    countedItems: number;
    skippedItems: number;
    flaggedItems: number;
  };
}
```

### 3.3 盘点明细 API

#### `GET /api/count-tasks/:taskId/details` — 获取任务的盘点明细
```typescript
interface ListDetailsQuery {
  locationId?: string;
  status?: 'PENDING' | 'COUNTED' | 'SKIPPED' | 'FLAGGED';
}
// Response: CountDetailResponse[]
```

#### `PUT /api/count-details/:id` — 更新盘点明细（录入数量）
```typescript
interface UpdateCountDetailRequest {
  countedQty: number;
  scanMethod: 'BARCODE' | 'MANUAL' | 'PHOTO';
  remark?: string;
  clientSyncId: string;  // 客户端生成的唯一 ID，用于去重
}
// Constraint: 仅 PENDING 状态可更新
// Side Effect: 自动计算 varianceQty, variancePercent; 状态 → COUNTED
```

#### `POST /api/count-details/:id/skip` — 跳过
```typescript
interface SkipDetailRequest {
  reason: string;  // 必填
}
// Side Effect: 状态 → SKIPPED
```

#### `POST /api/count-details/:id/flag` — 标记异常
```typescript
interface FlagDetailRequest {
  anomalyReason: string;
  countedQty?: number;
  photoUrls?: string[];
}
// Side Effect: 状态 → FLAGGED, isAnomalous = true
```

#### `POST /api/count-details/:id/photos` — 上传照片
```typescript
// Request: FormData with image file
// Response: { photoUrl: string }
// Side Effect: 追加到 detail.photoUrls[]
```

#### `POST /api/count-details/batch-update` — 批量更新（离线同步用）
```typescript
interface BatchUpdateDetailsRequest {
  updates: {
    id: string;
    countedQty: number;
    scanMethod: 'BARCODE' | 'MANUAL' | 'PHOTO';
    remark?: string;
    clientSyncId: string;
    countedAt: string;
    photoUrls?: string[];
    status: 'COUNTED' | 'SKIPPED' | 'FLAGGED';
    anomalyReason?: string;
  }[];
}

// Response
interface BatchUpdateResponse {
  succeeded: number;
  failed: number;
  conflicts: { id: string; reason: string }[];
}
```

### 3.4 差异分析 API

#### `GET /api/count-plans/:id/variance` — 获取差异分析
```typescript
interface VarianceQuery {
  resolution?: string;
  minVariancePercent?: number;
  sortBy?: 'varianceQty' | 'variancePercent' | 'varianceValue';
  sortOrder?: 'asc' | 'desc';
}

// Response
interface VarianceAnalysisResponse {
  summary: VarianceSummary;
  records: VarianceRecord[];
  roundComparison?: {
    round: number;
    summary: VarianceSummary;
  }[];
}
```

#### `GET /api/count-plans/:id/ai-decision` — 获取 AI 决策
```typescript
// Response: AIDecisionContext (详见 domain-analysis.md)
```

### 3.5 报告 API

#### `GET /api/count-plans/:id/report` — 获取最终报告
```typescript
// Response
interface FinalReportResponse {
  plan: CountPlanDetailResponse;
  result: CountResult;          // 完整盘点结果
  auditTrail: AuditEntry[];     // 审计日志
}

interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}
```

#### `GET /api/count-plans/:id/report/export` — 导出报告
```typescript
// Query: format=json
// Response: CountResult (JSON download)
```

### 3.6 同步 API

#### `POST /api/sync/push` — 推送离线数据
```typescript
interface SyncPushRequest {
  items: SyncQueueItem[];
}

interface SyncPushResponse {
  synced: number;
  conflicts: SyncConflict[];
}

interface SyncConflict {
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  resolution: 'local_wins' | 'server_wins' | 'manual';
}
```

#### `POST /api/sync/pull` — 拉取更新
```typescript
interface SyncPullRequest {
  lastSyncTimestamp: string;
  entityTypes: string[];
}

interface SyncPullResponse {
  updates: { entityType: string; data: any[] }[];
  syncTimestamp: string;
}
```

---

## 4. 前端页面与路由

### 4.1 Web 管理端路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | Dashboard | 首页仪表盘：活跃盘点计划、近期完成、统计 |
| `/plans` | PlanList | 盘点计划列表（筛选、排序、翻页） |
| `/plans/create` | PlanCreate | 创建盘点计划表单 |
| `/plans/:id` | PlanDetail | 盘点计划详情（包含子 Tab） |
| `/plans/:id/tasks` | TaskManagement | 任务管理和分配（PlanDetail 子 Tab） |
| `/plans/:id/variance` | VarianceAnalysis | 差异分析（PlanDetail 子 Tab） |
| `/plans/:id/ai-decision` | AIDecisionView | AI 决策和审批（PlanDetail 子 Tab） |
| `/plans/:id/report` | FinalReport | 最终报告（PlanDetail 子 Tab） |

### 4.2 Mobile PWA 路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/m/login` | Login | 操作员登录 |
| `/m/tasks` | TaskList | 我的任务列表 |
| `/m/tasks/:id` | CountExecution | 任务执行主页（库位列表） |
| `/m/tasks/:id/location/:locId` | LocationCount | 库位盘点（商品列表 + 扫码） |
| `/m/tasks/:id/summary` | TaskSummary | 任务汇总 + 提交确认 |
| `/m/sync` | SyncStatus | 同步状态和手动触发 |

### 4.3 页面详细设计

#### Dashboard（Web）
```
┌────────────────────────────────────────────────┐
│  仓库库存盘点系统                    [用户名 ▼] │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │进行中│ │待审核│ │已完成│ │ 总计 │          │
│  │  3   │ │  1   │ │ 15   │ │  19  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                │
│  活跃盘点计划                                   │
│  ┌────────────────────────────────────────┐    │
│  │ CP-20260310-001  全仓盘点  IN_PROGRESS │    │
│  │ 进度: ████████░░ 80%  任务: 8/10      │    │
│  ├────────────────────────────────────────┤    │
│  │ CP-20260308-002  A区循环  REVIEWING    │    │
│  │ 准确率: 96.5%  AI建议: 完成           │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  近期盘点历史                  [查看全部 →]    │
│  · CP-20260305-001  已完成  准确率 98.2%       │
│  · CP-20260301-001  已完成  准确率 97.8%       │
└────────────────────────────────────────────────┘
```

#### CountExecution（Mobile）
```
┌──────────────────────────┐
│ ← 任务 CT-001-01   [⋮]  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🟢 在线                  │
│                          │
│ 进度: 3/8 库位           │
│ ████░░░░░░░░ 37.5%       │
│                          │
│ ┌──────────────────────┐ │
│ │ 📦 A-01-02           │ │
│ │ ✅ 已完成 12/12      │ │
│ ├──────────────────────┤ │
│ │ 📦 A-01-03           │ │
│ │ ✅ 已完成 8/8        │ │
│ ├──────────────────────┤ │
│ │ 📦 A-01-04           │ │
│ │ 🔄 进行中 3/10       │ │
│ │         [继续盘点 →] │ │
│ ├──────────────────────┤ │
│ │ 📦 A-02-01           │ │
│ │ ⏳ 待盘点 0/15       │ │
│ │          [开始 →]    │ │
│ ├──────────────────────┤ │
│ │ ...                  │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │    📋 提交任务        │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

#### ProductScan（Mobile）— 核心交互
```
┌──────────────────────────┐
│ ← 库位 A-01-04    3/10  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ ┌──────────────────────┐ │
│ │  ┌────────────────┐  │ │
│ │  │                │  │ │
│ │  │   📷 扫码区域   │  │ │
│ │  │                │  │ │
│ │  └────────────────┘  │ │
│ │  [📷 摄像头] [⌨ 手动]│ │
│ └──────────────────────┘ │
│                          │
│ 商品: SKU-10042          │
│ 名称: 螺丝刀套装 8件    │
│ 条码: 6901234567890      │
│                          │
│ 数量:                    │
│ ┌──┐ ┌────────────┐ ┌──┐│
│ │ - │ │     12     │ │ + ││
│ └──┘ └────────────┘ └──┘│
│                          │
│ [📸 拍照]  [📝 备注]     │
│                          │
│ ┌──────────────────────┐ │
│ │   ✅ 确认，下一个     │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │   ⚠️ 标记异常        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │   ⏭ 跳过             │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

---

## 5. AI Agent 决策逻辑设计

### 5.1 决策引擎架构

AI 决策引擎为**规则引擎 + 可扩展 LLM 接口**：
- 一期：基于规则的自动决策
- 二期可对接 LLM（如 GPT-4 / Claude）做更复杂的模式分析

### 5.2 决策规则（一期实现）

```typescript
class AIDecisionService {
  analyze(context: DecisionInput): AIDecisionContext {
    const { plan, varianceSummary, varianceRecords, currentRound, maxRounds } = context;

    // 规则1：达到最大轮次 → 强制完成
    if (currentRound >= maxRounds) {
      return {
        recommendation: 'COMPLETE',
        confidence: 0.7,
        reasoning: `已达到最大复盘轮次(${maxRounds})，建议完成盘点并人工审核剩余差异项`,
        recountTargets: [],
      };
    }

    // 规则2：准确率 ≥ 98% 且无高价值差异 → 完成
    const hasHighValueVariance = varianceRecords.some(
      r => Math.abs(r.varianceValue || 0) > HIGH_VALUE_THRESHOLD
    );
    if (varianceSummary.accuracyRate >= 98 && !hasHighValueVariance) {
      return {
        recommendation: 'COMPLETE',
        confidence: 0.95,
        reasoning: `准确率${varianceSummary.accuracyRate}%，无高价值差异，建议完成`,
        recountTargets: [],
      };
    }

    // 规则3：超差项超过 10% → 全量复盘
    const exceedRatio = varianceSummary.exceedTolerance / varianceSummary.totalItems;
    if (exceedRatio > 0.1) {
      return {
        recommendation: 'RECOUNT',
        confidence: 0.85,
        reasoning: `${(exceedRatio * 100).toFixed(1)}%的项目超出容忍度，建议全量复盘`,
        recountTargets: [],  // 全量
      };
    }

    // 规则4：超差项 ≤ 10% → 部分复盘
    if (varianceSummary.exceedTolerance > 0) {
      const targets = varianceRecords
        .filter(r => Math.abs(r.variancePercent) > plan.varianceTolerancePercent)
        .map(r => r.locationId);
      return {
        recommendation: 'PARTIAL_RECOUNT',
        confidence: 0.9,
        reasoning: `${varianceSummary.exceedTolerance}项超差，建议对${targets.length}个库位复盘`,
        recountTargets: [...new Set(targets)],
      };
    }

    // 规则5：所有项在容忍度内 → 完成
    return {
      recommendation: 'COMPLETE',
      confidence: 0.92,
      reasoning: '所有差异均在容忍度范围内，建议完成盘点',
      recountTargets: [],
    };
  }
}
```

### 5.3 决策参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| HIGH_VALUE_THRESHOLD | 1000 | 高价值差异金额阈值 |
| ACCURACY_COMPLETE_THRESHOLD | 98% | 准确率达到此值建议完成 |
| EXCEED_RATIO_FULL_RECOUNT | 10% | 超差比例超过此值建议全量复盘 |
| CONVERGENCE_THRESHOLD | 50% | 复盘后差异收敛超过此比例视为有效 |

### 5.4 二期扩展：LLM 集成

```typescript
interface IAIDecisionProvider {
  analyze(context: DecisionInput): Promise<AIDecisionContext>;
}

// 一期：规则引擎实现
class RuleBasedDecisionProvider implements IAIDecisionProvider { ... }

// 二期：LLM 实现
class LLMDecisionProvider implements IAIDecisionProvider {
  // 将 context 构建为 prompt，调用 LLM API
  // 解析 LLM 响应为 AIDecisionContext
}
```

---

## 6. 离线与同步策略

### 6.1 Service Worker 缓存策略

```javascript
// sw.js 核心策略
const CACHE_NAME = 'inventory-count-v1';

// 静态资源：Cache First
const STATIC_ASSETS = ['/index.html', '/manifest.json', '/*.js', '/*.css'];

// API 数据：Network First, fallback to cache
// 任务数据在分配时预缓存到 IndexedDB

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (isStaticAsset(event.request)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});
```

### 6.2 数据同步流程

```
操作员执行盘点
      │
      ▼
  写入 IndexedDB (countDetails)
      │
      ▼
  写入 SyncQueue (status: pending)
      │
      ├── 在线 ──► 立即触发 SyncService.push()
      │              │
      │              ├── 成功 → syncQueue.status = 'synced'
      │              └── 失败 → syncQueue.retryCount++, 稍后重试
      │
      └── 离线 ──► 等待网络恢复
                     │
                     ▼
                 navigator.onLine → SyncService.pushAll()
                 或 Background Sync API 触发
```

### 6.3 冲突解决

```typescript
// 冲突解决策略
enum ConflictResolution {
  LAST_WRITE_WINS,    // 最后写入优先（默认）
  CLIENT_WINS,        // 客户端优先
  SERVER_WINS,        // 服务端优先
  MANUAL,             // 标记为冲突，人工处理
}

// 盘点场景下的策略：
// - countDetail: LAST_WRITE_WINS（以最新的盘点记录为准）
// - countTask status: SERVER_WINS（服务端管理状态流转）
// - photos: CLIENT_WINS（客户端拍的照片以客户端为准）
```

---

## 7. 接口预留说明（三方系统对接点）

### 7.1 对接架构

```
┌───────────────────────────────────────────────────┐
│              盘点模块 (本系统)                       │
│                                                    │
│  ProviderRegistry                                  │
│  ┌─────────────────────────────────────────┐      │
│  │                                         │      │
│  │  register('inventory', provider)        │      │
│  │  register('location', provider)         │      │
│  │  register('product', provider)          │      │
│  │  register('auth', provider)             │      │
│  │  register('adjustment', publisher)      │      │
│  │  register('aiDecision', provider)       │      │
│  │                                         │      │
│  └───────────┬─────────────────────────────┘      │
│              │                                     │
└──────────────┼─────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
 一期 Mock  二期 WMS   二期 ERP
 Provider   Adapter    Adapter
```

### 7.2 Provider 注册中心

```typescript
class ProviderRegistry {
  private static providers = new Map<string, any>();

  static register<T>(key: string, provider: T): void {
    this.providers.set(key, provider);
  }

  static get<T>(key: string): T {
    const provider = this.providers.get(key);
    if (!provider) throw new Error(`Provider '${key}' not registered`);
    return provider as T;
  }
}

// 一期初始化
ProviderRegistry.register('inventory', new MockInventoryProvider());
ProviderRegistry.register('location', new MockLocationProvider());
ProviderRegistry.register('product', new MockProductProvider());
ProviderRegistry.register('auth', new MockAuthProvider());
ProviderRegistry.register('adjustment', new MockAdjustmentPublisher());
ProviderRegistry.register('aiDecision', new RuleBasedDecisionProvider());

// 二期替换（示例）
// ProviderRegistry.register('inventory', new WMSInventoryAdapter(wmsConfig));
// ProviderRegistry.register('product', new ERPProductAdapter(erpConfig));
```

### 7.3 对接接口清单

| Provider | 方法 | 用途 | 对接目标 |
|----------|------|------|---------|
| IInventoryProvider | getInventory(warehouseId) | 获取系统库存 | WMS 库存查询 API |
| ILocationProvider | getLocations(warehouseId) | 获取库位列表 | WMS 库位管理 API |
| IProductProvider | getProducts() | 获取产品主数据 | ERP/PIM 产品 API |
| IProductProvider | getProductByBarcode(barcode) | 条码查产品 | ERP/PIM 产品 API |
| IProductProvider | searchProducts(keyword) | 搜索产品 | ERP/PIM 产品 API |
| IAuthProvider | login(credentials) | 用户认证 | SSO/LDAP/IAM |
| IAuthProvider | getUsers() | 获取操作员列表 | HR/用户管理系统 |
| IAdjustmentPublisher | publishResult(result) | 发布盘点结果 | WMS 库存调整 API |
| IAIDecisionProvider | analyze(context) | AI 决策 | LLM API (GPT/Claude) |
| INotificationService | notify(userId, message) | 推送通知 | 企业微信/钉钉/邮件 |

---

## 8. Mock 数据设计

### 8.1 locations.json（20 个库位）
```json
[
  { "locationId": "LOC-001", "locationCode": "A-01-01-01", "zone": "A", "aisle": "01", "rack": "01", "level": "01", "position": "01", "locationType": "RACK", "isActive": true },
  { "locationId": "LOC-002", "locationCode": "A-01-01-02", "zone": "A", "aisle": "01", "rack": "01", "level": "02", "position": "01", "locationType": "RACK", "isActive": true },
  // ... 共 20 个，覆盖 A/B 两个区域
]
```

### 8.2 products.json（30 个产品）
```json
[
  { "productId": "PRD-001", "productCode": "SKU-10001", "productName": "螺丝刀套装 8件", "barcode": "6901234567001", "category": "工具", "uom": "套", "unitCost": 45.00 },
  { "productId": "PRD-002", "productCode": "SKU-10002", "productName": "电钻 12V", "barcode": "6901234567002", "category": "电动工具", "uom": "台", "unitCost": 320.00 },
  // ... 共 30 个，覆盖不同品类和价格范围
]
```

### 8.3 inventory.json（约 100 条库存记录）
```json
[
  { "locationId": "LOC-001", "locationCode": "A-01-01-01", "productId": "PRD-001", "productCode": "SKU-10001", "productName": "螺丝刀套装 8件", "barcode": "6901234567001", "quantity": 50, "uom": "套", "unitCost": 45.00 },
  // ... 约 100 条，每个库位 3-8 种商品
]
```

### 8.4 Mock 用户
```json
[
  { "userId": "USR-001", "username": "admin", "displayName": "管理员", "role": "ADMIN" },
  { "userId": "USR-002", "username": "operator1", "displayName": "张三", "role": "OPERATOR" },
  { "userId": "USR-003", "username": "operator2", "displayName": "李四", "role": "OPERATOR" },
  { "userId": "USR-004", "username": "operator3", "displayName": "王五", "role": "OPERATOR" }
]
```
