import { redirect } from "next/navigation";
import { SplashGateway } from "@/components/landing/splash-gateway";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/home");
  }

  return <SplashGateway />;
}
