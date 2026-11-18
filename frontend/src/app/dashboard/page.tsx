"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LogOut, LayoutGrid, Users, Settings, FolderGit2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // If not authenticated in mock context, you can still view mock fallback or redirect
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const displayName = user?.name || "Alex Vance";
  const displayEmail = user?.email || "alex@stargraph.io";
  const studioName = user?.studioName || "StarGraph Creative Lab";

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#141A17] font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#FAF8F5] border-b border-[#E6E1D8] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-[5px] bg-[#F7C948] transform -rotate-3" />
          <span className="font-semibold text-lg tracking-tight">StarGraph</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#6558E8]/10 text-[#6558E8] font-medium ml-2">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-medium text-[#141A17]">{displayName}</p>
              <p className="text-xs text-[#727974]">{displayEmail}</p>
            </div>
            {user?.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt="Avatar"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border border-[#DDD8CD]"
                unoptimized
              />
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-[#727974] hover:text-[#141A17] hover:bg-black/5 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-[#FAF8F5] rounded-xl p-8 border border-[#E6E1D8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111714]">
              {studioName}
            </h1>
            <p className="text-sm text-[#5A605B] mt-1">
              Welcome back, {displayName}. Your active sprints and studio canvases are up to date.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/register">
              <Button variant="secondary" fullWidth={false}>
                Switch Account
              </Button>
            </Link>
            <Button
              variant="primary"
              fullWidth={false}
              className="bg-[#6558E8] hover:bg-[#594cdb]"
            >
              + New Canvas
            </Button>
          </div>
        </div>

        {/* Quick Stat / Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Canvases", count: "12", icon: LayoutGrid },
            { label: "Design Systems", count: "4", icon: FolderGit2 },
            { label: "Collaborators", count: "8", icon: Users },
            { label: "Studio Settings", count: "Configured", icon: Settings },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-5 hover:border-[#DDD8CD] transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#727974]">
                    {item.label}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#EFECE4] flex items-center justify-center text-[#5A605B]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#141A17]">{item.count}</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

