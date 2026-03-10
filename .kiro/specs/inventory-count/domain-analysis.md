# 领域分析 — 仓库库存盘点模块

## 1. 领域概述

本模块是一个**独立的仓库静态盘点（Physical Inventory Count）系统**，覆盖从盘点计划创建到最终差异报告产出的完整流程。系统分为两个端：

- **网页端（Web）**：盘点计划管理、任务分配、差异审核、AI 决策、最终核算
- **手持端（Mobile PWA）**：现场盘点执行（扫码、录入、拍照、离线支持）

---

## 2. 限界上下文（Bounded Context）

```
┌─────────────────────────────────────────────────────────┐
│                  Inventory Count Context                 │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Count Plan   │  │ Count Task   │  │ Variance      │  │
│  │ Management   │  │ Execution    │  │ Analysis      │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐                      │
│  │ AI Decision │  │ Offline Sync │                      │
│  │ Engine      │  │ Manager      │                      │
│  └─────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
          │                    │                  │
          ▼                    ▼                  ▼
   ┌─────────────┐    ┌──────────────┐   ┌──────────────┐
   │ External     │    │ External     │   │ External     │
   │ Inventory    │    │ Product      │   │ User/Auth    │
   │ System       │    │ Master       │   │ System       │
   │ (接口预留)   │    │ (接口预留)   │   │ (接口预留)   │
   └─────────────┘    └──────────────┘   └──────────────┘
```

---

## 3. 实体（Entity）

### 3.1 CountPlan（盘点计划） — 聚合根

盘点的顶层管理单元，一次盘点活动对应一个 CountPlan。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| planNo | string | 盘点计划编号（业务编号，如 CP-20260310-001） |
| name | string | 盘点名称 |
| type | enum | 盘点类型：FULL（全盘）/ PARTIAL（部分盘）/ CYCLE（循环盘） |
| status | enum | 状态（见状态机） |
| warehouseId | string | 仓库标识 |
| scopeDescription | string | 盘点范围描述 |
| plannedStartDate | datetime | 计划开始时间 |
| plannedEndDate | datetime | 计划结束时间 |
| actualStartDate | datetime? | 实际开始时间 |
| actualEndDate | datetime? | 实际结束时间 |
| freezeSnapshotId | string? | 库存快照 ID（冻结时生成） |
| varianceTolerancePercent | decimal | 差异容忍百分比（默认 5%） |
| varianceToleranceQty | integer? | 差异容忍绝对数量（可选） |
| varianceToleranceValue | decimal? | 差异容忍金额（可选） |
| maxRecountRounds | integer | 最大复盘轮次（默认 2） |
| currentRound | integer | 当前盘点轮次（从 1 开始） |
| aiDecisionEnabled | boolean | 是否启用 AI 自动决策 |
| aiDecisionResult | json? | AI 决策结果记录 |
| createdBy | string | 创建人 |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |
| notes | string? | 备注 |

### 3.2 CountTask（盘点任务） — 聚合根

分配给具体操作人员的盘点执行单元，一个 CountPlan 下有多个 CountTask。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| taskNo | string | 任务编号（如 CT-20260310-001-01） |
| countPlanId | UUID | 所属盘点计划 |
| round | integer | 盘点轮次（1=首次，2=二次复盘…） |
| status | enum | 状态（见状态机） |
| assigneeId | string? | 指派操作员 ID |
| assigneeName | string? | 指派操作员姓名 |
| locationIds | string[] | 负责的库位 ID 列表 |
| priority | enum | 优先级：HIGH / MEDIUM / LOW |
| startedAt | datetime? | 开始执行时间 |
| completedAt | datetime? | 完成时间 |
| submittedAt | datetime? | 提交时间 |
| deviceId | string? | 执行设备标识 |
| isBlindCount | boolean | 是否盲盘（不显示系统库存） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |
| notes | string? | 备注 |

### 3.3 CountDetail（盘点明细）

