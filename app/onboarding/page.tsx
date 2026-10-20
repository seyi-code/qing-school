import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

/**
 * Platform-admin only.
 * Not logged in or wrong role → /login (simple, no marketing chrome).
 */
export default async function OnboardingPage() {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    redirect("/login?next=/onboarding");
  }

  return <OnboardingForm />;
}
