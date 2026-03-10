# 仓库库存盘点系统 (Inventory Count Module)

一个独立的仓库静态盘点系统，覆盖从盘点计划创建到最终差异报告产出的完整流程。

## 🌐 在线演示

**Web 管理端:** https://tommyyula.github.io/inventory-count/

**手持端 (Mobile PWA):** https://tommyyula.github.io/inventory-count/m/login

## 功能特性

### Web 管理端
- 📊 仪表盘 — 盘点计划概览和统计
- 📋 盘点计划管理 — 创建、编辑、删除盘点计划
- 🔒 库存冻结 — 生成库存快照作为盘点基准
- 📦 任务管理 — 自动拆分任务、分配给操作员
- 📈 差异分析 — 自动计算差异，颜色标识
- 🤖 AI 决策 — 基于规则的智能决策建议
- 📄 最终报告 — 生成并导出盘点报告

### 手持端 (Mobile PWA)
- 📱 操作员登录
- 📋 我的任务列表
- 📷 扫码盘点执行
- ✏️ 数量录入（大按钮适合仓库环境）
- ⚠️ 异常标记和跳过
- 📶 离线支持（PWA + IndexedDB）
- 🔄 自动同步

### AI 决策引擎
- 5 条决策规则（基于准确率、差异分布、轮次等）
- 支持完成/全量复盘/部分复盘建议
- 置信度和决策理由展示

## 技术栈

- **前端:** React 18 + TypeScript + Vite
- **UI:** Ant Design 5 (Web) + 自定义移动端组件
- **状态管理:** Zustand
- **离线存储:** IndexedDB (Dexie.js)
- **PWA:** vite-plugin-pwa + Service Worker
- **扫码:** html5-qrcode

## 快速开始

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建
npm run build

# 部署到 GitHub Pages
npm run deploy
```

## 架构设计

### Provider 模式
所有外部数据源通过 Provider 接口抽象，一期使用 Mock 实现：

- `IInventoryProvider` — 系统库存
- `ILocationProvider` — 库位列表
- `IProductProvider` — 产品编码表
- `IAuthProvider` — 用户认证
- `IAdjustmentPublisher` — 盘点结果发布

### 对接三方系统
只需实现对应 Provider 接口并在 `ProviderRegistry` 中注册即可替换 Mock。

## Mock 数据

- 20 个库位（A/B 两个区域）
- 30 个产品（多品类、不同价格段）
- ~100 条库存记录
- 4 个用户（1 管理员 + 3 操作员）

### 测试账号
| 角色 | 用户名 | 端 |
|------|--------|---|
| 管理员 | admin | Web |
| 操作员1 | operator1 | Mobile |
| 操作员2 | operator2 | Mobile |
| 操作员3 | operator3 | Mobile |

## 完整流程

1. **创建盘点计划** (Web) → 设定范围、容忍度、盲盘模式
2. **标记就绪** → 确认计划信息完整
3. **冻结库存** → 生成库存快照
4. **生成任务** → 按区域自动拆分
5. **分配操作员** → 指派给具体操作员
6. **执行盘点** (Mobile) → 扫码/手动录入数量
7. **提交任务** → 操作员完成并提交
8. **进入审核** → 差异分析 + AI 决策
9. **审批/复盘** → 根据 AI 建议决定
10. **最终报告** → 生成并导出

## 目录结构

```
src/
├── domain/          # 领域层（实体、枚举、值对象）
├── providers/       # Provider 接口 & Mock 实现
├── services/        # 业务服务层
├── stores/          # Zustand 状态管理
├── db/              # Dexie.js 数据库 & Repository
├── web/             # Web 管理端
├── mobile/          # 手持端 PWA
└── shared/          # 共享组件和工具
```
