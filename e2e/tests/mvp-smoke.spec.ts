import { expect, test, type Page } from "@playwright/test";

const admin = {
  name: "MVP Admin",
  email: "mvp-admin@example.com",
  username: "mvp-admin",
  password: "mvp-admin-password-2026",
};

const setupToken = process.env.E2E_SETUP_TOKEN ?? "ci-container-setup-token";
const transparentPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJWAAAAABJRU5ErkJggg==";

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("登录账号").fill(admin.username);
  await page.getByLabel("密码", { exact: true }).fill(admin.password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/?(?:\?.*)?$/);
}

async function ensureAdminSession(page: Page) {
  await page.goto("/admin/setup");

  if (
    await page
      .getByRole("button", { name: "创建管理员账号", exact: true })
      .isVisible()
  ) {
    await page.getByLabel("昵称").fill(admin.name);
    await page.getByLabel("邮箱").fill(admin.email);
    await page.getByLabel("登录账号").fill(admin.username);
    await page.getByLabel("密码", { exact: true }).fill(admin.password);
    await page.getByLabel("确认密码", { exact: true }).fill(admin.password);
    await page.getByLabel("初始化口令").fill(setupToken);
    await page.getByRole("button", { name: "创建管理员账号", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/?(?:\?.*)?$/);
    return;
  }

  await signIn(page);
}

test.describe.configure({ mode: "serial" });

test("管理员可完成初始化、访问后台、上传媒体并浏览公开博客", async ({
  page,
}) => {
  await ensureAdminSession(page);

  const upload = await page.evaluate(async (png) => {
    const bytes = Uint8Array.from(atob(png), (character) =>
      character.charCodeAt(0),
    );
    const formData = new FormData();
    formData.set(
      "file",
      new File([bytes], "mvp-smoke.png", { type: "image/png" }),
    );

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    return {
      status: response.status,
      body: await response.json(),
    };
  }, transparentPng);

  expect(upload.status).toBe(200);
  expect(upload.body.media?.url).toMatch(/^\/media\//);

  const mediaResponse = await page.request.get(upload.body.media.url);
  expect(mediaResponse.ok()).toBeTruthy();

  await page.goto("/blog");
  await expect(
    page.getByRole("heading", { name: "博客", exact: true }),
  ).toBeVisible();
});

test("管理员可以在新会话中重新登录", async ({ page }) => {
  await page.context().clearCookies();
  await signIn(page);
});
