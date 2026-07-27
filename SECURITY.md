# Security Policy

## Supported versions

Blog-01 仍处于 `0.x` 阶段。安全修复优先发布到最新的稳定小版本，旧版本可能不会单独维护。

## Reporting a vulnerability

请不要在公开 Issue、Discussion 或 Pull Request 中披露以下内容：

- 身份验证绕过；
- 任意文件上传或读取；
- SQL 注入；
- 远程代码执行；
- 管理员初始化绕过；
- 密钥、Token 或个人数据泄露；
- 其他会直接影响已部署实例的漏洞。

优先使用仓库页面的：

```text
Security → Report a vulnerability
```

提交时请包含：

- 受影响版本；
- 部署方式；
- 复现步骤；
- 实际结果与预期结果；
- 可能的影响范围；
- 已知缓解方式；
- 必要的日志或最小复现代码。

在修复版本发布前，请不要公开漏洞细节。维护者会在确认后协调修复、版本发布和公开披露时间。

## Deployment security

生产部署至少应做到：

- 使用随机且长度足够的 `BETTER_AUTH_SECRET`；
- 妥善保管 `.env.release` 和 `ADMIN_SETUP_TOKEN`；
- 不向公网开放 PostgreSQL 端口；
- 使用 HTTPS；
- 定期备份数据库和媒体；
- 及时升级到最新稳定版本；
- 不运行来源不明的容器镜像或修改版安装脚本。
