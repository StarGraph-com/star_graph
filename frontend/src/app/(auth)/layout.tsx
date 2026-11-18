import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#F7C948]/30 overflow-hidden">
      {/* Background with soft blur */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-[3px] scale-105 transform-gpu"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dicrvjstp/image/upload/v1795015424/AuthBg_2_zgxpd4.jpg')`,
        }}
      />
      {/* Subtle dark tint */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Main Auth Card Container */}
      <div className="relative w-full max-w-[440px] bg-[#FBF8F2] rounded-xl p-8 sm:p-10 shadow-[0_24px_50px_-12px_rgba(25,23,18,0.18)] border border-[#EDE8DE]/80">
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-[18px] h-[18px] rounded-[5px] bg-[#F7C948] shadow-sm transform -rotate-3 transition-transform group-hover:rotate-0" />
            <span className="font-semibold text-[17px] tracking-tight text-[#141A17]">
              StarGraph
            </span>
          </Link>
        </div>

        {/* Dynamic Screen Content */}
        {children}
      </div>
    </div>
  );
}

