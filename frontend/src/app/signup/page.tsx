import Link from "next/link";
import { AuthShell } from "@/layouts/auth-shell";
import { SignupForm } from "@/features/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Start your free trial"
      subtitle="14 days free. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
