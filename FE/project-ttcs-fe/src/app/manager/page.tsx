"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, PackageSearch, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { branchApi, managerDashboardApi } from "@/lib/api-endpoints";
import { formatCurrency, getOrderStatusLabel } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import type { ApiError } from "@/lib/api";
import type { DashboardStats, LowStock } from "@/types/api";

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    successfulOrders: 0,
    revenueByStatus: {},
  });
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [branchName, setBranchName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch branch name from user's branchId
  useEffect(() => {
    const fetchBranchName = async () => {
      if (!user?.branchId) return;
      try {
        const branches = await branchApi.getAllPublic();
        const found = branches.find((b) => b.id === user.branchId);
        if (found?.name) setBranchName(found.name);
      } catch {
        // ignore
      }
    };
    void fetchBranchName();
  }, [user?.branchId]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsResponse, lowStockResponse] = await Promise.all([
        managerDashboardApi.getStats(),
        managerDashboardApi.getLowStock(),
      ]);

      setStats(statsResponse);
      setLowStock(lowStockResponse || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || "Khong the tai du lieu quan ly chi nhanh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  // Only count DELIVERED orders for revenue
  const deliveredRevenue = stats.revenueByStatus?.["DELIVERED"] ?? 0;

  const statCards = [
    {
      name: "Đơn hàng",
      value: stats.totalOrders || 0,
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
    },
    {
      name: "Đơn thành công",
      value: stats.successfulOrders || 0,
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
    },
    {
      name: "Doanh thu ",
      value: formatCurrency(deliveredRevenue),
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
    },
    {
      name: "Cảnh báo kho",
      value: lowStock.length,
      icon: <PackageSearch className="w-6 h-6 text-amber-600" />,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Chi nhánh{branchName ? `: ${branchName}` : ""}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Theo dõi đơn hàng, doanh thu và tồn kho của chi nhánh được gán.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black hover:bg-blue-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-4 rounded-2xl bg-slate-50 w-fit mb-6">{card.icon}</div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              {card.name}
            </p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
              {isLoading ? "---" : card.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tighter">
              Doanh thu chi nhánh
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {(() => {
              const delivered = stats.revenueByStatus?.["DELIVERED"];
              if (delivered === undefined || delivered === 0) {
                return <p className="text-sm font-medium text-slate-400">Chưa có doanh thu từ đơn đã giao.</p>;
              }
              return (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">
                    {getOrderStatusLabel("DELIVERED")}
                  </span>
                  <span className="text-sm font-black text-emerald-600 text-lg">
                    {formatCurrency(delivered)}
                  </span>
                </div>
              );
            })()}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tighter">Sắp hết hàng</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 text-sm font-medium text-slate-400">Đang tải tồn kho...</div>
            ) : lowStock.length === 0 ? (
              <div className="p-6 text-sm font-medium text-slate-400">
                Không có cảnh báo tồn kho.
              </div>
            ) : (
              lowStock.map((item) => (
                <div key={`${item.branchId}-${item.variantId}`} className="p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {item.productName || `Variant #${item.variantId}`}
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      SKU {item.sku || "---"} - {item.branchName || "Chi nhánh hiện tại"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                    {item.quantity ?? 0}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
