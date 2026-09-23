# 站点自定义

Blog-01 的公开站点由两部分组成：**后台可维护的站点设置**，和**刻意的代码内静态内容**。本文说明每类内容应该改哪里，以及不要做什么。

## 后台可以修改的内容

登录后台后在「设置」中维护，保存在数据库，不需要改代码，也不需要重新构建镜像：

- 站点名称、副标题、描述；
- 站点 URL、联系邮箱；
- Logo、favicon、头像；
- GitHub / X 链接；
- 页脚文案。

## 代码内维护的内容

以下内容是刻意的静态实现，不提供后台 CMS：

| 内容                                 | 位置                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| 首页文案、按钮、模块开关、场景图配置 | `src/features/home/config/home.config.ts`              |
| 首页模块组合                         | `src/app/(home)/page.tsx`                              |
| 关于页                               | `src/app/(public)/about/page.tsx`                      |
| 项目页                               | `src/app/(public)/projects/page.tsx`                   |
| 静态页公共外壳                       | `src/components/blog/static-page-shell.tsx`            |
| 导航栏 / 页脚                        | `src/shared/ui/header.tsx`、`src/shared/ui/footer.tsx` |
| 站点强调色                           | `src/app/public-theme.css`                             |
| 前台整体外壳与主题                   | `src/components/blog/public-shell.tsx`                 |

修改后本地 `npm run dev` 预览。部署到服务器时注意：官方安装脚本拉取的是上游发布的镜像，不包含你的本地改动；需要自己构建镜像，或使用你 fork 的发布流程。

## 首页场景素材

`public/home/scenes/` 下的 PNG 是随仓库分发的示例素材，建议替换为自己的图片：

- 保持 1600 × 1000 画布、透明背景，主体和桌面基线一致；
- 在 `home.config.ts` 的 `visual.light` / `visual.dark` 中登记新文件；
- 详细约定见 [首页随机场景素材](./home-hero-scenes.md)。

## 维护约束

- 不把 About / Projects 改造成后台 CMS 模块——这是当前产品边界；
- 站点信息能通过后台设置的，不要在代码里硬编码第二份；
- 不要用 `:has()` 或路径判断反向修改公共布局，页面差异通过路由组布局和 `surface` 表达。

## 相关文档

- [首页风格 DIY](./homepage-diy.md)
- [前台页面框架与主题扩展](./public-page-layouts.md)
- [首页随机场景素材](./home-hero-scenes.md)
