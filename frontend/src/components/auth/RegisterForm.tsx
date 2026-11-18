"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { useAuth } from "@/context/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email);
      router.push("/dashboard");
    }, 400);
  };

  const handleGoogleLogin = () => {
    login("alex@stargraph.io");
    router.push("/dashboard");
  };

  return (
    <div>
      {/* Heading & Subtitle */}
      <div className="text-left mb-6">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#111714] leading-tight">
          Create your studio
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#5A605B] mt-1 font-normal">
          One account, your method, your projects.
        </p>
      </div>

      {/* Continue with Google SSO */}
      <SocialAuthButtons onGoogleClick={handleGoogleLogin} isLoading={loading} />

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-[#E5E0D5]" />
        <span className="absolute bg-[#FBF8F2] px-3 text-[11px] font-normal text-[#8E948E]">
          or
        </span>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          helperText="At least 8 characters."
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#8C938E] hover:text-[#555C56] transition-colors p-0.5"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        <div className="pt-1.5">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            login(email || undefined);
            router.push("/dashboard");
          }}
        >
          Email me a sign-in link instead
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-center mt-5 text-[12px] text-[#636A64]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#141A17] font-medium underline underline-offset-2 hover:text-black transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

