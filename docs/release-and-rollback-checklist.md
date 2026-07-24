# 发版与回滚 Checklist

## 发版前

- [ ] 确认本次代码已经提交
- [ ] 确认 `npm run build` 通过
- [ ] 确认 `npm run db:preflight:release -- --schema` 已执行，至少覆盖 schema sync mode 推荐、migration 状态、migration coverage、baseline 计划、siteSetting 单例检查与 schema diff
- [ ] 如本次显式设置了 `DB_SCHEMA_SYNC_MODE=push|migrate`，确认预检没有因为推荐模式不一致而失败
- [ ] 如本次要把环境从 `push` 切到 `migrate`，最好先在本地执行过 `npm run db:rehearse:baseline`
- [ ] 如本次显式按 `migrate` 路径发版，确认 `db:check:migration-coverage` 没有缺失 repo migration，避免把 baseline-ready 环境误当成 fully migration-ready
- [ ] 如本次涉及 `siteSetting` 或初始化配置语义调整，确认预检输出中的 `db:check:site-settings` 已通过
- [ ] 如本次包含 `postMediaReference` 这类历史数据回填，确认执行过 `npm run db:preflight:release -- --media` 或单独审阅过 `db:backfill:post-media-references` 计划
- [ ] 如本次涉及 posts 查询或索引优化，确认执行过 `npm run db:preflight:release -- --posts` 或单独审阅过 `db:explain:posts`
- [ ] 确认 `BETTER_AUTH_URL` / `BETTER_AUTH_TRUSTED_ORIGINS` / `SITE_URL` 不含 `localhost`
- [ ] 生产环境确认已设置 `ADMIN_SETUP_TOKEN`，且不会依赖开发默认管理员账号初始化
- [ ] 执行 `BACKUP_RETENTION_DAYS=14 ./scripts/backup-docker.sh`，确认数据库和媒体备份均生成，并把副本保存到服务器之外
- [ ] 记录当前线上镜像版本或当前交付包时间

## 数据库环境发布路径

先执行：

```bash
npm run db:preflight:release -- --schema
```

然后只按预检输出里的 `environment kind` 选择下面路径，不再临场翻译 migration 状态。

默认预检必须覆盖下面 5 个发布决策门禁：

- `db:check:sync-mode`：确认 `DB_SCHEMA_SYNC_MODE` 与当前环境推荐一致
- `db:check:migrations`：确认 migration 表、失败 migration、环境类型
- `db:check:migration-coverage`：确认仓库 migration 是否都已应用
- `db:baseline`：确认 legacy 环境是否仍需 baseline resolve
- `db:check:site-settings`：确认站点设置单例不会在发布后产生初始化歧义

`--schema`、`--posts`、`--media` 属于按变更触发的加严检查：schema 变更跑 schema diff，posts 查询或索引变更跑 explain，媒体引用回填变更跑 backfill plan。

| 环境类型 | 标准发布模式 | 必做门禁 | 标准动作 |
| --- | --- | --- | --- |
| `empty` 新环境 | `DB_SCHEMA_SYNC_MODE=migrate` | `db:preflight:release -- --schema` 通过 | 通过共享 `schema-sync.sh` 入口执行 `migrate deploy` |
| `legacy-without-history` 历史 `db push` 环境 | 继续 `auto` 或显式 `push`，暂不直接切 `migrate` | `db:preflight:release -- --schema`，必要时先跑 `db:rehearse:baseline` | 执行 `npm run db:baseline -- --apply`，再重新预检，确认进入 baseline-ready 后再切 migrate |
| `baseline-ready` / `migration-ready` 已纳入 migration 管理环境 | `DB_SCHEMA_SYNC_MODE=migrate` | `db:check:migration-coverage` 必须完整，才能宣称 fully migration-ready | 执行 `migrate deploy`；如 coverage 缺失，先应用缺失 migration，不把 baseline-ready 误判为完全就绪 |
| `migration-blocked` 异常环境 | 暂停发布 | `db:check:migrations` 与 `npx prisma migrate status` 排查清楚 | 先修复失败或未完成 migration，再重新跑发布预检 |

`baseline-ready` 与 `migration-ready` 的运维差异：

- `baseline-ready`：baseline migration 已记录，可以进入 `migrate deploy` 语义，但仍必须审阅 migration coverage，不能宣称当前环境已经应用了仓库里的全部 migration。
- `migration-ready`：baseline 与仓库后续 migration 都已应用，`db:check:migration-coverage` 完整通过，可以作为 fully migration-ready 环境发布。

## 本地发版动作

```bash
docker buildx build --platform linux/amd64 -t blog-01-app:release --load .
mkdir -p dist/app-delivery
docker save -o dist/app-delivery/blog-01-app-release.tar blog-01-app:release
bash scripts/release/refresh-app-delivery.sh
tar -C dist -czf dist/app-delivery-release.tar.gz app-delivery
```

如本次包含 Prisma schema 变更，先在本地或预发环境执行：

```bash
npm run db:preflight:release -- --schema
npm run db:preflight:release -- --schema --posts --media
```

## 服务器部署动作

```bash
cd /root
rm -rf app-delivery
tar -xzf app-delivery-release.tar.gz
cd app-delivery
bash install.sh
```

## 发版后检查

- [ ] `docker compose ps` 显示 app 与 db 均为 healthy
- [ ] `curl -fsS http://127.0.0.1:3000/api/health` 返回 `status=ok`
- [ ] `docker compose logs --tail=100 blog` 无明显报错
- [ ] 首页可访问
- [ ] `/admin/login` 可访问
- [ ] 新环境首次访问 `/admin/login` 时，若尚无用户，会按预期进入 `/admin/setup`
- [ ] 生产环境能使用 `ADMIN_SETUP_TOKEN` 在 setup 表单创建自定义管理员
- [ ] 自定义管理员能登录
- [ ] 修改管理员密码后，重新登录正常
- [ ] 能新建文章
- [ ] 能上传图片
- [ ] `/robots.txt` 正常
- [ ] `/sitemap.xml` 正常
- [ ] `/feed.xml` 正常

## 可直接执行的检查命令

```bash
cd /root/app-delivery
docker compose --env-file .env.release -f docker-compose.release.yml ps
docker compose --env-file .env.release -f docker-compose.release.yml logs --tail=100 blog
grep -E '^(BETTER_AUTH_URL|BETTER_AUTH_TRUSTED_ORIGINS|SITE_URL|ADMIN_SETUP_TOKEN)=' .env.release
```

## 回滚触发条件

- 首页或后台无法访问
- 登录链路异常
- 初始化管理员无法登录
- 上传功能失效
- 发布后前台文章异常

## 回滚原则

1. 先保留当前 `.env.release`
2. 回退到上一版 `app-delivery-release.tar.gz`
3. 重新解压并执行 `bash install.sh . --no-edit`
4. 如涉及数据回滚，使用已校验的备份目录执行 `CONFIRM_RESTORE=1 ./scripts/restore-docker.sh <backup-dir>`
5. 如无必要，不直接删数据库卷

## 发版记录模板

```text
发版时间：
操作人：
本地镜像标签：
交付包文件名：
服务器地址：
是否完成登录验证：
是否完成上传验证：
是否回滚：
备注：
```
