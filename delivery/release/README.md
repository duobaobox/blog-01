# Blog-01 服务器部署

## 1. 上传这些文件到服务器

- `blog-01-app-release.tar`
- `docker-compose.release.yml`
- `.env.release.example`
- `install.sh`
- `backup-docker.sh`
- `restore-docker.sh`

## 2. 一键安装

最简单方式：

```bash
bash install.sh
```

脚本会自动：

- 生成 `.env.release`
- 自动填充数据库密码、鉴权密钥
- 自动生成生产初始化口令 `ADMIN_SETUP_TOKEN`
- 自动猜测当前服务器 IP，写入访问地址
- 自动写入 Better Auth 允许登录的来源地址
- 默认写入 `DB_SCHEMA_SYNC_MODE=auto`
- 导入应用镜像
- 先启动数据库
- 在真正启动应用前预跑一次 schema sync 判定
- 再启动应用
- 如果是首次部署，默认会先打开 `nano` 让你确认配置
- 在应用启动前尽量直接打印当前环境的 schema sync 判定结果
- 最后直接打印前台 / 后台访问地址和初始化提示

如果你明确不想编辑配置，直接跳过：

```bash
bash install.sh . --no-edit
```

如果你想强制再次打开配置检查：

```bash
bash install.sh . --edit
```

这会优先用 `nano` 打开 `.env.release`，保存后再继续安装。

## 3. 手动方式

```bash
docker load -i blog-01-app-release.tar
cp .env.release.example .env.release
nano .env.release
docker compose --env-file .env.release -f docker-compose.release.yml up --wait
```

当前发布模板默认会使用：

- `DB_SCHEMA_SYNC_MODE=auto`

它的含义是：

- 空库：自动执行 `migrate deploy`
- 已 baseline-ready 或 fully migration-ready：自动执行 `migrate deploy`
- 历史无迁移环境：保守回落到 `db push`

如果你明确知道当前环境必须固定使用某种模式，再手动把 `.env.release` 中的 `DB_SCHEMA_SYNC_MODE` 改成 `push` 或 `migrate`。

如果你想在真正启动容器前，先单独确认这台机器会推导出什么 schema sync 决策，可以先在项目根目录运行：

```bash
npm run db:check:sync-mode
npm run db:check:migrations
npm run db:check:migration-coverage
```

它会直接打印：

- `mode`
- `environment_kind`
- `rationale`

如果你后续显式把 `.env.release` 里的 `DB_SCHEMA_SYNC_MODE` 固定成 `push` 或 `migrate`，当前发布前预检也会用这条命令校验它是否和当前推荐模式一致；不一致时会直接失败，而不是只给出提醒。
其中 `db:check:migrations` 用于告诉你当前环境是 `legacy-without-history`、`baseline-ready` 还是 `migration-ready`；`db:check:migration-coverage` 则负责确认仓库里的 migration 是否真的已经全部落地，避免把“只完成 baseline”误判成“已经完全迁移就绪”。

如果登录时报 `Invalid origin`，优先检查这三项是否和你实际访问地址一致：

- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `SITE_URL`

## 4. 访问

- 前台：`http://你的域名或IP:端口`
- 后台：`http://你的域名或IP:端口/admin/login`

生产初始化：

- 首次访问后台会从 `/admin/login` 跳转到 `/admin/setup`
- 使用 `.env.release` 里的 `ADMIN_SETUP_TOKEN` 在 setup 表单创建自定义管理员
- 生产环境不会自动创建默认管理员账号

登录时尽量始终使用同一个访问地址，比如全程都用 `http://47.100.193.93:3000`，不要先用 IP 再切 localhost 或域名，这样可以避免 `Invalid origin`。


## 5. 备份与恢复

每天备份数据库和媒体：

```bash
BACKUP_RETENTION_DAYS=14 ./backup-docker.sh
```

恢复会覆盖当前数据库和媒体，必须显式确认：

```bash
CONFIRM_RESTORE=1 ./restore-docker.sh ./backups/备份时间目录
```

恢复前先额外保留一份当前备份。详细说明见仓库文档 `docs/backup-and-restore.md`。
