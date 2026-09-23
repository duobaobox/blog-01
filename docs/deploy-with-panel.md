# 宝塔 / 1Panel 面板部署

适用：已有 Linux 服务器和运维面板（宝塔、1Panel 等），希望用面板管理 Docker、域名和证书。本质仍是「Docker + 反向代理」，安装流程与裸机一致。

## 前置条件

- Linux AMD64 服务器，建议至少 2GB 内存；
- 面板已安装；Docker 可由面板应用商店安装，也可以交给安装脚本处理。

## 部署步骤

### 1. 安装 Blog-01

在面板的「终端」中执行官方安装脚本（自动安装 Docker、生成密钥、启动数据库和应用）：

```bash
curl -fsSL https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh | sudo bash
```

安装完成后终端会打印管理员初始化口令，请先保存。

### 2. 验证服务

```bash
cd /opt/blog-01
sudo ./blogctl status
curl -I http://127.0.0.1:3000/api/health
```

健康检查返回 `200` 即正常。

### 3. 配置反向代理

- **宝塔**：网站 → 添加站点（只填域名，不创建数据库和 PHP）→ 设置 → 反向代理 → 目标 `http://127.0.0.1:3000`，发送域名 `$host`；
- **1Panel**：网站 → 创建网站 → 反向代理 → 上游地址 `http://127.0.0.1:3000`。

### 4. 开启 HTTPS

在面板中使用 Let's Encrypt 申请证书，并开启「强制 HTTPS」。

### 5. 初始化管理员

打开 `https://你的域名/admin/setup`，填入安装时打印的口令，创建管理员。完成后该入口不再可用。

### 6. 配置备份（建议）

在面板的「计划任务」中添加：

```bash
cd /opt/blog-01 && sudo ./blogctl backup
```

备份默认存放在 `/opt/blog-01/backups/`，建议再同步到异地（对象存储或其他服务器）。

## 日常维护

```bash
cd /opt/blog-01
sudo ./blogctl status    # 查看状态
sudo ./blogctl logs      # 查看日志
sudo ./blogctl update    # 升级到最新版本（失败自动回滚）
sudo ./blogctl backup    # 备份数据库与媒体
```

## 注意事项

- 防火墙只开放 `22 / 80 / 443`，不要暴露数据库端口；
- 不要执行 `docker compose down -v`，`-v` 会删除数据库和媒体卷；
- 升级请统一用 `blogctl update`，避免面板和脚本同时操作容器。
