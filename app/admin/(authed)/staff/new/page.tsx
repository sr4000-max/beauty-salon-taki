import { createStaffAction } from "@/lib/actions/staff";
import { StaffForm } from "../_form";

export default function NewStaffPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">スタッフを追加</h1>
      <StaffForm action={createStaffAction} submitLabel="登録" />
    </div>
  );
}
