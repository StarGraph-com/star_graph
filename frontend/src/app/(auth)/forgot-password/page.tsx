import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-[26px] font-bold tracking-tight text-[#111714]">
        Reset password
      </h1>
      <p className="text-sm text-[#5A605B]">Password reset is unavailable.</p>
      <Link href="/login" className="inline-block text-sm underline underline-offset-2">
        Back to sign in
      </Link>
    </div>
  );
}