一条具体的盘点记录，记录某个库位某个商品的实际盘点数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| countTaskId | UUID | 所属盘点任务 |
| countPlanId | UUID | 所属盘点计划（冗余，便于查询） |
| round | integer | 盘点轮次 |
| locationId | string | 库位 ID |
| locationCode | string | 库位编码 |
| productId | string | 产品 ID |
| productCode | string | 产品编码 |
| productName | string | 产品名称 |
| barcode | string? | 条码 |
| systemQty | decimal | 系统库存数量（快照值） |
| countedQty | decimal? | 实际盘点数量 |
| uom | string | 计量单位 |
| varianceQty | decimal? | 差异数量（countedQty - systemQty） |
| variancePercent | decimal? | 差异百分比 |
| varianceValue | decimal? | 差异金额 |
| status | enum | PENDING / COUNTED / SKIPPED / FLAGGED |
| scanMethod | enum? | 扫码方式：BARCODE / MANUAL / PHOTO |
| photoUrls | string[]? | 盘点照片 URL 列表 |
| countedBy | string? | 盘点人 |
| countedAt | datetime? | 盘点时间 |
| remark | string? | 操作员备注 |
| isAnomalous | boolean | 是否异常（AI 或规则标记） |
| anomalyReason | string? | 异常原因 |
| clientSyncId | string? | 客户端同步 ID（离线去重用） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### 3.4 VarianceRecord（差异记录）

盘点完成后的差异汇总及处理记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| countPlanId | UUID | 所属盘点计划 |
| productId | string | 产品 ID |
| productCode | string | 产品编码 |
| locationId | string | 库位 ID |
| locationCode | string | 库位编码 |
| systemQty | decimal | 系统数量 |
| finalCountedQty | decimal | 最终盘点数量 |
| varianceQty | decimal | 差异数量 |
| variancePercent | decimal | 差异百分比 |
| varianceValue | decimal? | 差异金额 |
| resolution | enum | 处理方式：ACCEPTED / RECOUNT / ADJUSTED / REJECTED |
| adjustmentApproved | boolean | 是否批准调整 |
| approvedBy | string? | 批准人 |
| approvedAt | datetime? | 批准时间 |
| rootCause | string? | 根因分析 |
| requiresRecount | boolean | 是否需要复盘 |
| recountRound | integer? | 复盘轮次 |
| aiRecommendation | string? | AI 建议 |
| aiConfidence | decimal? | AI 置信度 |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### 3.5 InventorySnapshot（库存快照）

盘点冻结时刻的系统库存镜像。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| countPlanId | UUID | 所属盘点计划 |
| snapshotTime | datetime | 快照生成时间 |
| status | enum | CREATING / READY / EXPIRED |
| totalLocations | integer | 库位总数 |
| totalProducts | integer | 产品总数 |
| totalQuantity | decimal | 库存总数量 |
| createdAt | datetime | 创建时间 |

### 3.6 SnapshotItem（快照明细）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| snapshotId | UUID | 所属快照 |
| locationId | string | 库位 ID |
| locationCode | string | 库位编码 |
| productId | string | 产品 ID |
| productCode | string | 产品编码 |
| productName | string | 产品名称 |
| barcode | string? | 条码 |
| quantity | decimal | 库存数量 |
| uom | string | 计量单位 |
| unitCost | decimal? | 单位成本（用于计算差异金额） |
| lotNumber | string? | 批次号 |
| expiryDate | date? | 过期日期 |

---

## 4. 值对象（Value Object）

### 4.1 LocationInfo（库位信息）
```typescript
interface LocationInfo {
  locationId: string;
  locationCode: string;   // 如 A-01-02-03
  zone: string;           // 区域
  aisle: string;          // 通道
  rack: string;           // 货架
  level: string;          // 层
  position: string;       // 位
  locationType: 'RACK' | 'FLOOR' | 'BULK' | 'STAGING';
}
```

