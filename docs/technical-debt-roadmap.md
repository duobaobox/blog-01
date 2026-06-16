# Blog-01 系统治理路线图

这份文档记录的是 **当前仓库在 2026-06-15 时点仍然存在、且值得继续治理的技术债务与业务债务**。

它和 [当前架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md) 的关系是：

- 架构基线：说明哪些边界已经落地，应继续遵守
- 系统治理路线图：说明哪些问题还没治理完，为什么要排优先级，以及下一步怎么做
- [架构审计总览](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-audit-overview.md)：从系统视角盘点当前风险面、治理进展和推荐关注顺序

## 1. 当前判断

项目已经明显走出“最小可用阶段”，并且最近几轮已经完成了几类关键收口：

- `content-space` 的上下文摘要与编辑器选中文章读模型已拆开
- 媒体上传/替换入口已经统一到同一条 runner/workflow 语义
- `settings` 写路径中的“写前读取补默认值”已下沉到 service
- auth bootstrap guard 已从 route 下沉到 `infrastructure` helper
- `posts` 关键读路径已有 explain 基线与索引检查脚本

因此当前最需要避免的，不再是“功能做不出来”，而是：

- 新需求继续绕过这些边界，重新把逻辑堆回页面、action 或 route
- 某些历史上为了快速可用保留下来的实现，在数据量增长或多人运营后开始放大风险
- 发布链路、媒体链路和后台交互链路在真实使用规模下出现“能跑但不可控”的问题

下面的优先级不是理论排序，而是基于当前仓库代码、文档和已有验证结果做的执行顺序建议。

## 2. P0：优先继续治理

### P0.1 数据库交付仍以 `prisma db push` 为主，缺少正式 migration 基线

问题：

- 当前 schema 交付仍主要依赖 `prisma db push`
- 已经补了 `db:diff` 和 explain 脚本，但还没有形成“可审计、可回滚、可顺序演进”的 migration 体系

影响：

- 发布链路对 schema 变更的可追踪性不够
- 一旦后续出现字段约束调整、索引替换、数据回填需求，风险会快速上升
- 多环境发布时更难判断“数据库真实状态是否和仓库一致”

当前进展：

- 仓库已补入 `prisma/migrations` baseline 资产，避免后续 Prisma Migrate 仍从零开始
- 已补 `npm run db:check:migrations`，用于识别当前环境到底是“只有 schema、没有迁移历史”的旧状态，还是已经具备 migration history
- 已补 `npm run db:check:sync-mode`，用于在真正执行 schema sync 之前直接打印当前环境推荐模式
- 已补 `npm run db:preflight:release`，用于把 migration 状态、baseline 计划、siteSetting singleton 检查和可选 schema/perf/backfill 检查收口到统一的发布前入口
- 已开始让 migration 检查脚本直接输出 `environment kind` 与推荐 `DB_SCHEMA_SYNC_MODE`，减少发布时只看到表状态、但仍要人工翻译成部署决策的问题
- 部署链路已补 `DB_SCHEMA_SYNC_MODE`，可以显式区分 `push / migrate / skip`
- app 容器首启与 `migrate` 工具服务现在已开始复用同一套 schema sync helper，减少部署入口长期各自维护分支的风险
- 默认 schema sync 现在也已开始支持 `DB_SCHEMA_SYNC_MODE=auto`，可按环境自动选择 `migrate` 或 `push`
- compose 默认已经不再主动注入 `RUN_DB_PUSH`，让它从“默认配置之一”退回到纯兼容入口，避免继续和 `DB_SCHEMA_SYNC_MODE` 并列
- 但历史环境仍会在 auto 模式下保守回落到 `push`，说明 migrate-first 治理还没有彻底完成

证据：

- [architecture-baseline.md](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md) 已明确写明“当前仓库仍以 `prisma db push` 作为主要 schema 同步方式”
- [README.md](/Users/duobao/个人/个人-网站搭建/blog-01/README.md) 当前初始化和发布说明仍以 `db:push` 为主

建议动作：

1. 保持 baseline migration 与当前 schema 对齐，后续 schema 变更优先新增正式 migration
2. 把 `db:preflight:release` 作为发布前固定入口，减少检查项只存在 checklist 里、但实际执行仍依赖人工串联的问题
3. 对需要数据回填的 schema 变更，明确区分“结构迁移”和“数据修复脚本”
4. 等历史环境 baseline resolve 方案验证稳定后，再逐步把部分环境切到 `prisma migrate deploy`

### P0.2 后台动态页面范围偏大，读模型尚未区分“必须实时”与“可缓存”

问题：

