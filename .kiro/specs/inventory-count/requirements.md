# 需求规格 — 仓库库存盘点模块

## 1. 项目概述

### 1.1 项目名称
独立仓库库存盘点模块（Inventory Count Module）

### 1.2 项目目标
构建一个独立的、可与任意 WMS/ERP 对接的仓库静态盘点系统。覆盖从盘点计划创建到最终差异报告产出的完整流程，引入 AI Agent 辅助决策，支持网页端管理和手持端现场执行。

### 1.3 技术栈
- 前端：React 18+ / TypeScript / Vite
- 手持端：PWA（响应式 Web App，非原生）
- 状态管理：Zustand
- 离线存储：IndexedDB（via Dexie.js）
- UI 组件：Ant Design 5.x（Web）/ Ant Design Mobile（Mobile）
- 条码扫描：html5-qrcode 或 @nicolo-ribaudo/barcode-scanner
- 构建工具：Vite + PWA Plugin（vite-plugin-pwa）
- 后端：本地 JSON Server 或内存 Mock（一期不做独立后端）

### 1.4 约束
- 输入输出留好接口，二期对接三方系统 API
- 一期使用 Mock 数据，不依赖外部系统
- 手持端必须支持离线操作
- 盘点流程遵循行业标准静态盘点最佳实践

---

## 2. 用户角色

| 角色 | 说明 | 端 |
|------|------|---|
| 仓库管理员（Admin） | 创建盘点计划、分配任务、审核结果、最终核算 | Web |
| 盘点操作员（Operator） | 执行盘点任务、扫码录入、提交结果 | Mobile PWA |
| AI Agent | 分析差异、推荐决策（完成/复盘） | 系统内部 |

---

## 3. 用户故事（EARS 格式）

### 3.1 盘点计划管理（Web 端）

**US-001：创建盘点计划**
> **While** 管理员在盘点管理页面，**when** 管理员点击"新建盘点计划"，**the system shall** 显示创建表单，允许填写计划名称、盘点类型（全盘/部分/循环）、仓库、盘点范围、计划日期、差异容忍度、是否盲盘、最大复盘轮次等参数，并保存为草稿状态。

**验收标准：**
- [ ] 必填字段：名称、类型、仓库、计划开始日期
- [ ] 差异容忍度默认 5%，可修改（范围 0.1%-100%）
- [ ] 最大复盘轮次默认 2，可修改（范围 1-5）
- [ ] 盲盘模式默认开启（行业最佳实践：盘点人员不应看到系统库存）
- [ ] 保存后状态为 DRAFT，可继续编辑
- [ ] 生成唯一计划编号（格式 CP-YYYYMMDD-NNN）

**US-002：导入基础数据**
> **While** 盘点计划处于 DRAFT 状态，**when** 管理员选择"导入数据"，**the system shall** 提供接口导入系统库存、库位列表和产品编码表，并展示导入预览和统计。

**验收标准：**
- [ ] 支持通过接口（IInventoryProvider / ILocationProvider / IProductProvider）导入数据
- [ ] 一期提供 Mock 实现：从本地 JSON 文件加载
- [ ] 导入后显示统计：N 个库位、N 个产品、N 条库存记录
- [ ] 数据校验：库位编码唯一、产品编码唯一、库存数量 ≥ 0
- [ ] 导入失败时显示具体错误行和原因

**US-003：冻结库存快照**
> **While** 盘点计划处于 READY 状态，**when** 管理员点击"冻结库存"，**the system shall** 生成当前时刻的库存快照，记录所有库位-产品-数量的镜像数据，并锁定作为盘点比对基准。

**验收标准：**
- [ ] 快照包含所有库位-产品-数量-单位成本
- [ ] 快照生成后不可修改
- [ ] 记录快照时间戳
- [ ] 计划状态变更为 FROZEN
- [ ] 快照可在审核阶段查看

**US-004：生成盘点任务**
> **While** 盘点计划处于 FROZEN 状态，**when** 管理员点击"生成任务"，**the system shall** 根据库位范围自动拆分盘点任务，每个任务覆盖一组库位。

**验收标准：**
- [ ] 支持按区域（zone）自动拆分
- [ ] 支持手动调整任务的库位分配
- [ ] 每个任务显示预估工作量（库位数、预估商品数）
- [ ] 任务编号自动生成（格式 CT-YYYYMMDD-NNN-RR，RR 为轮次）
- [ ] 首次生成时 round = 1

**US-005：分配盘点任务**
> **While** 盘点任务处于 PENDING 状态，**when** 管理员选择操作员并点击"分配"，**the system shall** 将任务分配给指定操作员，操作员可在手持端看到该任务。

