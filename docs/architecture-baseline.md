# Blog-01 架构基线

这份文档描述的是 **当前仓库已经落地并通过验证的架构基线**。

它不是未来理想图，也不是一次性重构提案，而是维护这个项目时应优先遵守的现状规则。后续新增功能时，应尽量沿着这些边界扩展，而不是把逻辑重新堆回页面、action 或杂项工具文件。

## 1. 当前架构结论

当前项目最合适的定位是：

- `Next.js App Router` 上的模块化单体
- 以 `features/*` 作为业务边界
- 以 `actions / services / repositories / queries / lib / components` 作为主要分层
- 以 `shared/*` 放通用能力
- 以 `infrastructure/*` 放技术实现与运行时治理

目前已经成型的关键横切面有两条：

- 写路径规则：`input parser -> action -> service -> repository -> cache invalidation`
- 错误协议规则：`AppError -> API error mapping -> UI fallback message`

## 2. 目录职责

### `src/app`

负责路由、页面组合、Route Handler。

适合放：

- 页面入口
- 路由参数解析
- 页面级组合
- API route 的 HTTP 输入输出
- 普通访问链路默认保持“读入口”语义；初始化、回填、修复类写操作应优先通过显式 setup、seed、action 或运维脚本触发，而不是挂在 layout / page 的日常渲染路径里
- 如果某段后台路由已经通过上层 layout 的 `session / cookies / redirect` 边界天然动态，页面文件本身不应再重复叠加历史遗留的 `force-dynamic`，除非它还有额外的动态约束

不适合放：

- 复杂业务校验
- 多实体写入流程
- 缓存策略细节
- 数据库查询细节

### `src/features/*`

按业务域组织代码。当前主要有：

- `posts`
- `taxonomy`
- `media`
- `content-space`
- `settings`
- `editor`
- `auth`

每个 feature 内部优先遵守下面的职责边界。

### `actions`

负责服务端写入口，通常由 Server Action 承担。

当前 action 层应只做这些事：

- 鉴权
- 解析输入
- 调用 service
- 执行缓存失效
- 如需依赖现有持久化数据来补全默认值、恢复旧配置或决定最终写入语义，这类“写前上下文读取”应优先下沉到 service/workflow，不应由 action 为 parser 额外发起查询

当前 action 层不应再承担这些事：

- 复杂表单清洗
- slug 规则
- 状态机或发布规则
- 仓储级多步写入
- 直接拼接公共缓存路径

### `services`

负责业务规则和写入工作流。

当前 service 层承担的典型职责包括：

- 文章 slug 生成与发布逻辑
- taxonomy / folder 的存在性约束与创建流程
- media provider 选择、替换与元数据更新；原路径替换只允许相同 MIME 类型，避免文件扩展名与内容格式不一致
- 文章操作审计日志记录
- 文章内部/已发布双状态切换与永久删除
- 后续可继续承接审计扩展，但不再引入待发布、归档等中间生命周期

如果某段逻辑需要：

- 访问多个 repository
- 组合多步写入
- 决定状态迁移
- 统一返回“变更前快照 + 变更后实体”

优先放到 service，而不是 action。

### `repositories`

负责 Prisma 数据访问。

当前规则：

- repository 负责数据库查询与写入实现
- repository 返回结构尽量稳定
- 上层不应直接依赖 Prisma 语法细节
- 高频读路径如果只是在 select 或 order 上有差异，应优先复用同一套 repository 内部 where/order helper，而不是复制第二份 `findMany` 装配逻辑
- schema 索引应优先围绕已经存在的高频读模型设计，例如 `status + updatedAt`、`status + publishedAt` 这类后台/前台列表排序路径，而不是只保留最小可用索引

适合放：

- `findById`
- `findMany`
- `create / update / delete`
- 事务性多表更新

### `queries`

负责读模型查询。

当前查询层和写入层是分离的：