- 当前仍有一部分后台页面带着历史遗留的 `force-dynamic`
- 后台首页、媒体页等读模型已经比早期清晰，但“哪些必须动态、哪些可以分层缓存/按标签失效”还没系统收口

影响：

- 后台所有请求都走最保守策略，后续数据量和访问量上来后会放大服务端渲染压力
- 也会模糊“实时运营面板”和“稳定读模型页面”的边界

证据：

- [src/app/admin/(protected)/page.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/app/admin/(protected)/page.tsx)
- [src/app/admin/(protected)/media/page.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/app/admin/(protected)/media/page.tsx)
- 登录页、setup 页等特殊入口仍保留显式 `force-dynamic`
- 本轮已先去掉多个挂在 `admin/(protected)` layout 下页面的冗余 `force-dynamic`，说明接下来可以继续把重点从“页面级强制动态”转向“哪些后台读模型值得分层缓存”
- 当前已为后台 `媒体 / 分类 / 标签` 只读查询接入 admin cache tag 试点，说明这条路线可以在不打破权限边界的前提下继续扩展
- 当前已将 dashboard 依赖的 `admin post counts` 与 `recent operation logs` 接入 `admin-dashboard` cache tag，说明后台首页也已经开始进入统一缓存治理链路
- 当前已补 `admin-posts` tag，并把 `content-space` 默认树 / 默认 feed / 快捷入口列表逐步接入统一后台读缓存治理
- 当前已把设置页与后台 onboarding reminder 的“站点基础初始化提醒”收回到 settings query 投影，而不是继续在 page/layout 中直接调用 service 或 bootstrap 读取
- 当前已把 `/admin/login` 从“访问时顺手自动初始化管理员”收回到“未初始化则显式跳转 `/admin/setup`”；同时移除了 protected layout 中的用户名回填写路径，避免普通后台访问链路继续承担隐式写库副作用
- 当前 `/admin/setup` 也已收口为“仅在 bootstrap 仍开放时才执行初始化”的显式入口，普通登录/访问路径不再承担默认管理员创建副作用
- 当前账户页的默认密码提醒也已收回到 settings query projection，继续减少后台页面直接依赖 bootstrap helper 的情况
- 当前 dashboard 里的 taxonomy 概览也开始通过投影 helper 进入页面，而不是继续把列表长度计算长期留在页面层

建议动作：

1. 继续盘点后台页面，区分三类：必须实时、可短 TTL、可按标签失效
2. 在去除冗余 `force-dynamic` 之后，继续以媒体页、分类/标签页、只读 dashboard 卡片为试点收缩动态范围
3. 让后台缓存策略也逐步进入统一 helper，而不是只在前台内容输出上做缓存治理
4. 下一步可继续评估 account 页密码提醒、admin shell 级信息和其他轻量运营提示，是否值得继续汇总成更明确的后台投影查询
5. 后续如仍需补齐历史管理员用户名，优先考虑显式脚本、seed 或受控 setup/workflow，而不是重新把回填逻辑放回 layout/page 访问链路

### P0.3 `content-space` 保存视图仍保留“双数据源过渡态”

问题：

- 这一项在当前基线下已经基本完成收口
- 保存视图运行时来源已经完全回到服务端，不再保留 `localStorage` 迁移、兜底或导入入口

影响：

- 运行时双真相源风险已经消除
- `content-space` 客户端主流程不再承担 legacy 保存视图迁移复杂度

证据：

- [architecture-baseline.md](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md) 已明确写明 `localStorage` 只应作为迁移和兜底
- [content-space-saved-view.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/content-space/lib/content-space-saved-view.ts) 已不再包含 legacy 读取/清理 helper
- [content-space-shell.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/components/admin/content-space-shell.tsx) 已不再包含本地 legacy 视图导入状态和按钮

建议动作：

1. 继续把服务端保存视图视为唯一真相源
2. 后续如果还要做类似客户端迁移，优先采用一次性脚本或明确的运维窗口，而不是把迁移逻辑常驻在业务组件里

## 3. P1：中期高价值治理项

### P1.1 媒体元数据仍不完整，后续会限制展示、替换和外部存储演进

问题：

- 媒体记录当前会保存 provider、key、url 等核心定位信息
- 但上传时 `width` / `height` 仍直接写 `null`

影响：

- 前台和后台都无法稳定依赖媒体尺寸做布局、压缩或预览优化
- 后续如果要接图片变体、封面裁切、响应式图片，基础元数据还不够

证据：

- [media.service.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/media/services/media.service.ts) 的 `uploadFile()` 仍把 `width`、`height` 直接写为 `null`

当前进展：

