"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { login, loadingSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || loadingSession) return;
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Title block */}
      <div className="text-left mb-6">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#111714] leading-tight">
          Welcome back
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#5A605B] mt-1 font-normal">
          Sign in to access your projects and studio workspace.
        </p>
      </div>

      {/* Form */}
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

        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
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
        </div>

        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}

        <div className="pt-1.5">
          <Button type="submit" variant="primary" disabled={loading || loadingSession}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      {/* Footer navigation */}
      <div className="text-center mt-5 text-[12px] text-[#636A64]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[#141A17] font-medium underline underline-offset-2 hover:text-black transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

