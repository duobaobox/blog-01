# 博客部署教程

适用于将博客部署到自己的服务器（Linux/阿里云/腾讯云等）。

---

## 一、准备文件包

`deploy/` 文件夹包含以下文件：

| 文件                 | 说明                     |
| -------------------- | ------------------------ |
| `blog-01-app.tar.gz` | 博客应用镜像             |
| `postgres-16.tar.gz` | 数据库镜像               |
| `docker-compose.yml` | 服务配置（**需要修改**） |
| `deploy.sh`          | 一键部署脚本             |

---

## 二、修改配置（必做！）

用文本编辑器打开 `deploy/docker-compose.yml`，找到所有 `⚙️` 标注的地方并修改：

```yaml
# ⚙️ 数据库密码（两处都要改，必须保持一致）
DATABASE_URL: postgresql://blog:请修改数据库密码@db:5432/blog?schema=public
...
POSTGRES_PASSWORD: 请修改数据库密码

# ⚙️ Auth 密钥：随机字符串，32位以上（可用 openssl rand -base64 32 生成）
BETTER_AUTH_SECRET: 请替换为随机字符串

# ⚙️ 博客访问地址，填写你服务器的 IP 或域名
BETTER_AUTH_URL: http://你的服务器IP:3000
SITE_URL: http://你的服务器IP:3000
```

> **提示**：生成随机密钥的方法（在本机终端执行）：
>
> ```bash
> openssl rand -base64 32
> ```

---

## 三、上传到服务器

将整个 `deploy/` 文件夹（4个文件）上传到服务器，例如 `/root/blog/`。

**上传工具推荐**：FileZilla、Cyberduck（图形界面），或使用 scp：

```bash
scp -r deploy/ root@你的服务器IP:/root/blog/
```

---

## 四、服务器部署

通过 SSH 连接服务器，然后执行：

### 1. 安装 Docker（如已安装跳过）

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version  # 验证安装成功
```

### 2. 进入上传目录，运行部署脚本

```bash
cd /root/blog
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：导入镜像 → 启动服务 → 初始化数据库。

---

## 五、创建管理员账号

部署完成后，**首次访问后台会自动跳转到初始化页面**：

1. 打开浏览器，访问：`http://你的服务器IP:3000/admin`
2. 系统自动跳转到 `/admin/setup` 初始化向导
3. 填写昵称、邮箱和密码，完成管理员账号创建
4. 创建成功后自动登录，进入后台

> **安全提示**：设置密码时建议使用 12 位以上、包含字母和数字的密码。

---

## 六、开放防火墙端口

如果使用阿里云 / 腾讯云，需要在控制台开放端口：

- 登录控制台 → 安全组 → 入方向规则 → 添加规则
- 端口：`3000`，协议：`TCP`，来源：`0.0.0.0/0`

---

## 七、访问博客

| 地址                       | 说明     |
| -------------------------- | -------- |
| `http://你的IP:3000`       | 博客首页 |
| `http://你的IP:3000/admin` | 后台管理 |

---

## 常用运维命令

```bash
# 进入部署目录
cd /root/blog

# 查看运行状态
docker compose ps

# 查看应用日志
docker compose logs app

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新（重新上传镜像后执行）
docker load < blog-01-app.tar.gz
docker compose up -d
```

---

## 常见问题

**Q: 页面打不开？**

1. 确认安全组开放了 3000 端口
2. 检查容器状态：`docker compose ps`（应都显示 `Up`）
3. 查看日志：`docker compose logs app`

**Q: 数据库连接错误？**

- 等待 30 秒后重试（数据库首次启动较慢）
- 检查 `docker-compose.yml` 里数据库密码是否两处一致

**Q: 忘记管理员密码？**

- 登录后台 → 账户设置 → 修改密码
- 或重置数据库（会删除所有数据）：`docker compose down -v && ./deploy.sh`

**Q: 更新博客版本？**

1. 将新的 `blog-01-app.tar.gz` 上传到服务器
2. 执行：`docker load < blog-01-app.tar.gz && docker compose up -d`
