import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";
import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import type {
  CategoryWriteInput,
  TagWriteInput,
} from "@/features/taxonomy/lib/taxonomy-write";
import { generateSemanticSlug } from "@/shared/lib/slug";
import { requireEntity } from "@/shared/lib/validation";

export async function createCategory(input: CategoryWriteInput) {
  const slug = await generateSemanticSlug(
    async (value) => Boolean(await categoryRepo.findCategoryBySlug(value)),
    { title: input.name, prefix: "c" },
  );

  await categoryRepo.createCategory({
    name: input.name,
    slug,
    description: input.description,
  });

  return { slug };
}

export async function updateCategory(id: string, input: CategoryWriteInput) {
  const category = requireEntity(
    await categoryRepo.findCategoryById(id),
    "分类不存在",
  );

  await categoryRepo.updateCategory(id, {
    name: input.name,
    slug: category.slug,
    description: input.description,
  });

  return {
    previousCategory: category,
  };
}

export async function deleteCategory(id: string) {
  const category = requireEntity(
    await categoryRepo.findCategoryById(id),
    "分类不存在",
  );
  await categoryRepo.deleteCategory(id);

  return {
    category,
  };
}

export async function createTag(input: TagWriteInput) {
  const slug = await generateSemanticSlug(
    async (value) => Boolean(await tagRepo.findTagBySlug(value)),
    { title: input.name, prefix: "t" },
  );

  await tagRepo.createTag({
    name: input.name,
    slug,
    description: input.description,
    color: input.color,
  });

  return { slug };
}

export async function updateTag(id: string, input: TagWriteInput) {
  const tag = requireEntity(await tagRepo.findTagById(id), "标签不存在");

  await tagRepo.updateTag(id, {
    name: input.name,
    slug: tag.slug,
    description: input.description,
    color: input.color,
  });

  return {
    previousTag: tag,
  };
}

export async function deleteTag(id: string) {
  const tag = requireEntity(await tagRepo.findTagById(id), "标签不存在");
  await tagRepo.deleteTag(id);

  return {
    tag,
  };
}