- `queries` 面向页面和接口读需求
- `services/actions` 面向写需求
- 管理端概览只聚合内部和已发布两种真实产品状态，避免页面层反复拼接多次 `count` 查询
- 分类、标签、摘要和 SEO 都是可选元数据；后台不得把缺少这些字段展示为治理欠债
- 后台首页统计卡片的最终展示模型，也应由 query projection 统一产出；页面只负责把 `iconKey / href / label / value` 渲染出来，不再自己拼卡片数组
- 后台首页里的 taxonomy 概览（如分类数、标签数）也应通过独立投影 helper 进入 dashboard，而不是长期由页面自行拿列表后再数长度
- 后台首页 page 应优先只依赖单一聚合读模型入口，例如 `dashboard page data query`；不要在 page 里持续扩展 `Promise.all(...)` 直接拼 overview / taxonomy / recent activity
- 后台 onboarding / setup reminder 也应视为读模型投影，由 query 层统一组合；layout 或 page 不应继续直接拼接 settings service / bootstrap 读取
- 后台账户安全提醒（如默认密码仍在使用）也应视为读模型投影；账户页不应继续直接依赖 bootstrap helper 获取展示状态
- protected admin layout 里的 banner / reminder 状态也应优先走单一 shell projection，例如 `admin shell status query`，避免 layout 直接读取 bootstrap helper 再和 settings 提醒做页面级拼装
- settings/account 这类后台壳层页面也应优先使用 page-data query，把表单默认值、setup notice、安全提醒等展示态统一收回查询层，而不是在 page 内部维持零散 `Promise.all`
- 如果后台 page data 仍依赖会话字段，优先复用独立的 `admin session identity query`，只暴露 `id / name / role` 这类最小身份片段；不要让页面或多个 query 各自直接持有完整 session 再继续拼展示态
- 公共博客列表、分类页、标签页这类同构分页页面，应优先复用同一套分页请求解析 helper，而不是各自重复处理 `page` 参数和越界逻辑
- 公共列表卡片、首页精选/最新内容应优先使用面向前台展示的轻量投影查询，不要直接复用后台列表页的重 select
- “按 slug 读取公开文章”和“写路径里检查 slug 是否已占用”必须是两条不同的 repository 语义：前者只看已发布内容，后者必须覆盖所有状态
- 公共分类/标签列表与详情读取，也必须和后台/写路径语义分开；前台详情页只应暴露仍然关联已发布文章的 taxonomy，不应把“后台存在但前台为空”的实体直接公开
- `feed.xml`、`sitemap.xml`、SEO 等站点输出也应视为独立公共读模型；Route Handler / route file 只负责协议格式化，不直接拼装业务查询和更新时间规则
- 公开站点输出默认应复用统一的公共缓存 TTL 与标签失效策略；除非确有实时性要求，不应把 `feed.xml`、`sitemap.xml`、`robots.txt` 长期维持为 `force-dynamic`
- 后台只读查询如果已经有稳定的写后失效入口，也应优先进入统一的 admin cache tag / revalidate helper，而不是长期停留在“页面天然动态所以不做任何读缓存治理”的状态
- 后台首页这类聚合页也应遵守同样原则：先拆成可独立失效的投影查询，再逐步接入 admin cache tag，而不是把整个 dashboard 永久视为不可治理的实时页
- `siteSetting` 应视为显式单例读模型；仓储层优先通过固定 singleton key 读取/写入，而不是继续依赖 `findFirst()` 这类隐式约定

后续继续扩展时，优先保持“读写分离”，不要把读逻辑塞回 action。

### `content-space` 读模型边界

后台文章管理已收敛为单一主流程：`文件夹 → 当前文件夹笔记列表 → 编辑器`。

当前规则：

- 文件夹只负责组织私人笔记，是工作台的唯一主导航维度；笔记必须归属文件夹
- 产品层只暴露“内部 / 已发布”两种状态；数据库技术值沿用 `draft / published`，只有 `published` 对外成为 Blog
- 分类、标签、摘要和 SEO 是可选发布元数据，不作为创建笔记的前置条件
- 搜索和状态筛选只作用于当前文件夹，不再维护全局 `library / recent` feed
- 后台概览只保留内部、已发布及 taxonomy 数量
- 已放弃的保存视图、快捷入口、工作台 session 恢复和旧查询计划不再继续扩展
- 取消发布会把文章切回内部；删除是经过输入确认的永久删除，不提供归档和恢复
- 页面只消费 `getAdminPostsPageData()`，不在页面层拼装数据库读模型

### `lib`

feature 内的 `lib` 主要放该业务域内的轻量纯函数或输入解析逻辑。

当前已落地的代表：

- `src/features/posts/lib/post-write.ts`
- `src/features/taxonomy/lib/taxonomy-write.ts`
- `src/features/content-space/lib/folder-write.ts`

这些文件的职责是：

- 解析 `FormData`
- 规范化输入
- 做轻量同步校验

### `components`

放业务域 UI 组件。

原则：

- 组件负责交互与展示
- 不承担复杂服务端写规则
- 尽量通过 action / API 调用后端能力

### `src/shared/*`

