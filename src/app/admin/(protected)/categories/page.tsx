export const dynamic = "force-dynamic";

import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { CategoriesList } from "@/components/admin/categories-list";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return <CategoriesList categories={categories} />;
}
