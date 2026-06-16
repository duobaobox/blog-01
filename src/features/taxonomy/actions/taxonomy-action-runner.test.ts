import assert from "node:assert/strict";
import test from "node:test";
import { createTaxonomyActionRunner } from "./taxonomy-action-runner";

test("taxonomy action runner refreshes category admin and public content on category updates", async () => {
  const calls: string[] = [];
  const publicPayloads: Array<unknown> = [];
  const runner = createTaxonomyActionRunner({
    taxonomyService: {
      async createCategory() {
        throw new Error("not used");
      },
      async updateCategory() {
        calls.push("service:updateCategory");
        return {
          previousCategory: {
            slug: "strategy",
          },
        };
      },
      async deleteCategory() {
        throw new Error("not used");
      },
      async createTag() {
        throw new Error("not used");
      },
      async updateTag() {
        throw new Error("not used");
      },
      async deleteTag() {
        throw new Error("not used");
      },
    },
    revalidateAdminCategories() {
      calls.push("cache:adminCategories");
    },
    revalidateAdminTags() {
      calls.push("cache:adminTags");
    },
    revalidateCategoryContent(slugs) {
      calls.push("cache:categoryContent");
      publicPayloads.push(slugs);
    },
    revalidateTagContent() {
      calls.push("cache:tagContent");
    },
  });

  await runner.updateCategory("category-1", {
    name: "Strategy",
    description: "Notes",
  });

  assert.deepEqual(calls, [
    "service:updateCategory",
    "cache:adminCategories",
    "cache:categoryContent",
  ]);
  assert.deepEqual(publicPayloads, [["strategy"]]);
});

test("taxonomy action runner refreshes tag admin and public content on tag deletions", async () => {
  const calls: string[] = [];
  const publicPayloads: Array<unknown> = [];
  const runner = createTaxonomyActionRunner({
    taxonomyService: {
      async createCategory() {
        throw new Error("not used");
      },
      async updateCategory() {
        throw new Error("not used");
      },
      async deleteCategory() {
        throw new Error("not used");
      },
      async createTag() {
        throw new Error("not used");
      },
      async updateTag() {
        throw new Error("not used");
      },
      async deleteTag() {
        calls.push("service:deleteTag");
        return {
          tag: {
            slug: "ai",
          },
        };
      },
    },
    revalidateAdminCategories() {
      calls.push("cache:adminCategories");
    },
    revalidateAdminTags() {
      calls.push("cache:adminTags");
    },
    revalidateCategoryContent() {
      calls.push("cache:categoryContent");
    },
    revalidateTagContent(slugs) {
      calls.push("cache:tagContent");
      publicPayloads.push(slugs);
    },
  });

  await runner.deleteTag("tag-1");

  assert.deepEqual(calls, [
    "service:deleteTag",
    "cache:adminTags",
    "cache:tagContent",
  ]);
  assert.deepEqual(publicPayloads, [["ai"]]);
});
