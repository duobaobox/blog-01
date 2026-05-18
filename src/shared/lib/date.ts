/**
 * 格式化日期对象为 YYYY年MM月DD日 格式
 * 这样可以确保在服务端 (Node.js) 和客户端 (浏览器) 渲染结果始终一致，
 * 避免因为 locale 环境不同导致的水合 (Hydration) 报错。
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  
  // 检查无效日期
  if (isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  return `${year}年${month}月${day}日`;
}
