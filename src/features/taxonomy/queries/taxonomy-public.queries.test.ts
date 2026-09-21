import assert from "node:assert/strict";
import test from "node:test";
import type { QueryMemoizer } from "@/shared/lib/request-memo";
import {
  createAdminCategoriesPageDataQuery,
  createPublicCategoryQueries,
} from "./category.queries";
import {
  createAdminTagsPageDataQuery,
  createPublicTagQueries,
} from "./tag.queries";

test("public category queries always use public scope", async () => {
  const calls: Array<{ fn: string; arg?: unknown }> = [];
  const queries = createPublicCategoryQueries({
    async findCategories(scope) {
      calls.push({ fn: "findCategories", arg: scope });
      return [] as never;
    },
    async findPublicCategoryBySlug(slug) {
      calls.push({ fn: "findPublicCategoryBySlug", arg: slug });
      return { slug } as never;
    },
  });

  await queries.getCategories();
  await queries.getCategoryBySlug("engineering");

  assert.deepEqual(calls, [
    { fn: "findCategories", arg: "public" },
    { fn: "findPublicCategoryBySlug", arg: "engineering" },
  ]);
});

test("public category queries fall back when the database is unavailable", async () => {
  const queries = createPublicCategoryQueries({
    async findCategories() {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
      (error as Error & { code?: string }).code = "ECONNREFUSED";
      throw error;
    },
    async findPublicCategoryBySlug() {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
      (error as Error & { code?: string }).code = "ECONNREFUSED";
      throw error;
    },
  });

  assert.deepEqual(await queries.getCategories(), []);
  assert.equal(await queries.getCategoryBySlug("engineering"), null);
});

test("public tag queries always use public scope", async () => {
  const calls: Array<{ fn: string; arg?: unknown }> = [];
  const queries = createPublicTagQueries({
    async findTags(scope) {
      calls.push({ fn: "findTags", arg: scope });
      return [] as never;
    },
    async findPublicTagBySlug(slug) {
      calls.push({ fn: "findPublicTagBySlug", arg: slug });
      return { slug } as never;
    },
  });

  await queries.getTags();
  await queries.getTagBySlug("react");

  assert.deepEqual(calls, [
    { fn: "findTags", arg: "public" },
    { fn: "findPublicTagBySlug", arg: "react" },
  ]);
});

test("public tag queries fall back when the database is unavailable", async () => {
  const queries = createPublicTagQueries({
    async findTags() {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
      (error as Error & { code?: string }).code = "ECONNREFUSED";
      throw error;
    },
    async findPublicTagBySlug() {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
      (error as Error & { code?: string }).code = "ECONNREFUSED";
      throw error;
    },
  });

  assert.deepEqual(await queries.getTags(), []);
  assert.equal(await queries.getTagBySlug("react"), null);
});

test("createAdminCategoriesPageDataQuery short-circuits during production build", async () => {
  const calls: string[] = [];
  const query = createAdminCategoriesPageDataQuery({
    isProductionBuildPhase() {
      calls.push("phase");
      return true;
    },
    async getCategories() {
      calls.push("categories");
      return [{ id: "cat-1" }] as never;
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["phase"]);
  assert.deepEqual(result, {
    categories: [],
  });
});

test("createAdminTagsPageDataQuery returns admin taxonomy lists outside production build", async () => {
  const calls: string[] = [];
  const query = createAdminTagsPageDataQuery({
    isProductionBuildPhase() {
      calls.push("phase");
      return false;
    },
    async getTags() {
      calls.push("tags");
      return [{ id: "tag-1" }, { id: "tag-2" }] as never;
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["phase", "tags"]);
  assert.deepEqual(result, {
    tags: [{ id: "tag-1" }, { id: "tag-2" }],
  });
});

function createRecordingMemoizer(): QueryMemoizer {
  const store = new Map<string, unknown>();

  const record = (fn: (...args: never[]) => unknown) =>
    function (...args: never[]) {
      const key = JSON.stringify(args);

      if (!store.has(key)) {
        store.set(key, fn(...args));
      }

      return store.get(key);
    };

  return record as unknown as QueryMemoizer;
}

test("public tag slug query is memoized so generateMetadata and the page share one read", async () => {
  const slugs: string[] = [];
  const queries = createPublicTagQueries(
    {
      async findTags() {
        return [] as never;
      },
      async findPublicTagBySlug(slug) {
        slugs.push(slug);
        return { slug } as never;
      },
    },
    createRecordingMemoizer(),
  );

  await queries.getTagBySlug("react");
  await queries.getTagBySlug("react");
  await queries.getTagBySlug("nextjs");

  assert.deepEqual(slugs, ["react", "nextjs"]);
});

test("public category slug query is memoized so generateMetadata and the page share one read", async () => {
  const slugs: string[] = [];
  const queries = createPublicCategoryQueries(
    {
      async findCategories() {
        return [] as never;
      },
      async findPublicCategoryBySlug(slug) {
        slugs.push(slug);
        return { slug } as never;
      },
    },
    createRecordingMemoizer(),
  );

  await queries.getCategoryBySlug("engineering");
  await queries.getCategoryBySlug("engineering");

  assert.deepEqual(slugs, ["engineering"]);
});
