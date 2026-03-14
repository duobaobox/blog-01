import { extractToc } from "../src/infrastructure/markdown";

const testMarkdown = `
# 主标题（不会被提取）

## 第一个标题
这是内容

## 测试标题
更多内容

### 子标题1
子内容

### 子标题2
子内容

## 123
数字标题

## 123
重复标题测试
`;

console.log("Testing TOC extraction with Chinese titles:\n");

const toc = extractToc(testMarkdown);

console.log("Generated TOC:");
toc.forEach((item, index) => {
  console.log(
    `${index + 1}. ID: "${item.id}" | Title: "${item.title}" | Level: ${item.level}`,
  );
});

// Check for duplicate IDs
const ids = toc.map((item) => item.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicates.length > 0) {
  console.log("\n❌ Found duplicate IDs:", duplicates);
} else {
  console.log("\n✅ All IDs are unique!");
}
