# 数据库与媒体备份恢复

个人博客真正不可替代的是 PostgreSQL 中的文章数据和媒体存储，两者必须作为同一批次备份。发布版部署时，媒体存储是 Docker 的 `media_data` 持久化卷（挂载到容器内 `/app/public/media`）；源码部署时通常是项目目录的 `./media` 挂载。无论哪种方式，都不要只备份数据库或只备份媒体。

## 每日备份

```bash
BACKUP_RETENTION_DAYS=14 ./scripts/backup-docker.sh
```

发布包目录中使用同名的 `./backup-docker.sh`。脚本会生成：

- `database.dump`：PostgreSQL 自定义格式备份
- `media.tar.gz`：媒体目录归档
- `SHA256SUMS`：恢复前完整性校验
- `.blog-01-backup`：成功备份标记，自动保留策略只会删除带有此标记且名称符合时间戳格式的目录

建议通过 cron 每天执行，并至少把一份副本同步到服务器之外。14 天只是本机默认保留期，不应是唯一副本。已有但没有专用标记的旧目录不会被脚本自动删除，需要确认内容后手动整理。

## 恢复演练

恢复会覆盖当前数据库和媒体，脚本要求显式确认，并在恢复期间停止应用容器：

```bash
CONFIRM_RESTORE=1 ./scripts/restore-docker.sh ./backups/20260723T120000Z
```

恢复前：

1. 先执行一次当前环境备份。
2. 确认目标目录的 `SHA256SUMS` 校验通过。
3. 确认 `blog-postgres` 和 `blog-app` 容器名称未被自定义；如已修改，用 `DB_CONTAINER` / `APP_CONTAINER` 覆盖。

恢复后依次检查：

```bash
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

然后登录后台，抽查一篇含图片的笔记和一篇已发布 Blog，确认正文、封面和正文图片都正常。
