# Docker 构建与发版指导

Blog-01 的默认发行方式是：

```text
Git tag
  → GitHub Actions
  → Linux AMD64 镜像
  → GitHub Container Registry
  → GitHub Release 安装包
  → 用户服务器一键安装
```

普通用户不需要克隆源码、不需要在服务器编译 Next.js，也不需要手工上传 Docker 镜像 tar。

## 官方发行产物

每个正式版本包含：

- `ghcr.io/duobaobox/blog-01:<version>` 容器镜像；
- `ghcr.io/duobaobox/blog-01:latest` 最新稳定镜像；
- `blog-01-linux-amd64.tar.gz` 服务器安装包；
- `blog-01-linux-amd64.tar.gz.sha256` 校验文件；
- GitHub 构建来源证明；
- GitHub 自动生成的 Release Notes。

当前只发布：

```text
linux/amd64
```

ARM64 不在首个公开版本的支持范围内。

## 一、持续集成 CI

`.github/workflows/ci.yml` 在以下事件运行：

- Pull Request；
- 推送到 `main`；
- 手动触发。

检查内容：

1. 校验安装脚本 Bash 语法；
2. 校验发布版 Compose；
3. 构建服务器安装包并验证 SHA256；
4. 启动临时 PostgreSQL 16；
5. 执行 `prisma migrate deploy`；
6. 执行 lint、测试和 Next.js build；
7. 构建 Linux AMD64 生产镜像；
8. 启动真实 PostgreSQL 与应用容器；
9. 检查 `/api/health`、首页和 `/admin/setup`。

CI 成功意味着 Node 构建和最终 Docker 运行链路都已经验证。

## 二、维护者发版

### 1. 更新版本

修改 `package.json` 中的版本，例如：

```json
{
  "version": "0.1.0"
}
```

同步更新 `package-lock.json`：

```bash
npm install --package-lock-only
```

### 2. 本地检查

```bash
npm ci
npm run lint
npm test
npm run build
bash scripts/release/build-release-bundle.sh 0.1.0
```

验证安装包：

```bash
cd dist
sha256sum -c blog-01-linux-amd64.tar.gz.sha256
cd ..
```

### 3. 合并到 main

通过 Pull Request 合并，等待 CI 全部通过。

### 4. 创建版本标签

正式版本：

```bash
git checkout main
git pull
git tag -a v0.1.0 -m "Blog-01 v0.1.0"
git push origin v0.1.0
```

候选版本：

```bash
git tag -a v0.2.0-rc.1 -m "Blog-01 v0.2.0-rc.1"
git push origin v0.2.0-rc.1
```

带连字符的版本会被标记为 prerelease，不会覆盖 `latest`。

### 5. 自动发版

`.github/workflows/release.yml` 会：

1. 再次执行数据库、lint、测试和构建；
2. 登录 GHCR；
3. 构建并推送 AMD64 镜像；
4. 生成版本标签、`sha-*` 标签和稳定版 `latest`；
5. 生成容器镜像来源证明；
6. 构建版本化服务器安装包；
7. 生成 SHA256；
8. 生成安装包来源证明；
9. 创建 GitHub Release。

工作流使用仓库自带的 `GITHUB_TOKEN`，不需要额外配置 Docker 密钥。

### 6. 首次发布后的 GHCR 可见性

GHCR 容器包首次创建时可能是 private。第一次 Release 完成后，在 GitHub 中打开：

```text
个人主页 → Packages → blog-01 → Package settings
```

将包可见性设置为：

```text
Public
```

并确认包已连接到 `duobaobox/blog-01` 仓库。完成一次后，后续版本会继续发布到同一个公开包。

