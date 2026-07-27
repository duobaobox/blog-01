# Contributing to Blog-01

感谢参与 Blog-01。

## 开始开发

```bash
git clone https://github.com/duobaobox/blog-01.git
cd blog-01
npm ci
cp .env.example .env
docker compose up -d db
npm run db:generate
DB_SCHEMA_SYNC_MODE=auto npm run db:sync
npm run dev
```

需要 Node.js 22、Docker Engine 和 Docker Compose v2。

## 提交前检查

```bash
npm run lint
npm test
npm run build
```

涉及 Docker、安装、数据库或发布流程时，还需要确认：

```bash
docker compose --env-file .env.release.example -f docker-compose.release.yml config
bash scripts/release/build-release-bundle.sh 0.0.0-local
```

Pull Request CI 会进一步构建并启动真实的 Linux AMD64 生产容器。

## Pull Request

- 一个 PR 尽量只解决一个明确问题；
- 说明问题背景、改动范围和验证方式；
- UI 改动请提供截图；
- 数据库改动必须提交 Prisma migration；
- 不要提交 `.env`、真实密码、Token 或 API Key；
- 不要为了通过检查全局关闭 lint、类型或测试规则；
- 保持现有模块边界和数据访问约定。

## Commit

推荐使用简短、明确的提交信息，例如：

```text
修复文章预览保存状态
增加 GHCR 自动发版
完善媒体备份校验
```

## 数据库变更

修改 `prisma/schema.prisma` 时：

1. 创建并提交 migration；
2. 验证 `prisma migrate deploy`；
3. 检查旧数据兼容性；
4. 更新备份、恢复和部署文档；
5. 避免在应用请求过程中执行破坏性数据库操作。

## 安全问题

不要公开提交安全漏洞。请按照 [SECURITY.md](./SECURITY.md) 报告。

## License

提交代码即表示你同意贡献内容按仓库的 [MIT License](./LICENSE) 发布。
