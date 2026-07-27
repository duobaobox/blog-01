import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const forbiddenReadModelPatterns = [
  /requireAdminSession/,
  /getAdminSessionIdentity/,
  /auth\.api/,
  /getSession/,
  /from\s+["']@\/infrastructure\/db["']/,
  /from\s+["']@\/infrastructure\/auth["']/,
  /\bdb\./,
  /\bprisma\./i,
];

const forbiddenAdminComponentPatterns = [
  /from\s+["']@\/infrastructure\/auth\/bootstrap["']/,
  /from\s+["']@\/infrastructure\/auth["']/,
  /from\s+["']@\/infrastructure\/db["']/,
  /requireAdminSession/,
  /getAdminSessionIdentity/,
  /\bdb\./,
  /\bprisma\./i,
];

async function readWorkspaceFile(path: string) {
  return readFile(join(process.cwd(), path), "utf8");
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(join(process.cwd(), root), {
    withFileTypes: true,
  });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = `${root}/${entry.name}`;

      if (entry.isDirectory()) {
        return listFiles(path);
      }

      return [path];
    }),
  );

  return files.flat();
}

async function listProtectedAdminEntries() {
  const files = await listFiles("src/app/admin/(protected)");
  return files
    .filter(
      (file) => file.endsWith("/page.tsx") || file.endsWith("/layout.tsx"),
    )
    .sort();
}

test("protected admin entries do not assemble session or database read models directly", async () => {
  const protectedAdminEntries = await listProtectedAdminEntries();

  for (const entry of protectedAdminEntries) {
    const source = await readWorkspaceFile(entry);

    for (const pattern of forbiddenReadModelPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${entry} should keep ${pattern} out of page/layout`,
      );
    }
  }
});

test("protected admin entries either consume page-data queries or redirect into the unified workspace", async () => {
  const protectedAdminEntries = await listProtectedAdminEntries();

  for (const entry of protectedAdminEntries) {
    const source = await readWorkspaceFile(entry);
    const consumesPageData = /getAdmin[A-Za-z]+PageData/.test(source);
    const redirectsToWorkspace = /redirect\(["'`]\/admin\/posts/.test(source);

    assert.equal(
      consumesPageData || redirectsToWorkspace,
      true,
      `${entry} should consume page-data or redirect to a unified admin workspace`,
    );
  }
});

test("admin UI components stay free of bootstrap, session, and database read-model assembly", async () => {
  const componentFiles = (await listFiles("src/components/admin"))
    .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
    .sort();

  for (const component of componentFiles) {
    const source = await readWorkspaceFile(component);

    for (const pattern of forbiddenAdminComponentPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${component} should receive query projections through props instead of assembling admin state`,
      );
    }
  }
});
