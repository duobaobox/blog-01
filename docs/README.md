# 文档索引

当前 `docs/` 目录只保留仍然服务于现有项目的文档。

## 部署与发版

- [Docker 构建与发版指导](/Users/duobao/个人/个人-网站搭建/blog-01/docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](/Users/duobao/个人/个人-网站搭建/blog-01/docs/alicloud-docker-nginx-https-guide.md)
- [发版与回滚 Checklist](/Users/duobao/个人/个人-网站搭建/blog-01/docs/release-and-rollback-checklist.md)

## 产品与架构规划

- [Blog-01 架构优化方案](/Users/duobao/个人/个人-网站搭建/blog-01/docs/plans/2026-03-13-blog-architecture-optimization-plan.md)
- [系统治理进度表（2026-06）](/Users/duobao/个人/个人-网站搭建/blog-01/docs/governance-progress-board-2026-06.md)
- [阶段性系统状态（2026-06）](/Users/duobao/个人/个人-网站搭建/blog-01/docs/system-status-2026-06.md)
- [架构审计总览](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-audit-overview.md)
- [当前架构基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/architecture-baseline.md)
- [系统治理路线图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/technical-debt-roadmap.md)
- [个人博客产品蓝图](/Users/duobao/个人/个人-网站搭建/blog-01/docs/plans/2026-03-13-personal-blog-blueprint.md)

## 性能与数据库

- [Posts 查询计划基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/performance/posts-query-baseline.md)

## 当前约定

- 不再维护旧的 `offline-delivery` 离线交付链路
- 当前发布方式以 `dist/app-delivery` 和 `docker-compose.release.yml` 为准
- `docs/superpowers` 下的中间产物不再作为正式项目文档保留
- 数据库 schema 变更和索引优化当前应优先通过 `npm run db:diff` / `npm run db:explain:posts` 做上线前检查
- 数据库当前已补 baseline migration 资产；历史环境切换到 Prisma Migrate 前，应先执行 `npm run db:check:migrations`