### 4.2 ProductInfo（产品信息）
```typescript
interface ProductInfo {
  productId: string;
  productCode: string;    // SKU
  productName: string;
  barcode: string;
  category: string;
  uom: string;            // 计量单位
  unitCost: number;       // 单位成本
  weight: number;
  volume: number;
}
```

### 4.3 VarianceSummary（差异汇总）
```typescript
interface VarianceSummary {
  totalItems: number;
  countedItems: number;
  matchedItems: number;       // 无差异
  variantItems: number;       // 有差异
  withinTolerance: number;    // 在容忍范围内
  exceedTolerance: number;    // 超出容忍范围
  totalVarianceQty: number;
  totalVarianceValue: number;
  accuracyRate: number;       // 盘点准确率 %
}
```

### 4.4 AIDecisionContext（AI 决策上下文）
```typescript
interface AIDecisionContext {
  planId: string;
  currentRound: number;
  varianceSummary: VarianceSummary;
  highValueVariances: VarianceRecord[];   // 高价值差异项
  historicalAccuracy: number;             // 历史准确率
  recountEffectiveness: number;           // 历次复盘改善率
  recommendation: 'COMPLETE' | 'RECOUNT' | 'PARTIAL_RECOUNT';
  confidence: number;                     // 0-1
  reasoning: string;                      // 决策理由
  recountTargets?: string[];              // 建议复盘的库位/商品
}
```

---

## 5. 聚合根边界

```
CountPlan (聚合根)
  ├── InventorySnapshot (1:1)
  │     └── SnapshotItem (1:N)
  ├── CountTask (1:N)   ← 也是聚合根（独立生命周期）
  │     └── CountDetail (1:N)
  └── VarianceRecord (1:N)
```

- **CountPlan** 管理盘点的生命周期、配置和最终结果
- **CountTask** 独立管理执行过程，可以独立加载（手持端只需加载自己的 task）
- CountDetail 只通过 CountTask 访问和修改
- VarianceRecord 由系统在差异分析阶段自动生成

---

## 6. 业务流程图

### 6.1 主流程（Happy Path）

```
开始
  │
  ▼
[1. 创建盘点计划] ──── 管理员在网页端创建
  │                     设定范围、容忍度、是否盲盘等
  ▼
[2. 导入基础数据] ──── 通过接口导入系统库存、库位列表、产品编码表
  │                     或使用内置 Mock 数据
  ▼
[3. 冻结库存快照] ──── 生成当前时刻的库存镜像
  │                     锁定系统数量作为比对基准
  ▼
[4. 生成盘点任务] ──── 按库位/区域自动拆分任务
  │                     Round = 1
  ▼
[5. 分配盘点任务] ──── 管理员指派任务给操作员
  │                     操作员在手持端看到自己的任务
  ▼
[6. 执行盘点] ──────── 操作员在手持端逐库位扫码/录入
  │                     支持离线操作，数据暂存本地
  │                     上传照片作为证据
  ▼
[7. 提交盘点结果] ──── 操作员提交，数据同步到服务端
  │
  ▼
[8. 差异分析] ──────── 系统自动计算差异
  │                     生成 VarianceRecord
  │                     标记超出容忍度的项目
  ▼
[9. AI 决策] ──────── AI Agent 分析差异模式
  │   │                 判断是否需要二次盘点
  │   │
  │   ├── 建议完成 ──► [10. 管理员审核]
  │   │                      │
  │   │                      ├── 批准 ──► [11. 生成最终报告]
  │   │                      │                   │
  │   │                      │                   ▼
  │   │                      │             [12. 产出差异比对结果]
  │   │                      │                   │
  │   │                      │                   ▼
  │   │                      │               结束 ✓
  │   │                      │
  │   │                      └── 驳回 ──► [回到步骤 4，Round + 1]
  │   │
  │   └── 建议复盘 ──► [4. 生成二次盘点任务]
  │                     仅针对差异项的库位
  │                     Round + 1
  │                     循环直到 AI 建议完成或达到最大轮次
  │
  ▼
[达到最大复盘轮次] ── 强制进入审核流程 ──► [10]
```

