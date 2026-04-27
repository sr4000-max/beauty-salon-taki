import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin";
}

export async function isAdminAuthed(): Promise<boolean> {
  const c = await cookies();
  const v = c.get(COOKIE_NAME)?.value;
  return v === getAdminPassword();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }
}

export async function setAdminCookie(): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, getAdminPassword(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
