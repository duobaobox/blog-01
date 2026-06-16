type TaxonomyWorkflow = {
  shouldRevalidateAdmin: boolean;
  publicSlugs: string[];
};

function normalizePublicSlugs(slugs: Array<string | null | undefined>) {
  return [...new Set(slugs.filter((slug): slug is string => Boolean(slug)))];
}

function buildTaxonomyWorkflow(
  slugs: Array<string | null | undefined>,
): TaxonomyWorkflow {
  return {
    shouldRevalidateAdmin: true,
    publicSlugs: normalizePublicSlugs(slugs),
  };
}

export function buildCreateCategoryWorkflow(slug: string) {
  return buildTaxonomyWorkflow([slug]);
}

export function buildUpdateCategoryWorkflow(previousSlug: string) {
  return buildTaxonomyWorkflow([previousSlug]);
}

export function buildDeleteCategoryWorkflow(slug: string) {
  return buildTaxonomyWorkflow([slug]);
}

export function buildCreateTagWorkflow(slug: string) {
  return buildTaxonomyWorkflow([slug]);
}

export function buildUpdateTagWorkflow(previousSlug: string) {
  return buildTaxonomyWorkflow([previousSlug]);
}

export function buildDeleteTagWorkflow(slug: string) {
  return buildTaxonomyWorkflow([slug]);
}
