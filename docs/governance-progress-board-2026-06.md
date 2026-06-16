# Blog-01 系统治理进度表（2026-06）

这份文档的目标只有一个：

- 避免后续治理继续变成“有在改，但看不出阶段结果”

它不替代架构文档，而是把当前治理工作收成一个 **阶段看板**：

- 现在处于哪个阶段
- 哪些治理线已经收口
- 哪些仍在进行中
- 下一步只允许继续打哪几条
- 每条线什么才算真正完成

相关文档：

- [阶段性系统状态（2026-06）](/Users/duobao/个人/个人-网站搭建/blog-01/docs/system-status-2026-06.md)
- [架构审计总览](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-audit-overview.md)
- [当前架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md)
- [系统治理路线图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/technical-debt-roadmap.md)

## 1. 当前阶段

当前不是“继续做架构梳理”的阶段，而是 **中后段收口治理阶段**。

一句话判断：

- 核心边界已经大体成型
- 最危险的几条线已经不再完全失控
- bootstrap 初始化模式也已完成拆分，本阶段主要治理线已经可以宣布收口

当前更适合的工作方式不是继续发散改，而是：

1. 只围绕少数主线推进
2. 每轮改动必须能归入某个进度项
3. 每条线都要有明确“完成标准”

### 1.1 本阶段的实际目标

当前阶段不是追求“理论上更优雅”，而是先拿到两个现实目标：

1. 发布基线
   目标：当前 blog 系统可以按受控流程稳定发布，不再依赖临场判断
2. 扩展基线
   目标：后续新增页面、读模型、发布脚本时，有明确轨道可复用，不再回到边写边散的状态

如果某项改动既不能提升“发布基线”，也不能提升“扩展基线”，当前阶段原则上不做。

## 2. 阶段里程碑

后续治理只按下面三个里程碑推进，不再开放式展开。

### M1. 发布基线完成

范围：

- 数据库交付治理收尾
- 发布前检查、发布文档、部署入口语义完全对齐
- 历史环境、新环境、异常环境都有清晰处理路径

达到这个里程碑后，项目应具备：

- 可以稳定发布
- 发布前知道该检查什么
- 发布失败时知道先看哪里

### M2. 后台扩展基线完成

范围：

- 后台页面统一入口模式定型
- 后台 page-data / shell projection / admin session identity 成为默认模式
- 新增后台只读页时不再重新发明入口

达到这个里程碑后，项目应具备：

- 后台新页面可以沿现有模式扩展
- 后台页面默认不再自己拼 session / 聚合查询 / 提醒逻辑

### M3. 中期能力补强

范围：

- `content-space` 工作台继续稳固
- 后台热点查询缓存与 explain 证据补强
- 媒体展示读模型继续演进

达到这个里程碑后，项目应具备：

- 不是只有“结构规范”，而是对中期数据量和运营复杂度也有更强支撑

## 3. 总进度看板

| 治理主线 | 当前状态 | 进度判断 | 已有结果 | 完成标准 |
| --- | --- | --- | --- | --- |
| 数据库交付治理 | 已收口 | 100% | baseline migration、`db:preflight:release`、`DB_SCHEMA_SYNC_MODE=auto`、migration coverage、统一 schema sync 判定、三类环境发布路径、必跑门禁清单与 migration readiness 矩阵已落地 | 历史环境切换到 migrate-first 的规则稳定，发布前检查与实际部署语义完全一致 |
| 后台读模型与页面入口治理 | 已收口 | 100% | dashboard、settings、account、layout、media、categories、tags、posts 工作台已进入 page-data / projection；admin session identity 已抽出；protected admin entry 与 admin component projection 测试已落地 | 后台页面默认只消费 page-data query；新增后台页不再直接拿 session、不再在 page/layout 拼读模型 |
| `content-space` 工作台治理 | 已收口 | 100% | `library/recent` 拆分、query plan、selected/requested post 分离、服务端保存视图、可测试聚合 query、posts 工作台缓存矩阵、versioned workspace session 恢复策略已落地 | 会话恢复、重型查询、上下文摘要和工作区状态进一步稳定，避免再次退化成大页面聚合 |
| 媒体链路与展示读模型 | 已收口 | 100% | 上传/替换 workflow、尺寸解析、引用持久化、删除保护、public media presentation、前台消费的 display variants 已落地 | 前台图片展示读模型、元数据能力、变体能力形成体系 |
| 后台缓存与性能治理 | 已收口 | 100% | admin cache tag、dashboard/media/taxonomy/settings 基础缓存治理、posts explain baseline、admin posts feed 缓存条件测试、可放大 demo 性能样本已落地 | 热点后台读路径的缓存策略和 explain 证据更完整，可持续回归 |
| bootstrap / 初始化模式拆分 | 已收口 | 100% | `/admin/login` 与 `/admin/setup` 已分离，普通访问链路不再隐式初始化；开发默认管理员与生产手动初始化已拆分 | 明确区分开发便利模式与生产初始化模式，不再共处一套机制 |

