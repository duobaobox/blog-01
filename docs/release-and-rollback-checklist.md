# 发版与回滚 Checklist

## 一、发版前

- [ ] 本次代码已经通过 Pull Request 合并到 `main`
- [ ] `main` 分支 CI 全部通过
- [ ] `npm run lint` 通过
- [ ] `npm test` 通过
- [ ] `npm run build` 通过
- [ ] Linux AMD64 Docker 集成测试通过
- [ ] Release 安装包构建和 SHA256 校验通过
- [ ] `package.json` 与 `package-lock.json` 版本一致
- [ ] README、安装文档和变更说明已更新
- [ ] 仓库中没有 `.env`、真实 Token、API Key 或私钥
- [ ] 本次版本号符合语义化版本规则

## 二、数据库变更门禁

如果修改了 `prisma/schema.prisma`、migration、初始化逻辑或历史数据回填，执行：

```bash
npm run db:preflight:release -- --schema
```

按需加严：

```bash
npm run db:preflight:release -- --schema --posts --media
```

必须确认：

- [ ] `db:check:sync-mode` 与目标环境一致
- [ ] `db:check:migrations` 没有失败或未完成 migration
- [ ] `db:check:migration-coverage` 没有缺失仓库 migration
- [ ] `db:check:site-settings` 通过
- [ ] 历史 `db push` 环境已评估 baseline
- [ ] `migration-blocked` 环境已经停止发布并完成排查
- [ ] 包含破坏性 schema 变更时已提供专门恢复说明

环境处理原则：

| 环境类型 | 默认策略 |
| --- | --- |
| `empty` | 使用 `migrate deploy` |
| `legacy-without-history` | 保持 `auto` 或 `push`，完成 baseline 后再切 migrate |
| `baseline-ready` | 检查 migration coverage 后使用 migrate |
| `migration-ready` | 使用 `migrate deploy` |
| `migration-blocked` | 暂停发布 |

## 三、创建版本

更新版本：

```bash
npm version 0.1.0 --no-git-tag-version
```

再次检查：

```bash
npm ci
npm run lint
npm test
npm run build
bash scripts/release/build-release-bundle.sh 0.1.0
(
  cd dist
  sha256sum -c blog-01-linux-amd64.tar.gz.sha256
)
```

提交版本更新并合并到 `main`。

## 四、推送标签

正式版：

```bash
git checkout main
git pull
git tag -a v0.1.0 -m "Blog-01 v0.1.0"
git push origin v0.1.0
```

候选版：

```bash
git tag -a v0.2.0-rc.1 -m "Blog-01 v0.2.0-rc.1"
git push origin v0.2.0-rc.1
```

- [ ] Release workflow 的 verify job 通过
- [ ] GHCR 镜像推送成功
- [ ] 镜像标签符合预期
- [ ] 稳定版生成 `latest`
- [ ] prerelease 没有覆盖 `latest`
- [ ] 容器来源证明生成成功
- [ ] 安装包来源证明生成成功
- [ ] GitHub Release 创建成功
- [ ] Release 资产包含 tar.gz 与 SHA256

## 五、首次公开发布额外检查

- [ ] `ghcr.io/duobaobox/blog-01` 包已设为 Public
- [ ] GHCR 包已连接到当前仓库
- [ ] 未登录状态可以执行 `docker pull ghcr.io/duobaobox/blog-01:<version>`
- [ ] 仓库包含 MIT LICENSE
- [ ] SECURITY.md 可访问
- [ ] 一键安装命令使用公开 Release，而不是 main 分支源码构建

## 六、干净服务器验收

在全新的 Linux AMD64 服务器执行：

```bash
curl -fsSL https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh | sudo bash
```

验收：

- [ ] Docker 自动安装或正确识别
- [ ] Release 包 SHA256 校验通过
- [ ] 安装目录为 `/opt/blog-01`
- [ ] `.env.release` 权限为 600
- [ ] PostgreSQL healthy
- [ ] Blog-01 healthy
- [ ] `/api/health` 正常
- [ ] 首页正常
- [ ] `/admin/setup` 正常
- [ ] 能使用初始化口令创建管理员
- [ ] 管理员可以登录
- [ ] 能新建并发布文章
- [ ] 能上传图片
- [ ] 重启容器后数据和媒体仍存在
- [ ] `blogctl status` 正常
- [ ] `blogctl logs` 正常
- [ ] `blogctl backup` 正常

检查命令：

```bash
cd /opt/blog-01
./blogctl status
curl -fsS http://127.0.0.1:3000/api/health
ls -l .env.release
```

## 七、升级验收

准备两个版本，例如 `0.1.0` 与 `0.1.1`。

```bash
cd /opt/blog-01
./blogctl update 0.1.1
```

- [ ] 升级前自动生成备份
- [ ] 新 Release 包校验通过
- [ ] `BLOG_VERSION` 更新到新版本
- [ ] 新镜像拉取成功
- [ ] schema 同步成功
- [ ] 健康检查通过
- [ ] 原文章、管理员和媒体仍存在
- [ ] 新版本功能正常

## 八、回滚触发条件

- 应用容器无法 healthy；
- 首页或后台无法访问；
- 登录链路异常；
- 上传功能失效；
- 发布文章异常；
- migration 失败；
- 数据兼容性不符合预期。

## 九、回滚

应用回滚前先备份：

```bash
cd /opt/blog-01
./blogctl backup
```

回到指定版本：

```bash
./blogctl update 0.1.0
```

如果目标 Release 已不可用，可以手动修改：

```bash
sed -i 's/^BLOG_VERSION=.*/BLOG_VERSION=0.1.0/' .env.release
docker compose --env-file .env.release -f compose.yaml pull blog
docker compose --env-file .env.release -f compose.yaml up -d --wait blog
```

数据库恢复：

```bash
./blogctl restore ./backups/备份目录
```

注意：

- 镜像回滚不会自动撤销已执行的 migration；
- 破坏性数据库变更必须使用对应版本的恢复计划；
- 不要删除数据库卷；
- 不要执行 `docker compose down -v`。

## 十、发版记录模板

```text
版本：
标签：
发布时间：
Release URL：
镜像：ghcr.io/duobaobox/blog-01:
镜像 Digest：
CI 状态：
GHCR 是否公开：
全新安装是否通过：
升级是否通过：
备份是否通过：
是否发生回滚：
备注：
```