- 上传与替换流程已经开始在 service 层补充图片尺寸解析
- `width` / `height` 不再必须长期停留为 `null`
- 但当前只覆盖基础图片维度，后续如果要做图片变体、封面裁切或更丰富的元数据，仍需要继续扩展

建议动作：

1. 为图片类媒体补充服务端尺寸解析
2. 区分“图片媒体元数据”和“非图片媒体元数据”存储语义
3. 后续把媒体查询层补成真正可供前台图片渲染使用的读模型

### P1.2 媒体引用识别仍依赖 `contentHtml.includes(url)`，语义偏脆弱

问题：

- 这一项已经继续往前推进：文章写入时会从 `coverImageUrl + contentJson` 提取媒体引用，并持久化到 `postMediaReference`
- 媒体引用查询已经不再依赖 `contentHtml.includes(url)` 这类读时推断

影响：

- 媒体库引用查询已经更稳定，也更容易继续扩展到治理报表、删除保护和批量分析
- 但当前写时引用提取仍主要覆盖封面图和正文图片节点，后续如果要覆盖更多节点类型，仍需继续演进

当前进展：

- 新写入和更新的文章已经会同步写入 `postMediaReference`
- 仓库已补历史数据回填脚本入口，便于把旧文章迁入同一套引用模型
- 但历史环境只有在 schema 已同步后运行回填，查询结果才会真正完整

证据：

- [media-reference.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/media/lib/media-reference.ts)

建议动作：

1. 把“正文引用媒体”的识别从 HTML 字符串包含升级为更结构化的数据来源
2. 优先考虑在内容物化或写入时记录明确的媒体引用关系
3. 把“封面引用”和“正文引用”统一纳入一套可查询模型

### P1.3 `siteSetting` 仍按“单行约定”实现，缺少显式唯一语义

问题：

- 这一项已经开始收口：`siteSetting` 现在通过固定 `scopeKey = "default"` 建立显式单例语义
- 后台设置页读模型也已经接入 `admin-settings` cache tag，而不是继续完全依赖页面天然动态

影响：

- 设置读写语义已经更明确，仓储层不再依赖 `findFirst()`
- 但由于当前数据库交付仍以 `db push` 为主，历史环境是否仍然保持单例，仍需要通过发布前检查持续守护

证据：

- [settings.repository.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/settings/repositories/settings.repository.ts)
- [admin-cache.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/infrastructure/cache/admin-cache.ts)
- [scripts/check-site-settings-singleton.ts](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/check-site-settings-singleton.ts)

建议动作：

1. 保持 `scopeKey = "default"` 作为唯一设置入口，避免再引入第二套读写语义
2. 把 `npm run db:check:site-settings` 纳入 schema 发布前检查
3. 等正式 migration 基线建立后，再把这次 schema 约束收口到可审计迁移链路里

### P1.4 后台 dashboard 已经拆出投影，但仍然是持续增长的运营面板

问题：

- 后台首页已经把 overview 和 governance stats 拆成独立投影
- 但 dashboard 本身仍会继续承接更多“想顺手看一眼”的运营信息

影响：

- 如果不提前限定模块边界，dashboard 还是很容易再次膨胀
- 将来会重新把查询、卡片语义和运营规则堆回单页

当前进展：

- dashboard 页面已经开始改为消费 query projection 产出的统一统计卡片 view-model，而不是继续在 page 里手写卡片数组
- taxonomy 概览和治理债务卡片文案也开始复用同一套投影/定义，减少页面层重复维护
- dashboard 首页现在也已开始收敛到单一聚合读模型入口，页面不再自己并行装配 overview / governance / taxonomy / recent activity
- protected layout 的 onboarding/password banner 也开始收回到单一 shell projection，layout 不再自己直接碰 bootstrap helper
- settings 页也开始改为消费单一 page-data query，不再在 page 内部并行拼接 settings 与 setup notice
- account 页也开始把“默认昵称 + 默认密码提醒”收回到 page-data query，页面不再自己组合 session 与安全状态
- 后台壳层 query 现在也开始复用独立的 admin session identity helper，不再让多个 page-data query 各自直接依赖完整 session
- `content-space` 的 admin posts 聚合查询也开始暴露 query factory，便于直接测试重型工作台的查询计划分支，而不是只依赖 page-data 纯函数测试

证据：

- [src/app/admin/(protected)/page.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/app/admin/(protected)/page.tsx)
- [src/features/posts/queries/post.queries.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/posts/queries/post.queries.ts)
- [src/app/admin/(protected)/layout.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/app/admin/(protected)/layout.tsx)
- [src/features/settings/queries/settings.queries.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/settings/queries/settings.queries.ts)
- [src/app/admin/(protected)/settings/page.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/app/admin/(protected)/settings/page.tsx)
- [src/app/admin/(protected)/account/page.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/app/admin/(protected)/account/page.tsx)
- [src/features/content-space/queries/content-space.query.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/content-space/queries/content-space.query.ts)
- [src/features/content-space/queries/content-space.query.test.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/content-space/queries/content-space.query.test.ts)
- 当前页已包含文章总览、治理债务、分类标签统计和最近操作日志