放真正跨业务域复用的能力。

当前关键内容包括：

- `shared/lib/app-error.ts`
- `shared/lib/api-error.ts`
- `shared/lib/validation.ts`
- `shared/lib/slug.ts`
- `shared/lib/url.ts`
- `shared/ui/*`

只有在多个 feature 之间都成立的规则，才适合放进 `shared`。

### `src/infrastructure/*`

放与运行时和技术实现强绑定的能力。

当前关键目录：

- `infrastructure/auth`
- `infrastructure/cache`
- `infrastructure/db`
- `infrastructure/markdown`
- `infrastructure/seo`

当前规则：

- `infrastructure` 可以依赖 `shared`、repo 或轻量纯函数 `lib`
- 但应尽量避免反向依赖 feature `service`，尤其不要让基础设施层为了读状态再回头穿透到业务 service
- `infrastructure/storage`

这里优先放：

- 技术接入
- 运行时治理
- 缓存与鉴权边界
- 数据库 schema 演进与交付辅助脚本
- 对特殊协议入口的 guard 与上下文恢复也应优先收敛在 infrastructure helper 中，例如首个管理员 bootstrap、token 校验、协议特定错误语义；Route Handler 只保留协议适配，不再直接拼接这些分支

## 4. 数据库变更基线

当前仓库已经包含 Prisma baseline migration，并以 `DB_SCHEMA_SYNC_MODE=auto` 作为默认 schema 同步入口。
空库、baseline-ready 和 migration-ready 环境会优先走 `migrate deploy`；历史无迁移记录的数据库会保守使用 `db push`，直到完成 baseline resolve；失败或未完成的 migration 会直接阻断启动。

在这个前提下，当前基线要求是：

- 仓库内应持续保留与当前 schema 对齐的 migration 资产，避免后续 schema 演进重新回到黑盒 `db push`
- 修改 `prisma/schema.prisma` 时，应同时考虑发布链路是否能安全感知这次变更
- 对已有数据库做 schema 发布前，应优先执行 `npm run db:diff` 预览差异，避免把索引、字段或约束调整作为“黑盒变更”直接推上去
- 对已有数据库是否已经进入 migration 模式，应优先执行 `npm run db:check:migrations` 判断；不要在未知历史状态下直接切换到 `prisma migrate deploy`
- 部署入口应优先通过显式 schema sync mode 表达当前环境策略，例如 `push / migrate / skip`，而不是继续只靠布尔变量隐式约定
- 容器首启与手动 schema 同步工具入口，也应尽量复用同一套 schema sync mode 解析逻辑，避免 `app` 和 `migrate` 路径长期分叉
- 兼容旧部署环境的布尔型 schema sync 变量不应再作为新配置的默认入口；如果仍保留，应明确退居兼容层，而不是继续和主配置并列
- 高频读路径相关索引调整，至少要在文档或脚本层具备可检查入口，不能只停留在 schema 文件改动
- 对关键读路径的索引优化，优先补充可执行的 `EXPLAIN` 检查脚本，例如 `npm run db:explain:posts`，让索引设计和真实查询计划能被持续验证

## 3. 写路径基线

当前推荐写路径：

```text
UI / Form
  -> feature lib parser
  -> feature action
  -> feature service
  -> feature repository
  -> cache invalidation
```

对于需要审计的写路径，当前应在 `service` 内补充：

```text
UI / Form
  -> feature lib parser
  -> feature action
  -> feature service
  -> feature repository
  -> audit log repository
  -> cache invalidation
```

### 已落地的 parser 示例

- `src/features/posts/lib/post-write.ts`
- `src/features/taxonomy/lib/taxonomy-write.ts`
- `src/features/content-space/lib/folder-write.ts`

这些 parser 负责：

- 去空格
- 归一化可选字段
- 合法值校验
- 轻量结构校验

### 已落地的 service 示例

- `src/features/posts/services/post.service.ts`
- `src/features/taxonomy/services/taxonomy.service.ts`
- `src/features/content-space/services/folder.service.ts`
- `src/features/media/services/media.service.ts`

这些 service 负责：

- 生成 slug
- 组合写入步骤
- 返回更新前快照
- 统一 provider 或状态规则

### 当前不建议的反模式

- 在组件里直接拼服务端写入规则
- 在 action 里直接读写多个 repository
- 在 action 里重复解析 `FormData`
- 在 API route 里靠字符串判断所有异常分支

## 4. 错误协议基线

当前项目已经形成共享错误模型，核心文件：

