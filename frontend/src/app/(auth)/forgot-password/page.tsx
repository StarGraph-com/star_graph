"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 500);
  };

  return (
    <div>
      {/* Title */}
      <div className="text-left mb-6">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#111714] leading-tight">
          Reset password
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#5A605B] mt-1 font-normal">
          Enter your email and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-5 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[#6558E8]/10 text-[#6558E8] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#141A17]">Check your inbox</h3>
            <p className="text-[12.5px] text-[#5A605B] mt-1">
              We sent a password reset link to <span className="font-medium text-[#141A17]">{email}</span>
            </p>
          </div>
          <Link href="/login">
            <Button variant="secondary" className="mt-2">
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[12px] text-[#636A64] hover:text-[#141A17] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

