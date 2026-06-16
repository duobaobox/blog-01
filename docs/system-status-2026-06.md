# Blog-01 阶段性系统状态（2026-06）

这份文档记录的是 **截至 2026-06 当前仓库已经真正落地的系统治理结果**。

它不替代：

- [系统治理进度表（2026-06）](/Users/duobao/个人/个人-网站搭建/blog-01/docs/governance-progress-board-2026-06.md)
- [当前架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md)
- [架构审计总览](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-audit-overview.md)
- [系统治理路线图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/technical-debt-roadmap.md)

更适合把它理解成：

- 一个“当前系统已经收口到什么程度”的阶段快照
- 一个“后面继续治理时，从哪里接着往下做”的状态面板
- 一个帮助未来回看时快速区分“已经做完的事”和“仍在过渡中的事”的摘要

如果你当前更关心“到底做到了哪一步、下一步只应该继续哪几条”，优先看：

- [系统治理进度表（2026-06）](/Users/duobao/个人/个人-网站搭建/blog-01/docs/governance-progress-board-2026-06.md)

## 1. 当前一句话结论

项目已经从“最小可用 + 边写边补”进入了 **边界逐步成型、但仍处于中期治理阶段** 的状态。

现在最积极的变化不是新增了多少功能，而是几条关键演进方向已经开始稳定：

- 后台读模型开始系统性地从 page/layout 装配转向 query/page-data projection
- `content-space` 这类重型工作台查询开始具备 query plan 和可测试的聚合 query 入口
- 数据库交付不再只靠人工理解，而是已经把环境判断推进到了默认执行层
- 初始化、媒体、设置等历史上容易“顺手写库”的路径，开始被显式入口和 service/query 边界替代

## 2. 已经明显收口的部分

### 2.1 后台壳层读模型

这条线已经不只是理念，而是代码里真的开始形成统一模式：

- dashboard 页面已改为消费聚合 query，而不是 page 自己并行组装 overview / governance / taxonomy / recent activity
- protected layout 的 onboarding / password banner 已收回到 shell projection
- settings 页面已收回到 page-data query
- account 页面已收回到 page-data query

当前可以把后台壳层理解成：

- page/layout 负责展示和路由边界
- query 层负责提醒、统计、默认值和聚合 view-model

这意味着后续如果还要继续给后台加轻量运营提示，优先应该继续往 query projection 上加，而不是回到 page 里堆 `Promise.all(...)`。

### 2.2 `content-space` 工作台

`content-space` 现在已经不再是“一个大页面里到处拼 if/else”的状态。

已经落地的关键点包括：

- `library` / `recent` feed 语义拆分
- `requestedPost` 与 `selectedPost` 拆分
- 保存视图服务端化
- query plan 显式化
- admin posts 聚合查询已暴露 query factory，可直接测试搜索、folder、selected-post 等分支

这说明工作台这块已经有了继续扩展的轨道，但它仍然是后台最重、也最容易继续长债的一块。

### 2.3 数据库交付

这条线的状态已经从“只能靠人盯着跑”往前推到了“默认执行层会做一部分判断”：

- baseline migration 已入仓
- migration state / baseline / release preflight / singleton / backfill / explain 都有独立脚本
- `schema-sync.sh` 已成为 app 首启和 tools migrate 的统一入口
- 默认 schema sync 现在支持 `DB_SCHEMA_SYNC_MODE=auto`
- release 安装流程会在启动 app 之前先探测当前 schema sync 决策
- 本地也已经有统一入口 `npm run db:sync`

但这里要非常明确：

- 这不等于项目已经完全 migrate-first
- 它只是从“人工判断 + 手工切模式”前进到了“默认会自动判定，但历史环境仍保守回落到 push”

### 2.4 初始化与 bootstrap

这一块相较早期已经清楚很多：

- `/admin/login` 不再顺手创建默认管理员
- `/admin/setup` 是显式且受控的初始化入口
- protected layout 不再承担用户名回填写库副作用
- 账户默认密码提醒和站点 setup reminder 都已改为读模型投影

这说明“普通访问链路不再承担隐式修复/初始化职责”这条原则，已经在后台开始成型。

## 3. 当前最重要的未完成项

### 3.1 数据库仍处于过渡态

虽然默认执行层已经支持 `auto`，但数据库交付仍然是当前最大的系统风险面。

原因不是脚本不够，而是：

- 历史环境仍可能保守回落到 `push`
- baseline resolve 之后如何稳定切到 migrate-first，仍需要继续验证
- “新环境该怎么做、旧环境该怎么做、什么时候必须人工介入”虽然已经更清楚，但还没完全变成零歧义流程

所以数据库这条线现在更像：

- 能解释
- 能检测
- 能自动做一部分决策
- 但还不能说已经彻底收口

### 3.2 后台读模型虽然已经成型，但仍要防膨胀

dashboard、settings、account、content-space 这条线已经走对了方向，但真正的风险是后续新需求继续把逻辑塞回 page/layout。

当前最需要守住的不是“再做一两个 projection”，而是：

- 新增后台提示优先进 query projection
- 新增后台只读统计优先进聚合 query
- 不要重新把 bootstrap/settings/service 读取散回到 layout/page

### 3.3 媒体和前台展示读模型仍是中期课题

媒体链路已经从“完全脆弱”改善到“具备 workflow、尺寸、引用关系和删除保护”，但离真正的长期能力还有距离：

- 更丰富图片元数据
- 图片变体/展示读模型
- 更结构化的媒体引用提取

这部分已经不算最紧急，但会直接影响后续前台体验和扩展能力。

## 4. 下一阶段最值得继续的顺序

如果按投入产出比排序，当前更推荐的顺序是：

1. 继续数据库交付治理
   目标：把“自动判定、推荐模式、发布前检查、历史环境切换策略”再收拢一层
2. 继续守后台读模型边界
   目标：避免 page/layout 装配反弹，优先把新增提示和聚合视图继续收回 query 层
3. 回到 `content-space` 和媒体中期能力
   目标：提升重型工作台查询测试性、继续补媒体展示读模型
4. 最后再考虑 bootstrap 的模式拆分
   目标：把“开发便利”和“生产初始化”从同一套机制中再拆开

## 5. 这份文档怎么用

后续如果你要继续系统治理，最推荐的使用方式是：

1. 先看这份阶段状态，确认某个问题是“还没做”还是“已经做了一半”
2. 再看 [架构审计总览](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-audit-overview.md)，判断它属于哪类风险面
3. 然后回到 [系统治理路线图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/technical-debt-roadmap.md)，确认它在 P0 / P1 / P2 里的优先级
4. 最后用 [当前架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md) 约束具体实现，避免把逻辑重新打散

如果只想快速判断“现在这个项目最需要继续打哪里”，直接看第 3 节和第 4 节就够了。