**验收标准：**
- [ ] 可批量分配（选择多个任务，一次指派）
- [ ] 分配后任务状态变为 ASSIGNED
- [ ] 操作员列表来自 AuthProvider 接口（一期 Mock）
- [ ] 显示每个操作员当前已分配的任务数
- [ ] 支持重新分配（从一个操作员转移到另一个）

**US-006：查看盘点进度**
> **While** 盘点计划处于 IN_PROGRESS 状态，**the system shall** 实时展示整体进度和各任务的执行状态。

**验收标准：**
- [ ] 进度概览：总任务数、已完成数、进行中数、待分配数
- [ ] 各任务状态一目了然（列表 + 筛选）
- [ ] 可查看每个任务的明细盘点进度（N/M 库位已完成）
- [ ] 支持按操作员、区域、状态筛选

### 3.2 差异分析与审核（Web 端）

**US-007：查看差异分析结果**
> **When** 当前轮次所有任务已提交，**the system shall** 自动执行差异分析，计算每个库位-产品的差异，并按分类展示结果。

**验收标准：**
- [ ] 差异列表包含：库位、产品、系统数量、盘点数量、差异数量、差异百分比、差异金额
- [ ] 颜色标识：绿色=无差异，黄色=在容忍度内，红色=超出容忍度
- [ ] 支持按差异大小排序、按区域/产品分类筛选
- [ ] 汇总统计：准确率、总差异金额、超差项目数
- [ ] 多轮盘点时可对比各轮次数据

**US-008：查看 AI 决策建议**
> **When** 差异分析完成，**the system shall** 调用 AI Agent 分析差异模式，并展示决策建议（完成/全量复盘/部分复盘）及置信度。

**验收标准：**
- [ ] AI 建议包含：推荐动作、置信度(0-100%)、决策理由、建议复盘目标
- [ ] 管理员可查看 AI 的分析逻辑和数据依据
- [ ] AI 建议不自动执行，需管理员确认
- [ ] 若 AI 建议复盘，显示建议复盘的具体库位/商品列表

**US-009：管理员审批**
> **While** 查看差异分析和 AI 建议，**when** 管理员做出决策，**the system shall** 根据决策执行相应操作。

**验收标准：**
- [ ] 管理员可选择：批准完成、触发全量复盘、触发部分复盘、手动选择复盘范围
- [ ] 批准完成 → 生成最终差异报告，状态变为 COMPLETED
- [ ] 触发复盘 → 创建新一轮盘点任务（round + 1），状态回到 IN_PROGRESS
- [ ] 部分复盘 → 仅为超差库位生成新任务
- [ ] 达到最大复盘轮次时提示管理员必须做最终裁决

**US-010：生成最终报告**
> **When** 盘点完成（COMPLETED），**the system shall** 生成最终盘点报告，展示完整的盘点结果与系统库存的比对。

**验收标准：**
- [ ] 报告包含：盘点汇总（日期、范围、轮次）、差异明细、准确率、处理建议
- [ ] 支持导出为 JSON 格式（通过 AdjustmentPublisher 接口输出）
- [ ] 差异项标注最终处理方式（接受/调整/待查）
- [ ] 保留完整审计轨迹（每轮的盘点数据和决策记录）

### 3.3 盘点执行（手持端 PWA）

**US-011：操作员登录**
> **When** 操作员打开手持端 PWA，**the system shall** 要求登录认证，认证通过后显示该操作员的任务列表。

**验收标准：**
- [ ] 通过 AuthProvider 接口认证（一期 Mock：用户名即可）
- [ ] 登录后记住身份（LocalStorage），下次免登
- [ ] 显示操作员姓名和当前时间

**US-012：查看和开始任务**
> **While** 操作员已登录，**the system shall** 显示分配给该操作员的所有盘点任务，操作员可选择开始执行。

**验收标准：**
- [ ] 任务列表按优先级和状态排序
- [ ] 每个任务显示：任务编号、库位范围、预估工作量、状态
- [ ] 点击"开始"后任务状态变为 IN_PROGRESS
- [ ] 已暂停的任务可恢复继续
- [ ] 已提交的任务只读

**US-013：执行盘点 — 扫码录入**
> **While** 操作员正在执行盘点任务，**when** 操作员扫描商品条码，**the system shall** 识别商品并显示信息，操作员输入实际数量。

