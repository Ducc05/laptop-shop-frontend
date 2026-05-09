"use client";

import { useAuth } from "@/context/AuthContext";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/user/login");
    }

    if (!isLoading && user?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== "MANAGER") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">
          Truy cap bi tu choi
        </h1>
        <p className="text-slate-500 mb-8 max-w-sm">
          Khu vuc nay chi danh cho tai khoan quan ly chi nhanh.
        </p>
        <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl">
          Quay lai trang chu
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
