const PUBLIC_DATE_TIME_ZONE = "Asia/Shanghai";

const publicDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: PUBLIC_DATE_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/**
 * 使用固定时区格式化公开页面日期，避免服务端与浏览器时区不同导致水合差异。
 */
export function formatDate(date: Date | string | number): string {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const parts = publicDateFormatter.formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}年${values.month}月${values.day}日`;
}
