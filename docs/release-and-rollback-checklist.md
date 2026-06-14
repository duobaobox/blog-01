# 发版与回滚 Checklist

## 发版前

- [ ] 确认本次代码已经合并到目标分支
- [ ] 确认 `.env` 或交付 compose 中不含 `localhost`
- [ ] 确认 `BETTER_AUTH_URL` 和 `SITE_URL` 使用真实访问地址
- [ ] 确认数据库有可用备份方案
- [ ] 确认站点媒体库有可用备份方案
- [ ] 记录当前线上 commit/tag 或离线包版本

## 发版操作

源码部署：

```bash
git pull
docker compose up -d --build db
docker compose run --rm --profile tools migrate
docker compose up -d app
```

离线交付：

```bash
bash scripts/import-offline-bundle.sh .
bash scripts/start-offline-stack.sh .
```

如需按当前配置重建默认管理员：

```bash
docker compose -f config/docker-compose.yml run --rm --profile tools seed
```

## 发版后检查

- [ ] `docker compose ps` 正常
- [ ] `docker compose logs app --tail=100` 无明显报错
- [ ] `docker compose logs db --tail=100` 无明显报错
- [ ] 首页可访问
- [ ] `/admin/login` 可访问
- [ ] 管理员能登录
- [ ] 能新建或编辑文章
- [ ] 能上传图片
- [ ] `/robots.txt` 正常
- [ ] `/sitemap.xml` 正常
- [ ] `/feed.xml` 正常
- [ ] 页面 title / canonical 不含 `localhost`

## 可直接执行的检查命令

源码部署：

```bash
docker compose ps
docker compose logs app --tail=100
docker compose logs db --tail=100
```

离线交付：

```bash
docker compose -f config/docker-compose.yml ps
docker compose -f config/docker-compose.yml logs app --tail=100
docker compose -f config/docker-compose.yml logs db --tail=100
```

## 回滚触发条件

- 首页或后台无法访问
- 登录链路异常
- 数据库迁移后页面报错
- 上传功能失效
- SEO 文件输出异常

## 回滚原则

- 先恢复应用版本
- 再确认数据库 schema 是否兼容
- 不要在没有备份的情况下直接删 volume

## 发版记录模板

```text
发版时间：
操作人：
目标提交或离线包版本：
是否执行 migrate：
是否执行 seed：
发版结果：
异常情况：
是否回滚：
```
