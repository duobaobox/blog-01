# 博客 Docker 部署手册

完整的本地构建 + 服务器部署流程。

---

## 📋 前置条件

### 本地开发机（Mac）

- [ ] 已安装 Docker Desktop（[下载](https://www.docker.com/products/docker-desktop)）
- [ ] Docker 已启动运行
- [ ] 项目源代码已克隆到本地
- [ ] 网络可以访问 Docker Hub

### 服务器（阿里云 ECS x86）

- [ ] 获取到服务器的**公网 IP**
- [ ] 可用 SSH 登录服务器
- [ ] 服务器有足够的磁盘空间（建议 ≥ 20GB）

---

## 🏗️ 第一部分：本地构建镜像

### 1.1 准备配置文件

编辑 `delivery/offline/.env.offline`，填入实际的服务器信息和账号：

```bash
# 服务器信息
BETTER_AUTH_URL="http://你的服务器IP:3000"
NEXT_PUBLIC_SITE_URL="http://你的服务器IP:3000"

# 数据库密码（改成强密码）
POSTGRES_PASSWORD="Blog@2026!Strong"

# 认证密钥（执行: openssl rand -base64 32 生成）
BETTER_AUTH_SECRET="your-random-string-here"

# 管理员账号
SEED_ADMIN_EMAIL="你的邮箱@qq.com"
SEED_ADMIN_PASSWORD="你的登录密码"
```

### 1.2 构建 App 镜像（x86 架构）

在项目根目录执行：

```bash
# 为服务器 x86 架构构建镜像
docker build --platform linux/amd64 -t blog-01-app:latest .

# 输出示例：
# Successfully tagged blog-01-app:latest
```

> 第一次构建需要 5-10 分钟，这是正常的。

### 1.3 导出为 tar.gz 文件

```bash
# 创建输出目录
mkdir -p delivery/offline/deploy

# 导出应用镜像（约 600MB）
docker save blog-01-app:latest | gzip > delivery/offline/deploy/blog-01-app.tar.gz

# 拉取并导出 PostgreSQL 镜像（约 150MB）
docker pull --platform linux/amd64 postgres:16
docker save postgres:16 | gzip > delivery/offline/deploy/postgres-16.tar.gz
```

### 1.4 复制配置文件

```bash
# 复制配置文件到交付目录
cp delivery/offline/docker-compose.offline.yml delivery/offline/deploy/docker-compose.yml
cp delivery/offline/.env.offline delivery/offline/deploy/.env
```

### 1.5 验证交付物

```bash
# 查看交付目录
ls -lh delivery/offline/deploy/

# 输出示例：
# 608M  blog-01-app.tar.gz           (应用镜像)
# 149M  postgres-16.tar.gz           (数据库镜像)
# 2.2K  docker-compose.yml           (服务配置)
# 499B  .env                         (环境变量)
```

---

## 🚀 第二部分：上传到服务器

### 2.1 本地 Mac 执行：上传文件

> 把下面命令中的 `172.23.103.4` 替换为你的服务器公网 IP

```bash
# 在服务器上创建部署目录
ssh root@172.23.103.4 "mkdir -p /root/blog"

# 上传所有交付文件（约 757MB，需要 2-5 分钟）
scp delivery/offline/deploy/blog-01-app.tar.gz root@172.23.103.4:/root/blog/
scp delivery/offline/deploy/postgres-16.tar.gz root@172.23.103.4:/root/blog/
scp delivery/offline/deploy/docker-compose.yml root@172.23.103.4:/root/blog/
scp delivery/offline/deploy/.env root@172.23.103.4:/root/blog/

# 验证上传成功
ssh root@172.23.103.4 "ls -lh /root/blog/"
```

> **网络太慢？** 可以分多次上传，或压缩后再传：
>
> ```bash
> tar -czf deploy.tar.gz delivery/offline/deploy/
> scp deploy.tar.gz root@172.23.103.4:/root/
> ssh root@172.23.103.4 "cd /root && tar -xzf deploy.tar.gz && mv deploy /root/blog"
> ```

---

## 🔧 第三部分：服务器部署

所有操作在服务器上执行。

### 3.1 安装 Docker

```bash
# SSH 登录服务器
ssh root@172.23.103.4

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
systemctl enable --now docker

# 验证安装
docker --version
```

### 3.2 导入镜像

```bash
# 进入部署目录
cd /root/blog

# 导入应用镜像（需要 1-2 分钟）
docker load < blog-01-app.tar.gz

# 导入数据库镜像（需要 1-2 分钟）
docker load < postgres-16.tar.gz

# 验证导入成功
docker images | grep -E "blog-01-app|postgres"
```

### 3.3 启动服务

```bash
# 后台启动所有服务
docker compose --env-file .env up -d

# 查看运行状态（稍等 30 秒让数据库启动完毕）
sleep 10 && docker ps
```

正常输出：

```
CONTAINER ID   IMAGE              STATUS
xxx            blog-01-app        Up 10 seconds
yyy            postgres:16        Up 15 seconds
```

### 3.4 初始化数据库

```bash
# 执行数据库迁移
docker compose --env-file .env --profile tools run --rm migrate

# 创建初始管理员账号
docker compose --env-file .env --profile tools run --rm seed
```

等待完成即可。

### 3.5 开放安全组端口

登录阿里云控制台：

1. ECS → 实例 → 选择对应的 ECS 实例
2. 安全组 → 入方向规则 → 添加规则

| 端口 | 协议 | 来源      | 说明            |
| ---- | ---- | --------- | --------------- |
| 22   | TCP  | 0.0.0.0/0 | SSH（通常已有） |
| 3000 | TCP  | 0.0.0.0/0 | 博客访问        |

---

## ✅ 验证部署成功

### 4.1 服务器上验证

```bash
# 查看容器日志（无错误日志为正常）
docker compose logs app

# 查看数据库连接
docker compose logs db
```

### 4.2 浏览器访问

打开浏览器访问：

- **博客主页**：http://172.23.103.4:3000
- **后台管理**：http://172.23.103.4:3000/admin

用 `.env` 中配置的邮箱和密码登录。

---

## 🛠️ 常用维护命令

### 查看服务状态

```bash
cd /root/blog

# 查看容器运行状态
docker ps

# 查看详细日志
docker compose logs -f app  # app 日志
docker compose logs -f db   # 数据库日志
```

### 重启服务

```bash
# 仅重启应用
docker compose restart app

# 重启所有服务
docker compose restart
```

### 停止服务

```bash
# 停止但保留数据
docker compose down

# 重新启动
docker compose --env-file .env up -d
```

### 清理数据（谨慎！）

```bash
# 删除所有容器和卷（会丢失所有数据）
docker compose down -v

# 重新初始化
docker compose --env-file .env up -d
docker compose --env-file .env --profile tools run --rm migrate
docker compose --env-file .env --profile tools run --rm seed
```

---

## 🐛 故障排查

### 问题 1：容器一直不启动

```bash
# 查看日志找具体错误
docker compose logs app

# 常见原因：
# - 数据库还没启动好，等 30 秒再试
# - .env 配置不对，检查环境变量
```

### 问题 2：无法访问博客

```bash
# 确认容器在运行
docker ps

# 检查端口是否监听
docker compose exec app netstat -tlnp | grep 3000

# 检查阿里云安全组是否开放了 3000 端口
```

### 问题 3：数据库无法连接

```bash
# 测试 PostgreSQL 连接
docker compose exec db psql -U blog -d blog -c "SELECT 1"

# 如果连接失败，查看数据库日志
docker compose logs db
```

### 问题 4：构建镜像时 npm ci 失败

```bash
# 清理本地镜像重新构建
docker rmi blog-01-app:latest
docker build --platform linux/amd64 -t blog-01-app:latest .
```

---

## 📝 版本更新流程

当代码有更新时，重新部署：

### 本地操作

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker build --platform linux/amd64 -t blog-01-app:latest .

# 导出新镜像
docker save blog-01-app:latest | gzip > delivery/offline/deploy/blog-01-app.tar.gz

# 上传到服务器
scp delivery/offline/deploy/blog-01-app.tar.gz root@172.23.103.4:/root/blog/
```

### 服务器操作

```bash
cd /root/blog

# 停止旧服务
docker compose down

# 删除旧镜像
docker rmi blog-01-app:latest

# 导入新镜像
docker load < blog-01-app.tar.gz

# 启动新服务
docker compose --env-file .env up -d

# 等待启动完成
sleep 10 && docker ps
```

---

## 📚 相关文件说明

| 文件                       | 位置                     | 说明                   |
| -------------------------- | ------------------------ | ---------------------- |
| Dockerfile                 | 项目根目录               | Docker 构建配置        |
| docker-compose.offline.yml | delivery/offline/        | 服务编排配置（离线版） |
| .env.offline               | delivery/offline/        | 环境变量示例           |
| deploy/                    | delivery/offline/deploy/ | 交付物目录（git 忽略） |

---

## 小贴士

1. **密钥安全**：`.env` 文件包含敏感信息，不要提交到 git，已加入 `.gitignore`
2. **备份数据**：重要数据建议定期备份 PostgreSQL 数据卷
3. **监控日志**：定期检查 `docker compose logs` 发现问题
4. **网络速度**：上传文件如果太慢，可以用阿里云的内网 OSS 或其他方式加速

---

祝部署顺利！有问题请参考上面的故障排查部分。