## 4. 已完成阶段成果

这些事项已经不应再按“没有结果的改动”看待。

### 3.1 数据库交付

- baseline migration 已入仓
- `db:check:sync-mode`、`db:check:migrations`、`db:check:migration-coverage` 已形成统一语义
- `db:preflight:release` 已变成发布前固定入口
- app 首启与 tools `migrate` 已复用统一 `schema-sync.sh`
- `DB_SCHEMA_SYNC_MODE=auto` 已成为默认判定模式
- 新环境、历史 baseline 过渡环境、已纳入 migration 管理环境、异常阻断环境的发布路径已写入 checklist / guide，并进入 `db:preflight:release -- --help`
- 发布前默认必跑门禁已由 `DB_RELEASE_REQUIRED_GATE_IDS` 固化，`baseline-ready` 与 `migration-ready` 的运维差异已由 readiness matrix 和 checklist 固化

### 3.2 后台读模型

- dashboard 已切到单一聚合 page-data query
- settings 已切到 page-data query
- account 已切到 page-data query
- protected layout 已切到 shell projection
- media / categories / tags 已切到 page-data query
- posts 新建/编辑入口已收敛为重定向到统一工作台，protected admin page/layout 已有测试防止直接拿 session 或 DB 读模型
- admin session identity 已抽成共享入口
- protected admin page/layout 入口测试已改为自动发现新增页面，admin UI component 也有测试防止 bootstrap/session/db 读模型回流

### 3.3 `content-space`

- `library` 与 `recent` 不再混用
- `requestedPost` 与 `selectedPost` 已拆开
- page data 会先构建 query plan，再按需加载上下文
- 保存视图已回到服务端单真相源
- posts 工作台 recent/library feed 的缓存条件已文档化并有测试覆盖，搜索与筛选路径不会误用无过滤缓存
- workspace session 已升级为 versioned payload，支持搜索、筛选、分页、文件夹和文章恢复，并保留旧 payload 兼容

### 3.4 媒体链路

- 上传、替换、删除保护已进入统一 workflow
- 图片尺寸已可在服务端解析并持久化
- `postMediaReference` 已进入写路径和历史回填链路
- 公共站点已开始消费 media presentation 读模型
- media presentation 已提供 `thumbnail` / `card` / `original` display variants，博客列表与文章详情页已消费变体尺寸

## 5. 已收口的主线

本阶段剩余主线已经收口。后续进入维护状态：新增能力仍要沿这些轨道走，避免重新发散。

### A. 数据库交付治理收尾

当前结论：

- 已经能判定环境
- 已经能阻止明显错误模式
- 历史环境切换到 migrate-first 的发布路径、门禁和 readiness 差异已固化

完成标准：

- 发布时不再需要临场人工翻译 migration 状态
- 新环境、旧环境、异常环境各自都有稳定路径

已完成证据：

1. 已收紧发布文档和操作清单，明确三类环境与异常环境的标准操作
2. `db:preflight:release` 必跑门禁由 `DB_RELEASE_REQUIRED_GATE_IDS` 测试覆盖
3. “baseline-ready”和“migration-ready”的实际运维差异由 readiness matrix、help text 和 release checklist 固化
4. release checklist 已明确默认门禁与 `--schema` / `--posts` / `--media` 加严检查的边界

### B. 后台页面统一入口模式

当前结论：

- 后台只读页已经进入 page-data query / shell projection
- 这套模式已经通过自动发现测试变成默认入口规则

完成标准：

- 后台页面默认只做渲染
- 后台 query 默认承接聚合读模型和页面默认值
- 后台身份信息默认只通过最小 session identity 进入 query 层

已完成证据：

1. `src/app/admin/admin-page-entry-pattern.test.ts` 会自动发现 protected admin page/layout
2. protected page/layout 禁止直接拿 session、DB 或 auth helper
3. admin UI component 禁止直接装配 bootstrap/session/db 读模型，默认通过 props 消费 query projection
4. 新增后台只读页仍应先补 page-data query，再接页面

