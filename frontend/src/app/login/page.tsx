import Link from "next/link";
import { AuthShell } from "@/layouts/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your BrewDesk account"
      footer={
        <>
          New to BrewDesk?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Start your free trial
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