### 6.2 手持端执行流程

```
操作员登录
  │
  ▼
[查看待执行任务列表]
  │
  ▼
[选择任务] ──► [开始盘点]
  │
  ▼
[进入库位] ──► 扫描库位条码确认
  │
  ▼
┌─────────────────────────┐
│  逐商品盘点循环          │
│  ┌───────────────────┐  │
│  │ 扫描商品条码       │  │
│  │   ├─ 识别成功      │  │
│  │   │  └─ 输入数量   │  │
│  │   ├─ 识别失败      │  │
│  │   │  └─ 手动搜索   │  │
│  │   └─ 未知商品      │  │
│  │      └─ 标记异常   │  │
│  └───────────────────┘  │
│           │              │
│           ▼              │
│  [确认/拍照/备注]       │
│           │              │
│           ▼              │
│  [下一个商品 or 完成库位]│
└─────────────────────────┘
  │
  ▼
[所有库位完成] ──► [提交任务]
  │
  ▼
[数据同步到服务端]
  │
  ├── 在线 ──► 即时上传
  │
  └── 离线 ──► 本地暂存，恢复网络后自动同步
```

### 6.3 差异分析与 AI 决策流程

```
所有任务提交完成
  │
  ▼
[汇总盘点数据]
  │
  ▼
[逐项计算差异]
  │  差异 = countedQty - systemQty
  │  差异% = |差异| / systemQty × 100
  │  差异金额 = 差异 × unitCost
  ▼
[分类差异项]
  │
  ├── 无差异 → 标记 MATCHED
  ├── 在容忍度内 → 标记 WITHIN_TOLERANCE
  └── 超出容忍度 → 标记 EXCEED_TOLERANCE
  │
  ▼
[AI Agent 分析]
  │
  ├── 输入：
  │   ├── 当前轮次的差异汇总
  │   ├── 超出容忍度的明细
  │   ├── 历史盘点数据（如有）
  │   ├── 当前轮次 vs 最大轮次
  │   └── 高价值差异项
  │
  ├── 决策规则：
  │   ├── 准确率 ≥ 98% 且无高价值差异 → COMPLETE
  │   ├── 首次盘点 + 超差项 > 10% → RECOUNT (全量)
  │   ├── 首次盘点 + 超差项 ≤ 10% → PARTIAL_RECOUNT (仅超差项)
  │   ├── 二次盘点 + 差异收敛 → COMPLETE
  │   ├── 二次盘点 + 差异未收敛 + 未达最大轮次 → RECOUNT
  │   └── 达到最大轮次 → COMPLETE (强制)
  │
  └── 输出：
      ├── recommendation: COMPLETE / RECOUNT / PARTIAL_RECOUNT
      ├── confidence: 0.0 ~ 1.0
      ├── reasoning: "85%准确率，12项超差，建议对超差库位复盘"
      └── recountTargets: ["LOC-A01", "LOC-B03", ...]
```

---

## 7. 状态机设计

### 7.1 CountPlan 状态机

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    ▼                                 │
  DRAFT ──► READY ──► FROZEN ──► IN_PROGRESS ──► REVIEWING
    │                                │               │
    │                                │               ├──► COMPLETED
    │                                │               │
    │                                │               └──► IN_PROGRESS
    │                                │                    (回到执行，新一轮)
    └──► CANCELLED                   │
                                     └──► CANCELLED
