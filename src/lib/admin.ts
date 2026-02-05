import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/session";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0);

const ALLOW_ALL_NON_PROD = ADMIN_EMAILS.length === 0 && process.env.NODE_ENV !== "production";

export async function requireAdminSession() {
  const user = await getServerAuthUser();
  const userEmail = user?.email?.toLowerCase() ?? null;
  const allowed = ALLOW_ALL_NON_PROD || (userEmail ? ADMIN_EMAILS.includes(userEmail) : false);

  if (!user || !allowed) {
    redirect("/home");
  }

  return user;
}
