import { getAdminCategoriesPageData } from "@/features/taxonomy/queries/category.queries";
import { CategoriesList } from "@/components/admin/categories-list";

export default async function AdminCategoriesPage() {
  const pageData = await getAdminCategoriesPageData();
  return <CategoriesList categories={pageData.categories} />;
}
