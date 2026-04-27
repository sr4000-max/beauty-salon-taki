"use server";

import { redirect } from "next/navigation";
import {
  clearAdminCookie,
  getAdminPassword,
  setAdminCookie,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== getAdminPassword()) {
    return { error: "パスワードが違います" };
  }
  await setAdminCookie();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect("/admin/login");
}
