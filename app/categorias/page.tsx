import { getCategoryGridData } from "@/server/actions/categories";
import CategoryBrowser from "@/components/category-browser";

export default async function CategoriasPage() {
  const items = await getCategoryGridData();
  return <CategoryBrowser items={items as any} />;
}
