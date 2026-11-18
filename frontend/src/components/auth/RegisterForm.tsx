"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { register, loadingSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || loadingSession) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await register({ email, password });
      if (result.user) {
        router.replace("/dashboard");
      } else {
        setMessage(result.message ?? "Check your email to confirm your account.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
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

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
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

        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        {message && <p role="status" className="text-xs text-[#464D47]">{message}</p>}

        <div className="pt-1.5">
          <Button type="submit" variant="primary" disabled={loading || loadingSession}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </div>
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

