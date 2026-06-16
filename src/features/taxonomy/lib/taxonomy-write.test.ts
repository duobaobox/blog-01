import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import {
  parseCategoryWriteFormData,
  parseTagWriteFormData,
} from "./taxonomy-write";

test("parseCategoryWriteFormData trims and normalizes fields", () => {
  const formData = new FormData();
  formData.set("name", "  分类设计  ");
  formData.set("description", "  一些描述  ");

  assert.deepEqual(parseCategoryWriteFormData(formData), {
    name: "分类设计",
    description: "一些描述",
  });
});

test("parseTagWriteFormData normalizes optional color", () => {
  const formData = new FormData();
  formData.set("name", "  标签设计 ");
  formData.set("description", " ");
  formData.set("color", "#ABC");

  assert.deepEqual(parseTagWriteFormData(formData), {
    name: "标签设计",
    description: null,
    color: "#aabbcc",
  });
});

test("parseCategoryWriteFormData rejects missing names", () => {
  const formData = new FormData();
  formData.set("name", " ");

  assert.throws(() => parseCategoryWriteFormData(formData), ValidationError);
});
