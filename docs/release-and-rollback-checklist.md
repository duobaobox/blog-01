# 发版与回滚 Checklist

## 发版前

- [ ] 确认本次代码已经提交
- [ ] 确认 `npm run build` 通过
- [ ] 确认 `BETTER_AUTH_URL` / `BETTER_AUTH_TRUSTED_ORIGINS` / `SITE_URL` 不含 `localhost`
- [ ] 确认默认管理员账号已使用 `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`
- [ ] 确认数据库和媒体目录有备份
- [ ] 记录当前线上镜像版本或当前交付包时间

## 本地发版动作

```bash
docker buildx build --platform linux/amd64 -t blog-01-app:release --load .
mkdir -p dist/app-delivery
docker save -o dist/app-delivery/blog-01-app-release.tar blog-01-app:release
bash scripts/release/refresh-app-delivery.sh
tar -C dist -czf dist/app-delivery-release.tar.gz app-delivery
```

## 服务器部署动作

```bash
cd /root
rm -rf app-delivery
tar -xzf app-delivery-release.tar.gz
cd app-delivery
bash install.sh
```

## 发版后检查

- [ ] `docker compose ps` 正常
- [ ] `docker compose logs --tail=100 blog` 无明显报错
- [ ] 首页可访问
- [ ] `/admin/login` 可访问
- [ ] 默认管理员能登录
- [ ] 修改默认管理员账号和密码后，重新登录正常
- [ ] 能新建文章
- [ ] 能上传图片
- [ ] `/robots.txt` 正常
- [ ] `/sitemap.xml` 正常
- [ ] `/feed.xml` 正常

## 可直接执行的检查命令

```bash
cd /root/app-delivery
docker compose --env-file .env.release -f docker-compose.release.yml ps
docker compose --env-file .env.release -f docker-compose.release.yml logs --tail=100 blog
grep -E '^(BETTER_AUTH_URL|BETTER_AUTH_TRUSTED_ORIGINS|SITE_URL|SEED_ADMIN_USERNAME)=' .env.release
```

## 回滚触发条件

- 首页或后台无法访问
- 登录链路异常
- 默认管理员无法登录
- 上传功能失效
- 发布后前台文章异常

## 回滚原则

1. 先保留当前 `.env.release`
2. 回退到上一版 `app-delivery-release.tar.gz`
3. 重新解压并执行 `bash install.sh . --no-edit`
4. 如无必要，不直接删数据库卷

## 发版记录模板

```text
发版时间：
操作人：
本地镜像标签：
交付包文件名：
服务器地址：
是否完成登录验证：
是否完成上传验证：
是否回滚：
备注：
```
