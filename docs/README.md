# 文档索引

`docs/` 只保留当前仍会指导开发、部署或排障的文档。已经完成的旧计划、治理过程记录和阶段性看板不再保留在正式文档树里。

## 架构与界面扩展

- [当前架构基线](./architecture-baseline.md)
- [首页风格 DIY](./homepage-diy.md)
- [SEO 与 AI 编辑助手 PRD](./ai-seo-prd.md)

## 部署与发版

- [Blog-01 部署 Skill](./skills/blog-01-deployment/SKILL.md)
- [Docker 构建与发版指导](./docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](./alicloud-docker-nginx-https-guide.md)
- [发版与回滚 Checklist](./release-and-rollback-checklist.md)
- [数据库与媒体备份恢复](./backup-and-restore.md)

## 性能与数据库

- [Posts 查询计划基线](./performance/posts-query-baseline.md)

## 保留规则

- README 只做入口说明，细节放到专项文档
- `delivery/release` 是发布包模板输入，不当作项目说明文档展开维护
- 可执行的 Agent Skill 放在 `docs/skills/<skill-name>/SKILL.md`
- 临时计划、阶段看板、一次性审计记录完成后不继续进入正式文档索引
