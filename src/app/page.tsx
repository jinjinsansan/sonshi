import { redirect } from "next/navigation";
import { SplashGateway } from "@/components/landing/splash-gateway";
import { getServerAuthUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getServerAuthUser();
  if (user) {
    redirect("/home");
  }

  return <SplashGateway />;
}