建议动作：

1. 为 dashboard 明确模块边界：总览、治理、近期活动三块继续分投影维护
2. 后续新增运营信息优先进入独立 query/projection，再由聚合 dashboard query 统一装配，而不是直接扩展页面
3. 如继续增长，可继续把 account、settings 页头部说明或其他 admin shell 轻量提示沿同样模式收成聚合读模型
4. 后续如还有后台 page-data 依赖身份信息，优先继续复用 admin session identity query，而不是重新把 `requireAdminSession()` 散回多个页面或 query

## 4. P2：可计划推进的长期优化

### P2.1 `content-space` 会话状态仍保留本地存储语义

问题：

- 当前工作区 session 仍通过 `window.localStorage` 读写
- 它对单机单浏览器体验友好，但不是长期最稳定的上下文恢复机制

影响：

- 多设备、无痕模式或浏览器清理缓存时体验不可控
- 如果后续希望“用户重新登录后恢复上次工作区”，还需要服务端化

证据：

- [workspace-session.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/features/content-space/lib/workspace-session.ts)

建议动作：

1. 短期保持现状即可
2. 中长期如果 `content-space` 成为高频运营台，可考虑把 session 恢复也纳入用户级持久化

### P2.2 posts explain 基线已建立，但样本规模仍偏小

问题：

- explain 和 analyze 脚本已经有了
- 当前本地样本量只有 24 篇文章，尚不足以验证更高数据规模下的真实 planner 选择

影响：

- 现在的结论主要是“当前不慢”，还不是“未来也稳”
- 复杂索引与聚合优化的收益仍缺少更大样本下的证据

证据：

- [posts-query-baseline.md](/Users/duobao/个人/个人-网站搭建/blog-01/docs/performance/posts-query-baseline.md)

建议动作：

1. 扩大 demo 数据规模，再重跑 `db:explain:posts` / `db:explain:posts:analyze`
2. 优先继续观察 `Admin metrics snapshot`
3. 后续如果样本量上来，可把 explain 检查纳入更固定的性能回归流程

### P2.3 默认管理员 bootstrap 已拆分开发便利和生产初始化

问题：

- 这一项在当前基线下已经完成收口
- 默认管理员自动创建仅保留在非生产、未设置 `ADMIN_SETUP_TOKEN` 的开发便利模式
- 生产环境或显式配置 `ADMIN_SETUP_TOKEN` 时，统一进入 `/admin/setup` 手动初始化表单

影响：

- 生产初始化不再依赖默认账号/默认密码
- 开发便利和生产初始化有独立模式判断，后续维护入口更清楚

证据：

- [README.md](/Users/duobao/个人/个人-网站搭建/blog-01/README.md)
- [admin-setup-form.tsx](/Users/duobao/个人/个人-网站搭建/blog-01/src/components/admin/admin-setup-form.tsx)
- [bootstrap-mode.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/infrastructure/auth/bootstrap-mode.ts)
- [admin-entry.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/infrastructure/auth/admin-entry.ts)
- [bootstrap.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/infrastructure/auth/bootstrap.ts)
- [bootstrap-signup.ts](/Users/duobao/个人/个人-网站搭建/blog-01/src/infrastructure/auth/bootstrap-signup.ts)

后续维护规则：

1. 不再把生产初始化重新接回默认管理员自动创建
2. 如后续增加多用户初始化，也应扩展 manual setup workflow，而不是复用开发默认账号路径

## 5. 推荐执行顺序

如果按接下来几轮治理的投入产出比排序，建议顺序是：

1. 数据库 migration 基线
2. 后台动态页面/缓存范围收缩
3. `content-space` 保存视图从双数据源过渡到服务端单真相源
4. 媒体元数据与媒体引用模型升级
5. `siteSetting` 单例约束收口
6. 更大样本量下的 posts explain 回归

## 6. 工作方式建议

后续继续治理时，建议保持现在这条节奏：

1. 先用文档和测试把“边界”写清楚
2. 每次只收一类高价值债务，不做横向大重写
3. 每完成一轮，都补上针对性测试和 `lint/build`
4. 新增能力前，先检查是否已经有对应的 action runner / service / cache helper / query projection 可复用

这样更像是在给项目建立“可持续演进的轨道”，而不是一次性大翻修。
