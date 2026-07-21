# 首页随机场景素材

首页 Hero 使用独立的透明 PNG 素材，不在 SVG 或组件源码中嵌入 Base64。场景配置位于 `src/features/home/config/home.config.ts`，渲染组件位于 `src/features/home/components/home-hero-visual.tsx`。

## 当前素材

```text
public/home/scenes/
  day-work1.png
  day-break1.png
  day-window1.png
  night-work1.png
  night-sleep1.png
```

- `visual.light`：亮色主题场景。
- `visual.dark`：暗色主题场景。
- 用户进入首页后，从当前主题分组随机选择一张。
- 用户切换明暗主题时，从新主题分组重新随机选择一张。
- 服务端和首次水合固定使用亮色分组第一张，避免随机数导致水合不一致；主题状态可用后再完成随机选择。

## 响应式布局

Hero 使用同一画布中的文案层和插画层，不再把两者限制在左右两列中。文案层始终位于插画层上方；桌面宽度达到 1024px 后，插画层使用绝对定位向左延伸，与文案形成适度叠层。小于 1024px 时恢复正常文档流，文案在上、插画在下，避免图片遮挡按钮或造成页面横向滚动。

场景素材应保持统一的 1600 × 1000 画布、接近一致的主体比例和桌面基线。左侧透明区域可作为桌面端文案叠层的安全空间，但不同场景的主体位置不应有明显跳动。

## 替换与扩展

素材建议统一为 `1600 × 1000` 的透明 PNG，主体和桌面保持在画布内，左侧预留文案空间。替换时可以直接覆盖同名文件；新增场景时，将文件放入 `public/home/scenes`，再向对应主题数组添加 `imageUrl` 和有意义的 `imageAlt`。

不要把图片转换为 Base64 写进 TSX、CSS 或 SVG。这样可以保持源码可读，并让 Next.js 独立处理图片缓存和优化。