## 三、普通用户一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh | sudo bash
```

安装器会：

- 验证 AMD64 架构；
- 安装或检查 Docker 与 Compose v2；
- 下载最新正式 Release 安装包；
- 验证 SHA256；
- 安装到 `/opt/blog-01`；
- 生成生产密钥和管理员初始化口令；
- 拉取 GHCR 镜像；
- 启动 PostgreSQL；
- 执行数据库同步；
- 启动应用并等待健康检查。

指定正式域名：

```bash
curl -fsSL https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh -o /tmp/blog-01-install.sh
sudo env SITE_URL=https://blog.example.com bash /tmp/blog-01-install.sh
```

指定版本：

```bash
sudo env BLOG_VERSION=0.1.0 bash /tmp/blog-01-install.sh
```

## 四、手动安装 Release 包

从 GitHub Release 下载：

```text
blog-01-linux-amd64.tar.gz
blog-01-linux-amd64.tar.gz.sha256
```

校验并解压：

```bash
sha256sum -c blog-01-linux-amd64.tar.gz.sha256
tar -xzf blog-01-linux-amd64.tar.gz
cd blog-01-linux-amd64
sudo ./install.sh --no-edit
```

指定域名：

```bash
sudo ./install.sh --site-url https://blog.example.com --no-edit
```

## 五、服务器管理

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo ./blogctl logs
sudo ./blogctl restart
sudo ./blogctl config
```

升级最新正式版：

```bash
sudo ./blogctl update
```

升级指定版本：

```bash
sudo ./blogctl update 0.2.0
```

升级流程：

```text
下载 Release 包
  → 验证 SHA256
  → 备份数据库与媒体
  → 更新 Compose 与管理脚本
  → 拉取指定版本镜像
  → 执行数据库同步
  → 等待健康检查
  → 失败时尝试恢复旧镜像版本
```

## 六、数据库同步

统一使用：

```env
DB_SCHEMA_SYNC_MODE=auto
```

可选值：

- `auto`：空库和 migration-ready 数据库使用 `migrate deploy`，历史无迁移记录数据库保守使用兼容同步；
- `migrate`：明确使用 `prisma migrate deploy`；
- `push`：历史数据库兼容模式；
- `skip`：由外部流程负责数据库变更。

新安装默认使用仓库 migration。

历史环境升级前执行：

```bash
npm run db:check:migrations
npm run db:check:migration-coverage
npm run db:preflight:release -- --schema
```

遇到 `migration-blocked` 时暂停发布，先修复数据库状态。

## 七、备份与恢复

```bash
cd /opt/blog-01
sudo ./blogctl backup
```

备份包含：

- PostgreSQL 自定义格式 dump；
- `/app/public/media` 上传媒体；
- SHA256 校验文件。

恢复：

```bash
sudo ./blogctl restore ./backups/20260101T000000Z
```

恢复前会先备份当前状态。

不要执行：

```bash
docker compose down -v
```

这会删除数据库和媒体卷。

## 八、本地调试 Docker 镜像

普通开发使用根目录 `docker-compose.yml`：

```bash
docker compose up -d --build db
docker compose --profile tools run --rm migrate
docker compose up -d --build app
```

单独构建和测试 AMD64 镜像：

```bash
docker buildx build \
  --platform linux/amd64 \
  -t blog-01:local \
  --load \
  .
```

中国大陆网络环境需要镜像源时，可以显式传入：

```bash
docker buildx build \
  --platform linux/amd64 \
  --build-arg APT_MIRROR=https://mirrors.aliyun.com \
  --build-arg NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
  -t blog-01:local \
  --load \
  .
```

官方 CI 默认使用 Debian 和 npm 官方源，避免公开 runner 依赖区域镜像。

## 九、回滚

应用版本由 `.env.release` 中以下变量固定：

```env
BLOG_VERSION=0.1.0
```

手动回滚：

```bash
cd /opt/blog-01
sudo ./blogctl backup
sudo sed -i 's/^BLOG_VERSION=.*/BLOG_VERSION=0.1.0/' .env.release
sudo docker compose --env-file .env.release -f compose.yaml pull blog
sudo docker compose --env-file .env.release -f compose.yaml up -d --wait blog
```

数据库 migration 通常只向前执行。包含破坏性 schema 变化的版本必须提供专门迁移与恢复说明，不能只依赖镜像回滚。
