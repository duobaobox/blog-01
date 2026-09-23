# 云平台（PaaS）部署

适合不想自己维护服务器、希望「连接仓库 → 添加数据库 → 点部署」的用户。本文说明平台需要满足的能力、通用步骤，以及 Railway / Render / Zeabur 的参考操作。

## 平台需要满足的能力

| 能力     | 要求                                                       |
| -------- | ---------------------------------------------------------- |
| 构建     | 使用仓库根目录的 `Dockerfile`（Next.js standalone 输出）   |
| 数据库   | 提供 PostgreSQL 并注入 `DATABASE_URL`                      |
| 持久化   | 能把卷挂载到 `/app/public/media`；没有持久卷时改用对象存储 |
| 端口     | 由平台注入 `PORT`，应用默认监听 `0.0.0.0`，无需额外配置    |
| 健康检查 | 路径 `/api/health`                                         |
| 启动钩子 | 容器启动时会自动执行 `schema-sync.sh` 处理数据库迁移       |

## 通用步骤

1. Fork 本仓库到自己的 GitHub 账号；
2. 在平台新建服务，选择「从 GitHub 部署 / Dockerfile」，根目录使用仓库默认配置；
3. 添加 PostgreSQL 实例，把连接串注入应用（变量名必须是 `DATABASE_URL`）；
4. 按下表配置环境变量；
5. 配置媒体持久化（见下文），没有持久卷时使用对象存储；
6. 部署完成后打开 `https://你的域名/admin/setup`，使用 `ADMIN_SETUP_TOKEN` 创建管理员。

### 环境变量

| 变量                          | 必填 | 说明                                                      |
| ----------------------------- | ---- | --------------------------------------------------------- |
| `DATABASE_URL`                | ✅   | 数据库连接串；密码至少 16 位                              |
| `BETTER_AUTH_SECRET`          | ✅   | 随机串，至少 32 位；建议用平台生成值                      |
| `BETTER_AUTH_URL`             | ✅   | 公网地址，如 `https://blog.example.com`；不能用 localhost |
| `SITE_URL`                    | ✅   | 与 `BETTER_AUTH_URL` 保持同一域名                         |
| `ADMIN_SETUP_TOKEN`           | ✅   | 一次性初始化口令，至少 16 位                              |
| `DB_SCHEMA_SYNC_MODE`         | 建议 | `auto`：按数据库状态自动迁移                              |
| `BETTER_AUTH_TRUSTED_ORIGINS` | 建议 | 设置为公网地址                                            |
| `STORAGE_PROVIDER`            | 可选 | `local`（默认）或 `vercel-blob`                           |
| `BLOB_READ_WRITE_TOKEN`       | 条件 | 使用 `vercel-blob` 时必填                                 |

生产环境启动时会做硬校验：弱密钥、占位符、localhost 地址、数据库密码不足 16 位都会拒绝启动。

## 媒体文件与持久化

应用默认把上传文件写到容器内的 `/app/public/media`。

- **有持久卷的平台**：把卷挂载到 `/app/public/media`；
- **没有持久卷（或免费实例）**：把 `STORAGE_PROVIDER` 设为 `vercel-blob`，配置 `BLOB_READ_WRITE_TOKEN`（Vercel Blob 令牌），媒体文件走对象存储，容器重建也不丢。

免费实例通常会在闲置后休眠并重建容器，**不要依赖容器本地磁盘保存媒体**。

## 数据库迁移

容器入口脚本会按 `DB_SCHEMA_SYNC_MODE` 处理迁移：`auto` 会执行仓库内的 Prisma migration，适合普通容器平台。

如果平台不支持启动钩子（例如 Serverless 形态），需要把 `npx prisma migrate deploy` 放进部署流程，并设置 `DB_SCHEMA_SYNC_MODE=skip`。

## 平台参考操作

### Railway

1. New Project → Deploy from GitHub repo，选择你的 fork；
2. Add → Database → PostgreSQL；
3. 服务的 Variables 中设置上表变量，`DATABASE_URL` 引用 Postgres 服务；
4. Settings → Volumes，挂载 `/app/public/media`；
5. Settings → Healthcheck Path 填 `/api/health`。

### Render

1. New → Web Service → Build from a Git repository，Runtime 选 Docker；
2. New → PostgreSQL，创建后把连接串填入服务的 `DATABASE_URL`；
3. Health Check Path 填 `/api/health`；
4. 付费实例可添加 Disk（挂载 `/app/public/media`）；免费实例请使用对象存储。

### Zeabur / 其他容器平台

1. 从 GitHub 创建项目，选择 Dockerfile 构建；
2. 添加 PostgreSQL 服务并绑定 `DATABASE_URL`；
3. 配置环境变量与卷（`/app/public/media`）；
4. 健康检查路径 `/api/health`。

> 各平台控制台会不定期调整，以上步骤以你看到的最新界面为准。

## 常见问题

- **启动即退出**：先看平台日志，通常是环境变量没通过生产校验（弱密钥 / localhost / 密码太短）；
- **上传图片重启后丢失**：没有持久卷，改用对象存储；
- **打不开 `/admin/setup`**：确认 `SITE_URL` 与访问域名一致；初始化完成过一次后该入口不再可用。
