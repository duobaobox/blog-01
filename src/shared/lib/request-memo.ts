import { cache } from "react";

/**
 * 请求级记忆化。
 *
 * 同一个路由的 `generateMetadata` 与页面组件会各自调用同一份公开查询，
 * Next.js 不会在这两者之间共享局部变量。用 React `cache` 包裹后，
 * 一次请求内参数相同的调用只会真正访问数据库一次，请求结束即失效，
 * 因此不存在 `unstable_cache` 那种跨请求的陈旧数据风险。
 */
export type QueryMemoizer = typeof cache;

export const memoizeQuery: QueryMemoizer = cache;