### C. `content-space` / 性能中期能力

当前结论：

- 工作台边界已经明显改善
- query plan / page-data / workspace session / 热点读路径缓存证据已经形成闭环

完成标准：

- 工作台查询计划分支稳定、可测试
- 重读路径具备更明确的缓存/性能证据

已完成证据：

1. 已继续守住 `content-space` 的 query plan / page-data 分层，并补充 protected admin entry 测试
2. 已补 posts 工作台 recent/library feed 缓存矩阵和 predicate 测试，继续沿 posts explain baseline 观察热点读路径
3. workspace session 已升级为 versioned payload，并支持搜索、筛选、分页、文件夹和文章恢复
4. demo posts 可通过 `--scale` 放大样本后重跑 explain / analyze

## 6. 发布视角下的优先级

如果只从“尽快形成稳定发布基线”出发，后续优先级固定如下：

1. 数据库交付治理
2. 发布文档、发布检查、部署脚本的一致性
3. 后台页面统一入口模式
4. 后台热点查询缓存与性能证据
5. `content-space` 中期能力
6. bootstrap 模式拆分

上述 6 项现在均已收口，后续只按维护规则增量演进。

## 7. 暂时不要继续发散的方向

以下方向不是不能做，而是当前阶段不应优先展开：

- 大范围重写 feature 目录结构
- 提前做“理想化”的全局架构重构
- 同时并行推进 5 条以上治理线
- 在没有明确进度项的情况下继续零散优化页面
- 先做 bootstrap 深拆，再回头补数据库交付

## 8. 单轮施工规则

从现在开始，每一轮治理只允许选择下面三类之一：

1. 发布链路收尾
2. 后台页面入口收尾
3. `content-space` / 性能补证据

每轮最多选一类，不并行开新主线。

每轮开始前必须先写清楚：

1. 本轮属于哪个里程碑
2. 本轮属于哪条治理主线
3. 本轮准备完成哪一个具体待办
4. 本轮结束后，进度表上哪一项会前进

如果回答不了这四个问题，这轮就不应该开工。

## 9. 后续维护建议

本阶段不再需要继续开新的收口任务。如果后续继续推进，建议只按下面维护方式执行：

1. 数据库发布前继续固定跑 `npm run db:preflight:release -- --schema`
2. 新增后台只读页继续先补 page-data query，并让 `admin-page-entry-pattern.test.ts` 通过
3. posts 查询或索引变化后，用放大 demo 样本重跑 `db:explain:posts` / `db:explain:posts:analyze`
4. 新增媒体展示能力优先扩展 media presentation variants，不在页面里临时拼尺寸逻辑
5. 初始化入口继续保持开发默认管理员和生产手动 setup 分离，不把生产初始化重新接回默认密码账号

## 10. 每轮治理的交付要求

从这份进度表开始，后续每轮改动建议都满足这几个要求：

1. 先说明本轮属于哪条治理主线
2. 说明本轮完成后，进度表上哪一项会前进
3. 说明本轮的“完成标准”是什么
4. 完成后更新相关文档状态
5. 至少补针对性测试，必要时再跑 `lint/build`

额外要求：

- 如果只是“感觉还能优化”，但没有进入某个里程碑或主线，就先不做
- 如果改动不能产出明确结果物，比如脚本、文档、测试、门禁、页面入口规范，也先不做

## 11. 暂定完成判定

当前已经满足下面条件，可以说系统已经达到“规范、可发布、可继续扩展”的阶段目标：

1. 数据库交付治理达到 M1
2. 后台页面统一入口治理达到 M2
3. 至少有一轮 `content-space` / 热点查询性能证据补强

因此当前项目应被视为：

- 已进入规范化轨道
- 可以受控发布
- 主要治理线已收口

## 12. 当前推荐的阶段结论

现在这个项目不再适合用“继续看看还能优化什么”的方式推进。

更适合的表述应该是：

- 数据库交付治理：已收口
- 后台页面入口治理：已收口
- `content-space` / 性能治理：已收口，后续按证据维护
- 媒体展示读模型：已形成 presentation + variants 体系
- bootstrap 深拆：已完成开发便利模式与生产初始化模式拆分

如果后续继续改动，但不能明确落在这四个判断里，那大概率就是又开始发散了。