```

| 状态 | 说明 | 允许操作 |
|------|------|----------|
| DRAFT | 草稿，可编辑计划参数 | 编辑、删除、提交就绪 |
| READY | 就绪，等待冻结 | 冻结库存、取消 |
| FROZEN | 已冻结快照，等待生成任务 | 生成任务、取消 |
| IN_PROGRESS | 盘点执行中 | 查看进度、等待任务完成 |
| REVIEWING | 审核中（AI 已给出建议） | 批准完成、驳回复盘 |
| COMPLETED | 已完成，最终结果已生成 | 导出报告、查看 |
| CANCELLED | 已取消 | 查看 |

**转换规则：**

| 从 | 到 | 触发条件 |
|----|----|----|
| DRAFT → READY | 管理员确认计划信息完整 |
| READY → FROZEN | 调用冻结接口，快照生成成功 |
| FROZEN → IN_PROGRESS | 任务生成并分配完毕 |
| IN_PROGRESS → REVIEWING | 当前轮次所有任务提交 + 差异分析完成 |
| REVIEWING → COMPLETED | 管理员批准 AI 的"完成"建议 |
| REVIEWING → IN_PROGRESS | 管理员批准"复盘"建议或驳回，开启新一轮 |
| * → CANCELLED | 管理员手动取消 |

### 7.2 CountTask 状态机

```
  PENDING ──► ASSIGNED ──► IN_PROGRESS ──► SUBMITTED ──► VERIFIED
    │            │              │               │
    │            │              │               └──► REJECTED → ASSIGNED
    │            │              │                         (退回重做)
    │            │              └──► PAUSED → IN_PROGRESS
    │            │                     (暂停/恢复)
    └──► CANCELLED            
         (计划取消时级联)
```

| 状态 | 说明 | 端 |
|------|------|---|
| PENDING | 已生成待分配 | Web |
| ASSIGNED | 已分配给操作员 | Web |
| IN_PROGRESS | 操作员正在执行 | Mobile |
| PAUSED | 暂停（休息/换班） | Mobile |
| SUBMITTED | 操作员已提交 | Mobile → Web |
| VERIFIED | 审核通过 | Web |
| REJECTED | 退回重做（数据可疑） | Web |
| CANCELLED | 已取消 | Web |

### 7.3 CountDetail 状态机

```
  PENDING ──► COUNTED ──► (不可变更，只能通过新 round 覆盖)
    │
    ├──► SKIPPED (操作员跳过，需备注原因)
    │
    └──► FLAGGED (标记异常)
```

---

## 8. 领域事件

| 事件名 | 触发时机 | 携带数据 |
|--------|----------|---------|
| CountPlanCreated | 创建盘点计划 | planId, planNo, type, scope |
| InventoryFrozen | 库存冻结完成 | planId, snapshotId, itemCount |
| CountTaskGenerated | 任务生成 | planId, taskIds[], round |
| CountTaskAssigned | 任务分配 | taskId, assigneeId |
| CountTaskStarted | 操作员开始执行 | taskId, deviceId |
| CountDetailRecorded | 录入一条盘点 | taskId, detailId, productId, qty |
| CountTaskSubmitted | 任务提交 | taskId, detailCount |
| VarianceAnalysisCompleted | 差异分析完成 | planId, round, summary |
| AIDecisionMade | AI 做出决策 | planId, recommendation, confidence |
| RecountTriggered | 触发复盘 | planId, newRound, targetLocations |
| CountPlanCompleted | 盘点完成 | planId, finalSummary |
| OfflineDataSynced | 离线数据同步 | taskId, syncedCount, conflictCount |

---

## 9. 外部接口依赖（预留）

| 接口 | 方向 | 说明 | 当前实现 |
|------|------|------|---------|
| InventoryProvider | 入 | 获取系统库存数据 | Mock/本地 JSON |
| LocationProvider | 入 | 获取库位列表 | Mock/本地 JSON |
| ProductProvider | 入 | 获取产品编码表 | Mock/本地 JSON |
| AuthProvider | 入 | 用户认证和权限 | Mock/本地用户 |
| AdjustmentPublisher | 出 | 发布库存调整结果 | 仅生成报告 |
| NotificationService | 出 | 推送通知（任务分配等） | console.log |

所有外部接口通过 TypeScript interface 定义，当前用 Mock 实现，二期可替换为实际 API 调用。