**验收标准：**
- [ ] 支持摄像头扫描条码（1D/2D/QR）
- [ ] 支持外接蓝牙扫码枪输入
- [ ] 扫码成功后显示商品名称、编码，盲盘模式下不显示系统数量
- [ ] 数量输入框默认聚焦，支持数字键盘
- [ ] 支持 +/- 快捷按钮调整数量
- [ ] 扫码失败时震动提示，可手动输入商品编码搜索
- [ ] 支持连续扫码模式（扫一个自动跳到下一个）

**US-014：执行盘点 — 异常处理**
> **When** 操作员遇到异常情况，**the system shall** 提供异常处理机制。

**验收标准：**
- [ ] 条码无法识别 → 允许手动搜索产品列表，选择后录入
- [ ] 未知商品（不在产品表中）→ 允许标记为"未知商品"，填写描述/拍照
- [ ] 库位为空 → 允许标记"库位空"，数量记为 0
- [ ] 数量差异较大 → 系统提醒操作员确认（二次确认弹窗）
- [ ] 可跳过某个商品（需填写原因）
- [ ] 所有异常记录在 CountDetail.remark 和 anomalyReason 中

**US-015：拍照功能**
> **While** 操作员在盘点某个商品，**when** 操作员点击拍照，**the system shall** 调用摄像头拍照并关联到当前盘点记录。

**验收标准：**
- [ ] 支持拍摄多张照片
- [ ] 照片本地存储，在线时上传
- [ ] 照片与 CountDetail 关联，在差异审核时可查看
- [ ] 支持删除已拍照片

**US-016：离线支持**
> **When** 手持设备无网络连接，**the system shall** 允许操作员继续执行盘点操作，数据保存在本地。

**验收标准：**
- [ ] PWA 安装后所有页面可离线访问（Service Worker 缓存）
- [ ] 盘点数据写入 IndexedDB，不依赖网络
- [ ] 页面顶部显示网络状态指示器（在线/离线）
- [ ] 离线时显示"数据待同步"标识及待同步条数
- [ ] 恢复网络后自动同步（Background Sync API）
- [ ] 同步冲突处理：以最后提交时间为准，保留冲突记录供审核
- [ ] 同步进度和结果反馈

**US-017：提交盘点任务**
> **When** 操作员完成所有库位的盘点，**the system shall** 允许提交任务。

**验收标准：**
- [ ] 提交前显示汇总：已盘点 N 个库位 M 个商品，跳过 X 项，异常 Y 项
- [ ] 未盘点项必须标记原因后才能提交
- [ ] 提交后任务状态变为 SUBMITTED
- [ ] 离线提交时本地标记为"待同步"，在线后自动上传

### 3.4 二次盘点（Web + Mobile）

**US-018：生成二次盘点任务**
> **When** AI 建议复盘且管理员批准，**the system shall** 自动生成新一轮盘点任务，仅覆盖需要复盘的库位。

**验收标准：**
- [ ] 新任务 round = 上一轮 + 1
- [ ] 部分复盘时只包含超差库位
- [ ] 复盘任务保留上一轮的盘点数据供参考（非盲盘模式下）
- [ ] 复盘任务可分配给不同操作员（交叉盘点最佳实践）
- [ ] 最大轮次限制检查

---

## 4. 非功能需求

### 4.1 性能
| 指标 | 要求 |
|------|------|
| 页面加载（首次） | < 3 秒 |
| 页面切换 | < 500ms |
| 扫码识别 | < 1 秒 |
| 离线数据写入 | < 100ms |
| 在线同步（100 条） | < 5 秒 |
| 差异分析（10,000 条） | < 10 秒 |

### 4.2 离线能力
- PWA 安装后核心功能 100% 可离线使用
- 离线缓存容量支持至少 50,000 条盘点记录
- 恢复在线后 30 秒内开始自动同步
- 同步冲突检测和解决机制

### 4.3 兼容性
- Web 端：Chrome 90+, Edge 90+, Safari 15+
- Mobile PWA：Android Chrome 90+, iOS Safari 15+
- 屏幕适配：320px ~ 1920px 宽度
- 手持设备：支持主流 Android 手持终端（如 Zebra, Honeywell）

### 4.4 可扩展性
- 所有外部数据源通过 Provider 接口抽象
- API 设计遵循 RESTful 规范，保持稳定
- 支持未来对接 WMS/ERP 系统
- 组件化设计，支持独立部署

### 4.5 安全性
- 用户认证通过 AuthProvider 接口
- 盘点数据不可篡改（提交后只读）
- 操作审计日志

