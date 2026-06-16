import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { createSavedContentViewService } from "./content-space-saved-view.service";

function createRepositoryDouble(overrides?: Partial<Parameters<typeof createSavedContentViewService>[0]>) {
  return {
    async findSavedContentViewsByUser() {
      return [];
    },
    async countSavedContentViewsByUser() {
      return 0;
    },
    async findSavedContentViewById() {
      return null;
    },
    async findSavedContentViewByNameKey() {
      return null;
    },
    async createSavedContentView(input: {
      userId: string;
      name: string;
      nameKey: string;
      filters: unknown;
    }) {
      return {
        id: "view-1",
        name: input.name,
        nameKey: input.nameKey,
        filters: input.filters,
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
        updatedAt: new Date("2026-06-15T10:00:00.000Z"),
        createdBy: input.userId,
      };
    },
    async updateSavedContentView(
      id: string,
      input: {
        name: string;
        nameKey: string;
        filters: unknown;
      },
    ) {
      return {
        id,
        name: input.name,
        nameKey: input.nameKey,
        filters: input.filters,
        createdAt: new Date("2026-06-15T09:00:00.000Z"),
        updatedAt: new Date("2026-06-15T10:00:00.000Z"),
        createdBy: "admin-1",
      };
    },
    async deleteSavedContentView() {},
    ...overrides,
  };
}

test("saved view service returns normalized saved views for the current admin", async () => {
  const service = createSavedContentViewService(
    createRepositoryDouble({
      async findSavedContentViewsByUser() {
        return [
          {
            id: "view-1",
            name: "  待补 SEO  ",
            nameKey: "待补 seo",
            filters: {
              status: "draft",
              debt: "missingSeoTitle",
              ignored: true,
            },
            createdAt: new Date("2026-06-15T10:00:00.000Z"),
            updatedAt: new Date("2026-06-15T10:00:00.000Z"),
            createdBy: "admin-1",
          },
        ];
      },
    }),
  );

  const result = await service.getSavedContentViews("admin-1");

  assert.deepEqual(result, [
    {
      id: "view-1",
      name: "待补 SEO",
      filters: {
        status: "draft",
        debt: "missingSeoTitle",
      },
      createdAt: "2026-06-15T10:00:00.000Z",
    },
  ]);
});

test("saved view service updates same-name views instead of creating duplicates", async () => {
  const calls: string[] = [];
  const service = createSavedContentViewService(
    createRepositoryDouble({
      async findSavedContentViewByNameKey() {
        calls.push("repo:findByNameKey");
        return {
          id: "view-1",
          name: "待补 SEO",
          nameKey: "待补 seo",
          filters: {
            status: "draft",
          },
          createdAt: new Date("2026-06-15T09:00:00.000Z"),
          updatedAt: new Date("2026-06-15T09:00:00.000Z"),
          createdBy: "admin-1",
        };
      },
      async updateSavedContentView() {
        calls.push("repo:update");
        return {
          id: "view-1",
          name: "待补 SEO",
          nameKey: "待补 seo",
          filters: {
            debt: "missingSeoDescription",
          },
          createdAt: new Date("2026-06-15T09:00:00.000Z"),
          updatedAt: new Date("2026-06-15T10:00:00.000Z"),
          createdBy: "admin-1",
        };
      },
    }),
  );

  const result = await service.saveSavedContentView({
    userId: "admin-1",
    name: "  待补   SEO ",
    filters: {
      debt: "missingSeoDescription",
    },
  });

  assert.deepEqual(calls, ["repo:findByNameKey", "repo:update"]);
  assert.equal(result.id, "view-1");
  assert.equal(result.filters.debt, "missingSeoDescription");
});

test("saved view service enforces the saved view cap", async () => {
  const service = createSavedContentViewService(
    createRepositoryDouble({
      async countSavedContentViewsByUser() {
        return 12;
      },
    }),
  );

  await assert.rejects(
    () =>
      service.saveSavedContentView({
        userId: "admin-1",
        name: "内容视图",
        filters: {},
      }),
    (error) =>
      error instanceof ValidationError &&
      error.message === "最多只能保存 12 个视图",
  );
});

test("saved view service rejects deleting views from another admin", async () => {
  const service = createSavedContentViewService(
    createRepositoryDouble({
      async findSavedContentViewById() {
        return {
          id: "view-1",
          name: "内容视图",
          nameKey: "内容视图",
          filters: {},
          createdAt: new Date("2026-06-15T09:00:00.000Z"),
          updatedAt: new Date("2026-06-15T10:00:00.000Z"),
          createdBy: "admin-2",
        };
      },
    }),
  );

  await assert.rejects(
    () =>
      service.deleteSavedContentView({
        userId: "admin-1",
        viewId: "view-1",
      }),
    (error) =>
      error instanceof ValidationError &&
      error.message === "不能删除其他人的保存视图",
  );
});
