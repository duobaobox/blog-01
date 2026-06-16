import assert from "node:assert/strict";
import test from "node:test";
import { createMediaActionRunner } from "./media-action-runner";

test("media action runner uploads media before refreshing admin media", async () => {
  const calls: string[] = [];
  const runner = createMediaActionRunner({
    mediaService: {
      async uploadFile() {
        calls.push("service:upload");
        return {
          id: "media-1",
          url: "/media/file.png",
        };
      },
      async deleteFile() {
        throw new Error("not used");
      },
      async updateMediaAlt() {
        throw new Error("not used");
      },
      async replaceFile() {
        throw new Error("not used");
      },
    },
    revalidateAdminPaths(paths) {
      calls.push(`cache:${paths.join(",")}`);
    },
  });

  const result = await runner.uploadMedia(new File(["data"], "file.png", {
    type: "image/png",
  }));

  assert.deepEqual(calls, ["service:upload", "cache:/admin/media"]);
  assert.deepEqual(result, {
    id: "media-1",
    url: "/media/file.png",
  });
});

test("media action runner deletes media before refreshing admin media", async () => {
  const calls: string[] = [];
  const runner = createMediaActionRunner({
    mediaService: {
      async uploadFile() {
        throw new Error("not used");
      },
      async deleteFile() {
        calls.push("service:delete");
      },
      async updateMediaAlt() {
        throw new Error("not used");
      },
      async replaceFile() {
        throw new Error("not used");
      },
    },
    revalidateAdminPaths(paths) {
      calls.push(`cache:${paths.join(",")}`);
    },
  });

  await runner.deleteMedia("media-1");

  assert.deepEqual(calls, ["service:delete", "cache:/admin/media"]);
});

test("media action runner replaces media before refreshing post and media admin surfaces", async () => {
  const calls: string[] = [];
  const runner = createMediaActionRunner({
    mediaService: {
      async uploadFile() {
        throw new Error("not used");
      },
      async deleteFile() {
        throw new Error("not used");
      },
      async updateMediaAlt() {
        throw new Error("not used");
      },
      async replaceFile() {
        calls.push("service:replace");
        return {
          id: "media-1",
          url: "/media/replaced.png",
        };
      },
    },
    revalidateAdminPaths(paths) {
      calls.push(`cache:${paths.join(",")}`);
    },
  });

  const result = await runner.replaceMedia("media-1", new File(["data"], "file.png", {
    type: "image/png",
  }));

  assert.deepEqual(calls, [
    "service:replace",
    "cache:/admin/media,/admin/posts",
  ]);
  assert.deepEqual(result, {
    id: "media-1",
    url: "/media/replaced.png",
  });
});
