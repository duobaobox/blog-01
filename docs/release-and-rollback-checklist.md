# 发版与回滚 Checklist

## 使用方式

这份清单不是解释原理，而是给发版人和值班同学直接照着走的。

配套文档：

- [Docker 构建与发版指导](/Users/duobao/个人/个人-网站搭建/blog-01/docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](/Users/duobao/个人/个人-网站搭建/blog-01/docs/alicloud-docker-nginx-https-guide.md)

## 发版前

- [ ] 确认本次代码已经合并到目标分支
- [ ] 确认 `.env` 仍然是生产值，不含 `localhost`
- [ ] 确认 `BETTER_AUTH_URL` 和 `NEXT_PUBLIC_SITE_URL` 使用正式域名
- [ ] 确认 `STORAGE_PROVIDER` 符合当前环境
- [ ] 确认数据库有可用备份方案
- [ ] 确认上传文件有可用备份方案
- [ ] 记录当前线上 commit/tag，方便回滚

## 发版操作

```bash
git pull
docker compose up -d --build
docker compose run --rm --profile tools migrate
```

如果是首发或需要重建管理员：

```bash
docker compose run --rm --profile tools seed
```

## 发版后检查

### 服务状态

- [ ] `docker compose ps` 正常
- [ ] `docker compose logs app --tail=100` 无明显报错
- [ ] `docker compose logs db --tail=100` 无明显报错
- [ ] Nginx reload 正常

### 访问检查

- [ ] 首页可访问
- [ ] `/blog` 可访问
- [ ] `/about` 可访问
- [ ] `/projects` 可访问
- [ ] `/admin/login` 可访问

### SEO 检查

- [ ] `/robots.txt` 正常
- [ ] `/sitemap.xml` 正常
- [ ] `/feed.xml` 正常
- [ ] 页面 title / canonical 不含 `localhost`

### 后台检查

- [ ] 管理员能登录
- [ ] 能打开文章列表
- [ ] 能新建或编辑文章
- [ ] 能上传图片
- [ ] 发布后的文章前台可见

## 可直接执行的检查命令

```bash
docker compose ps
docker compose logs app --tail=100
docker compose logs db --tail=100
curl -I https://your-domain.com
curl -I https://your-domain.com/admin/login
curl -s https://your-domain.com/robots.txt
curl -s https://your-domain.com/sitemap.xml | head
curl -s https://your-domain.com/feed.xml | head
```

## 回滚触发条件

出现下面任一情况，可以考虑回滚：

- 首页或后台无法访问
- 登录链路异常
- 数据库迁移后页面报错
- 上传功能失效
- SEO 文件输出异常
- 本次变更影响核心发布流程

## 回滚操作

```bash
git log --oneline -n 5
git checkout <上一个稳定提交或标签>
docker compose up -d --build
docker compose run --rm --profile tools migrate
```

## 回滚后检查

- [ ] 首页恢复正常
- [ ] 后台登录恢复正常
- [ ] 数据库连接正常
- [ ] 核心文章列表和详情页正常
- [ ] 图片资源可访问

## 发版记录模板

```text
发版时间：
操作人：
目标提交：
是否执行 migrate：
是否执行 seed：
发版结果：
异常情况：
是否回滚：
回滚到哪个提交：
```
