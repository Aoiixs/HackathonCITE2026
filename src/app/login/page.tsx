import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  // Already signed in and switched on? Skip the form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_active) redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col md:grid md:grid-cols-2">
      {/* Left half: brand panel. Hidden below 768px. */}
      <aside className="hidden flex-col justify-between bg-sidebar p-12 md:flex">
        <Logo variant="dark" height={40} />
        <div className="flex max-w-lg flex-col gap-4">
          <h2 className="text-[40px] font-bold leading-tight tracking-tight text-white">
            Sales and stock, connected.
          </h2>
          <p className="text-lg text-[#c9d8cf]">
            Every sale at the counter updates the stock right away, and low
            stock is flagged before it runs out.
          </p>
        </div>
        <p className="text-sm text-sidebar-muted">Nexora · Ortiz Branch</p>
      </aside>

      {/* Right half: the Sign in card. */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="md:hidden">
          <Logo variant="light" height={48} />
        </div>
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Sign in with your staff account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              notice={
                reason === "inactive"
                  ? "This account can't sign in. Please ask the manager."
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
