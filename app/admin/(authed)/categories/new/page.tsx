import { createCategoryAction } from "@/lib/actions/category";
import { CategoryForm } from "../_form";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">カテゴリを追加</h1>
      <CategoryForm action={createCategoryAction} submitLabel="登録" />
    </div>
  );
}