### 4.6 可用性
- 手持端操作不超过 3 步完成一次盘点录入
- 大按钮、大字体（适合仓库环境和戴手套操作）
- 操作反馈：震动 + 声音 + 视觉
- 支持横屏和竖屏

---

## 5. 数据流

### 5.1 输入接口

```typescript
// 系统库存 Provider
interface IInventoryProvider {
  getInventory(warehouseId: string): Promise<InventoryItem[]>;
}

interface InventoryItem {
  locationId: string;
  locationCode: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  uom: string;
  unitCost: number;
  lotNumber?: string;
  expiryDate?: string;
}

// 库位列表 Provider
interface ILocationProvider {
  getLocations(warehouseId: string): Promise<Location[]>;
}

interface Location {
  locationId: string;
  locationCode: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  position: string;
  locationType: 'RACK' | 'FLOOR' | 'BULK' | 'STAGING';
  isActive: boolean;
}

// 产品编码表 Provider
interface IProductProvider {
  getProducts(): Promise<Product[]>;
  getProductByBarcode(barcode: string): Promise<Product | null>;
  searchProducts(keyword: string): Promise<Product[]>;
}

interface Product {
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  category: string;
  uom: string;
  unitCost: number;
  weight?: number;
  volume?: number;
  imageUrl?: string;
}
```

### 5.2 输出接口

```typescript
// 盘点结果 Publisher
interface IAdjustmentPublisher {
  publishResult(result: CountResult): Promise<void>;
}

interface CountResult {
  planId: string;
  planNo: string;
  completedAt: string;
  warehouseId: string;
  totalRounds: number;
  accuracyRate: number;
  variances: VarianceItem[];
  summary: CountSummary;
}

interface VarianceItem {
  locationId: string;
  locationCode: string;
  productId: string;
  productCode: string;
  systemQty: number;
  countedQty: number;
  varianceQty: number;
  variancePercent: number;
  varianceValue: number;
  resolution: 'ACCEPTED' | 'ADJUSTED' | 'PENDING';
}

interface CountSummary {
  totalLocations: number;
  totalProducts: number;
  totalSystemQty: number;
  totalCountedQty: number;
  totalVarianceQty: number;
  totalVarianceValue: number;
  matchedItems: number;
  variantItems: number;
  accuracyRate: number;
}
```

### 5.3 认证接口

```typescript
interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  getUsers(): Promise<User[]>;  // 获取操作员列表
}

interface LoginCredentials {
  username: string;
  password?: string;
}

interface User {
  userId: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'OPERATOR';
}
```

---

## 6. 功能与端的划分

| 功能 | Web 端 | Mobile PWA | 说明 |
|------|:------:|:----------:|------|
| 创建/编辑盘点计划 | ✅ | ❌ | 管理员专属 |
| 导入基础数据 | ✅ | ❌ | |
| 冻结库存快照 | ✅ | ❌ | |
| 生成/分配盘点任务 | ✅ | ❌ | |
| 查看盘点进度 | ✅ | ❌ | |
| 差异分析 | ✅ | ❌ | |
| AI 决策展示 | ✅ | ❌ | |
| 管理员审批 | ✅ | ❌ | |
| 最终报告/导出 | ✅ | ❌ | |
| 操作员登录 | ❌ | ✅ | |
| 查看我的任务 | ❌ | ✅ | |
| 执行盘点（扫码/录入） | ❌ | ✅ | |
| 拍照 | ❌ | ✅ | |
| 离线操作 | ❌ | ✅ | |
| 提交任务 | ❌ | ✅ | |
| 查看历史记录 | ✅ | ✅（简版） | |

---

## 7. 词汇表

| 术语 | 英文 | 说明 |
|------|------|------|
| 盘点计划 | Count Plan | 一次盘点活动的顶层管理单元 |
| 盘点任务 | Count Task | 分配给操作员的具体执行单元 |
| 盘点明细 | Count Detail | 一条具体的盘点记录（一个库位一个商品） |
| 库存快照 | Inventory Snapshot | 盘点冻结时刻的系统库存镜像 |
| 差异记录 | Variance Record | 盘点与系统的差异分析记录 |
| 静态盘点 | Static/Physical Inventory | 停止仓库操作后进行的全面盘点 |
| 盲盘 | Blind Count | 盘点人员看不到系统库存数量 |
| 复盘/二次盘点 | Recount | 对差异较大的项目进行再次盘点 |
| 差异容忍度 | Variance Tolerance | 可接受的盘点差异百分比阈值 |
| 库位 | Location | 仓库中的具体存储位置 |
| 冻结 | Freeze | 锁定系统库存数据作为盘点比对基准 |
