import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, roleHome } from "@/lib/auth";
import { Logo } from "@/components/logo";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(roleHome(user.role));

  return (
    <div className="theme-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 text-ink">
      <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-warn-soft blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-info-soft blur-3xl" />

      <div className="relative w-full max-w-sm rounded-3xl border border-line bg-elevated/90 p-9 shadow-lift backdrop-blur">
        <Link href="/" className="mx-auto block w-fit">
          <Logo size={96} rounded="rounded-3xl" className="shadow-soft" />
        </Link>
        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1 mb-7 text-center text-sm font-medium text-muted">
          Sign in to your admin or employee dashboard.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