- `src/shared/lib/app-error.ts`
- `src/shared/lib/api-error.ts`

### 当前错误类型

已显式建模的错误包括：

- `AppError`
- `ValidationError`
- `NotFoundError`
- `UnauthorizedError`
- `ForbiddenError`
- `ConfigurationError`

### 使用规则

业务层规则：

- 输入不合法，抛 `ValidationError`
- 找不到实体，抛 `NotFoundError`
- 未登录，抛 `UnauthorizedError`
- 无权限，抛 `ForbiddenError`
- 配置缺失或 provider 配置错误，抛 `ConfigurationError`

API 层规则：

- Route Handler 使用 `toErrorResponse(...)`
- 不再依赖 `error.message === "Forbidden"` 这类字符串分支

UI 层规则：

- 通过 `getErrorMessage(error, fallback)` 展示安全的兜底文案

### 当前收益

- 鉴权、媒体、API 路由的错误边界已经统一
- 配置类错误不会直接把内部细节泄露给前端
- 后续扩展新接口时可以复用同一套错误协议

## 5. 缓存治理基线

缓存治理已经从“业务里顺手调用 `revalidatePath`”升级成共享策略层。

核心文件：

- `src/infrastructure/cache/public-cache.ts`
- `src/infrastructure/cache/admin-cache.ts`
- `src/infrastructure/cache/content-cache.ts`

### 当前分工

`public-cache.ts`

- 负责公共缓存 tag 和底层公共路径刷新
- 维护站点公共页、列表页、详情页、feed、sitemap 等刷新逻辑

`admin-cache.ts`

- 负责后台路径刷新
- 封装 `/admin/posts`、`/admin/media`、`/admin/settings` 等后台视图刷新入口

`content-cache.ts`

- 负责内容域公共页失效
- 根据文章、分类、标签 slug 生成公共页刷新集合

### 当前规则

业务 action / route：

- 不再自行定义后台路径刷新集合
- 优先调用 `revalidateAdmin*`
- 内容发布相关优先调用 `revalidatePostsContent` / `revalidateCategoryContent` / `revalidateTagContent`

### 当前收益

- 缓存边界有了明确归属
- 新增写操作时更不容易漏刷新
- 调整缓存策略时不用在多个业务文件中来回搜索

## 6. 已经验证通过的治理项

以下基线已经通过代码落地与命令验证：

- 文章写路径 parser / service / action 分层
- taxonomy / folder / media 写路径收口
- 共享错误模型和 API 错误映射
- admin/public 缓存失效策略分层

这些变更都经过以下命令验证：

- `npm run lint`
- `npm test`
- `npm run build`

## 7. 后续扩展建议

如果后续继续扩展，优先遵守下面的落点。

### 评论、点赞、收藏、阅读统计

建议新建独立 feature，例如：

- `features/comments`
- `features/engagement`

并延续：

- `actions`
- `services`
- `repositories`
- `queries`

### 审计日志、批量操作、发布工作流

优先放到 `services` 层。

原因：

- 它们通常涉及多步写入
- 需要保留变更前快照
- 需要明确状态迁移规则

### 搜索、对象存储、第三方能力

优先通过 provider / infrastructure 扩展，不要把第三方 SDK 调用散落到 action 和组件里。

### API 扩展

新的 Route Handler 应沿用：

- `requireSession / requireAdminSession`
- `AppError`
- `toErrorResponse`

### 缓存扩展

新增写操作时，先判断它属于哪一类：

- 后台视图变化
- 内容页变化
- 站点配置变化

再选择对应的 cache helper，而不是直接写新的 `revalidatePath(...)` 集合。

## 8. 当前仍然存在的技术债

虽然基线已经成型，但还有几类债务仍值得继续治理：

- `src/actions`、`src/lib`、`src/components` 这些旧平铺目录还在，需要逐步收敛
- settings / account 仍可继续补 service 层
- 缺少面向业务流程的集成测试，当前更多是单元测试与构建验证
- 尚未形成正式 ADR 流程，后续重大结构变更仍容易只停留在口头约定

## 9. 维护建议

后续提交代码时，可以用下面这组问题快速自检：

1. 这是页面职责，还是业务职责？
2. 这段逻辑应该放 action，还是应该下沉到 service？
3. 这是不是一个可复用的输入 parser？
4. 这类异常是否应该进入 `AppError` 体系？
5. 这次变更应该走哪一层缓存失效助手？

如果这五个问题都能回答清楚，通常就不太会把新债务重新写回系统里。
