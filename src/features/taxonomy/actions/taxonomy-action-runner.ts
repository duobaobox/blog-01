import type {
  CategoryWriteInput,
  TagWriteInput,
} from "@/features/taxonomy/lib/taxonomy-write";
import type * as taxonomyServiceModule from "@/features/taxonomy/services/taxonomy.service";
import {
  buildCreateCategoryWorkflow,
  buildCreateTagWorkflow,
  buildDeleteCategoryWorkflow,
  buildDeleteTagWorkflow,
  buildUpdateCategoryWorkflow,
  buildUpdateTagWorkflow,
} from "@/features/taxonomy/lib/taxonomy-action-workflow";

type TaxonomyService = Pick<
  typeof taxonomyServiceModule,
  | "createCategory"
  | "updateCategory"
  | "deleteCategory"
  | "createTag"
  | "updateTag"
  | "deleteTag"
>;

type TaxonomyActionRunnerDeps = {
  taxonomyService: TaxonomyService;
  revalidateAdminCategories?(): void;
  revalidateAdminTags?(): void;
  revalidateCategoryContent?(slugs: Array<string | null | undefined>): void;
  revalidateTagContent?(slugs: Array<string | null | undefined>): void;
};

export function createTaxonomyActionRunner(deps: TaxonomyActionRunnerDeps) {
  return {
    async createCategory(input: CategoryWriteInput) {
      const result = await deps.taxonomyService.createCategory(input);
      const workflow = buildCreateCategoryWorkflow(result.slug);

      if (workflow.shouldRevalidateAdmin) {
        deps.revalidateAdminCategories?.();
      }
      if (workflow.publicSlugs.length > 0) {
        deps.revalidateCategoryContent?.(workflow.publicSlugs);
      }

      return result;
    },

    async updateCategory(id: string, input: CategoryWriteInput) {
      const result = await deps.taxonomyService.updateCategory(id, input);
      const workflow = buildUpdateCategoryWorkflow(
        result.previousCategory.slug,
      );

      if (workflow.shouldRevalidateAdmin) {
        deps.revalidateAdminCategories?.();
      }
      if (workflow.publicSlugs.length > 0) {
        deps.revalidateCategoryContent?.(workflow.publicSlugs);
      }

      return result;
    },

    async deleteCategory(id: string) {
      const result = await deps.taxonomyService.deleteCategory(id);
      const workflow = buildDeleteCategoryWorkflow(result.category.slug);

      if (workflow.shouldRevalidateAdmin) {
        deps.revalidateAdminCategories?.();
      }
      if (workflow.publicSlugs.length > 0) {
        deps.revalidateCategoryContent?.(workflow.publicSlugs);
      }

      return result;
    },

    async createTag(input: TagWriteInput) {
      const result = await deps.taxonomyService.createTag(input);
      const workflow = buildCreateTagWorkflow(result.slug);

      if (workflow.shouldRevalidateAdmin) {
        deps.revalidateAdminTags?.();
      }
      if (workflow.publicSlugs.length > 0) {
        deps.revalidateTagContent?.(workflow.publicSlugs);
      }

      return result;
    },

    async updateTag(id: string, input: TagWriteInput) {
      const result = await deps.taxonomyService.updateTag(id, input);
      const workflow = buildUpdateTagWorkflow(result.previousTag.slug);

      if (workflow.shouldRevalidateAdmin) {
        deps.revalidateAdminTags?.();
      }
      if (workflow.publicSlugs.length > 0) {
        deps.revalidateTagContent?.(workflow.publicSlugs);
      }

      return result;
    },

    async deleteTag(id: string) {
      const result = await deps.taxonomyService.deleteTag(id);
      const workflow = buildDeleteTagWorkflow(result.tag.slug);

      if (workflow.shouldRevalidateAdmin) {
        deps.revalidateAdminTags?.();
      }
      if (workflow.publicSlugs.length > 0) {
        deps.revalidateTagContent?.(workflow.publicSlugs);
      }

      return result;
    },
  };
}
