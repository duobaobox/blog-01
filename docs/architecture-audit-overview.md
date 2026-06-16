# Blog-01 架构审计总览

这份文档是 **当前仓库在 2026-06-15 之后的系统审计总览**。

它不替代：

- [当前架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md)
- [系统治理路线图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/technical-debt-roadmap.md)

三者的分工是：

- 架构基线：哪些边界已经落地，后续应继续遵守
- 系统治理路线图：哪些债务还没治理完，以及建议的优先顺序
- 架构审计总览：从系统视角盘点当前风险面、治理进展和下一步关注点

## 1. 当前总判断

项目当前已经不再处于“最小可用”状态，而是进入了 **需要持续控制演进方向** 的阶段。

从仓库当前实现看，项目最主要的风险已经不是“功能缺失”，而是：

- 读写边界是否会被新需求重新打散
- 部署与数据库交付链路是否足够可解释
- 后台运营读模型是否会再次膨胀成难以维护的聚合页
- 一些已经从 MVP 时代遗留下来的兼容语义，是否会在未来继续放大认知成本

当前最积极的信号是：过去几轮治理已经不是停留在文档层，而是已经把若干高价值边界真正收口进代码。

## 2. 风险矩阵

| 领域 | 当前状态 | 风险等级 | 现状判断 | 下一步建议 |
| --- | --- | --- | --- | --- |
| 业务分层与写路径 | 已形成基线 | 低 | `action -> service -> repository -> cache invalidation` 已较稳定，新增写逻辑开始能沿既有 runner/workflow 扩展 | 新增功能时坚持复用现有 service / action runner，不把流程再堆回页面 |
| 后台读模型与缓存治理 | 治理进行中 | 中 | dashboard、taxonomy、media、settings、content-space 默认读面已逐步进入 admin cache / query projection，但后台仍有继续膨胀的风险 | 继续收 dashboard / account / admin shell 的轻量提醒与投影，避免页面继续扩 Promise.all |
| 公共站点读模型 | 基本稳住 | 低 | public slug 读取、taxonomy public/admin 语义、feed/sitemap/robots 独立读模型已明确 | 后续新增公共输出时保持 public query 语义，不回退到 route 内拼查询 |
| `content-space` 工作台 | 主体已收口 | 中 | query plan、summary/feed 拆分、保存视图服务端化已经完成，但 session 恢复仍是浏览器本地语义 | 如果运营台使用频率继续升高，再评估用户级持久化 session |
| 媒体链路 | 明显改善但未完结 | 中 | 上传/替换 workflow 已统一，已补尺寸解析、引用持久化、删除保护；但更丰富图片元数据与变体能力仍未形成体系 | 后续如做前台图片优化，优先补媒体展示读模型，而不是在组件层零散推断 |
| 数据库交付 | 仍是首要风险面 | 高 | baseline migration、preflight、mode recommendation、shared schema sync helper 都已落地，默认执行层也开始按环境自动选择 `migrate`/`push`，但历史环境迁移策略仍在过渡 | 继续把历史环境迁移策略和新环境默认策略讲清，再逐步推动 migrate-first |
| 初始化与 bootstrap 语义 | 比前期清晰很多 | 中 | `/admin/login`、`/admin/setup`、seed、bootstrap token 的边界已经比以前清楚，但“开发便利”和“生产初始化”仍共处一套机制 | 暂时保持现状，等数据库交付进一步稳定后再决定是否再拆模式 |
| 性能与索引验证 | 有基线但证据还不够强 | 中 | posts explain、聚合快照索引和性能基线已建立，但样本规模仍偏小 | 未来用更大样本重跑 explain/analyze，把热点聚合查询持续纳入观察 |

## 3. 已完成的高价值治理

以下事项已经不应再按“未治理”处理：

### 3.1 后台读写边界

- 后台 onboarding / setup reminder 已收回到 query projection
- `/admin/login` 不再在普通访问链路里隐式创建默认管理员
- `/admin/setup` 已变成显式且受控的初始化入口
- protected layout 不再承担用户名回填写库副作用

### 3.2 `content-space` 工作台

- `library` / `recent` feed 语义已拆开
- page data 装配会先产出 query plan，再按需加载上下文
- `requestedPost` 与 `selectedPost` 已明确区分“上下文摘要”和“编辑实体”
- 保存视图已回到服务端持久化，不再依赖长期 `localStorage` 作为唯一真相源

### 3.3 媒体治理

- 上传/替换都已统一进 workflow
- 图片尺寸已在服务端解析并持久化
- `postMediaReference` 已进入写路径与历史回填流程
- 媒体引用查询不再依赖 `contentHtml.includes(url)` 推断
- 媒体删除已具备引用冲突保护

### 3.4 数据库交付辅助能力

- baseline migration 已入仓
- migration state / baseline plan / site settings singleton / backfill / explain 都有独立脚本
- 已补统一 `db:preflight:release`
- 已补 `environment kind` 和推荐 `DB_SCHEMA_SYNC_MODE`
- app 首启和 `migrate` 工具服务已复用统一 `schema-sync.sh`
- `RUN_DB_PUSH` 已从 compose 默认主配置降级为兼容入口

## 4. 仍然值得关注的高风险面

### 4.1 数据库仍未真正 migrate-first

虽然数据库交付辅助能力已经明显增强，但当前仓库的真实交付状态仍是：

- 可以审计
- 可以判断环境模式
- 可以演练 baseline
- 默认执行层已经开始按环境自动选择 `migrate` 或 `push`
- 但历史环境仍需要 baseline resolve 后，才能真正稳定转向 migrate-first

这意味着数据库交付风险已经从“完全不可见”下降成“可见但未完全收口”。

### 4.2 后台读模型仍可能重新膨胀

dashboard、content-space、settings、account 这些后台壳层页面，已经开始形成投影化方向，但仍要持续防止：

- 页面层继续堆新的聚合查询
- 把一次性提醒、统计、筛选逻辑重新塞回 layout/page
- 把本该单独缓存的只读投影重新混入会话态或编辑态装配

### 4.3 风险文档与真实实现需要持续同步

当前路线图已经非常有价值，但其中少数风险描述会随着治理推进而“过期”。

典型例子：

- 媒体尺寸元数据已经不再是完全缺失
- 媒体引用查询已经不再依赖 HTML 包含判断

因此后续每轮治理后，最好都像本轮一样同步修正文档，而不是让风险台账滞后于代码。

## 5. 当前建议的执行顺序

从投入产出比看，接下来更推荐的节奏是：

1. 继续数据库交付治理，直到“环境判断、部署模式、发布检查”三者完全对齐
2. 再继续收后台读模型，把 dashboard / account / admin shell 的剩余投影边界做干净
3. 然后回到媒体展示读模型和更大样本 explain，验证中期扩展能力
4. 最后再考虑把 bootstrap 的“开发便利模式”和“生产初始化模式”进一步拆开

## 6. 如何使用这份文档

后续如果继续系统治理，建议这样用：

1. 先看这份总览，确定当前问题属于哪个风险面
2. 再看 [技术债路线图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/technical-debt-roadmap.md)，确认它属于 P0 / P1 / P2 哪一层
3. 最后回到 [架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md)，确认改动不会破坏已经收好的边界

这样后续每一轮治理都能同时兼顾：

- 局部改动是否正确
- 全局方向是否还在正轨上
