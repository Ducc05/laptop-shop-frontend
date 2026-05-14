"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Package,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { orderApi, productApi, userApi } from "@/lib/api-endpoints";
import { formatCurrency, getOrderStatusLabel } from "@/lib/format";
import type { DashboardStats, Order, User } from "@/types/api";

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return "tháng hiện tại";

  return new Date(year, month - 1, 1).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    successfulOrders: 0,
    revenueByStatus: {},
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const [statsResponse, ordersResponse, productsResponse, usersResponse] =
          await Promise.all([
            orderApi.getDashboardStats(selectedMonth),
            orderApi.getAllAdmin({ size: 5, page: 0 }),
            productApi.getAllAdmin({ size: 1, page: 0 }),
            userApi.getAll({ size: 5, page: 0 }),
          ]);

        setStats(statsResponse);
        setRecentOrders(ordersResponse.content || []);
        setTotalProducts(productsResponse.totalElements || 0);
        setTotalUsers(usersResponse.totalElements || usersResponse.content?.length || 0);
        setRecentUsers(usersResponse.content || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, [selectedMonth]);

  const selectedMonthLabel = formatMonthLabel(selectedMonth);

  const statCards = [
    {
      name: "Tổng đơn hàng",
      val: stats.totalOrders || 0,
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
    },
    {
      name: "Sản phẩm",
      val: totalProducts,
      icon: <Package className="w-6 h-6 text-emerald-600" />,
    },
    {
      name: "Người dùng",
      val: totalUsers,
      icon: <Users className="w-6 h-6 text-amber-600" />,
    },
    {
      name: `Doanh thu ${selectedMonthLabel}`,
      val: formatCurrency(stats.monthlyRevenue || 0),
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
    },
  ];
  const branchRevenue = stats.revenueByBranchThisMonth || [];
  const topProducts = stats.topProductsThisMonth || [];
  const topCustomers = stats.topCustomersThisMonth || [];
  const maxBranchRevenue = Math.max(...branchRevenue.map((branch) => branch.revenue || 0), 1);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Tổng quan hệ thống
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-2xl border border-green-100 text-xs font-black uppercase tracking-widest">
          <Activity className="w-4 h-4" />
          Live backend sync
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-slate-900 transition-colors duration-300">
                {card.icon}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Live
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              {card.name}
            </p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
              {isLoading ? "---" : card.val}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tighter flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Doanh thu theo chi nhánh
              </h3>
              <p className="text-sm text-slate-400 font-bold mt-1">
                {stats.monthlyOrders || 0} đơn hoàn tất trong {selectedMonthLabel}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="dashboard-month">
                Chọn tháng thống kê
              </label>
              <input
                id="dashboard-month"
                type="month"
                value={selectedMonth}
                max={getCurrentMonthValue()}
                onChange={(event) => setSelectedMonth(event.target.value || getCurrentMonthValue())}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
              <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tổng doanh thu
                </p>
                <p className="text-xl font-black text-blue-600 tracking-tighter">
                  {formatCurrency(stats.monthlyRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          {branchRevenue.length === 0 ? (
            <div className="py-14 text-center rounded-3xl border-2 border-dashed border-slate-100">
              <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">
                Chưa có doanh thu theo chi nhánh trong {selectedMonthLabel}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div
                className="grid min-w-max items-end gap-3 border-b border-slate-100 pb-3"
                style={{ gridTemplateColumns: `repeat(${branchRevenue.length}, minmax(92px, 1fr))` }}
              >
                {branchRevenue.map((branch) => {
                  const percent = Math.max(10, ((branch.revenue || 0) / maxBranchRevenue) * 100);

                  return (
                    <div key={branch.branchId || branch.branchName} className="flex w-[92px] flex-col justify-end gap-2">
                      <div className="text-center">
                        <p className="text-[11px] font-black leading-4 text-slate-900">
                          {formatCurrency(branch.revenue || 0)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">{branch.orders || 0} đơn</p>
                      </div>
                      <div className="flex h-[150px] items-end rounded-xl bg-slate-50 px-2 pt-2">
                        <div
                          className="w-full rounded-t-xl bg-blue-600 shadow-lg shadow-blue-100 transition-all"
                          style={{ height: `${percent}%`, minHeight: 18 }}
                        />
                      </div>
                      <p className="min-h-[32px] text-center text-[11px] font-black leading-4 text-slate-600 line-clamp-2">
                        {branch.branchName || `Chi nhánh #${branch.branchId}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h3 className="text-lg font-black text-slate-900 tracking-tighter mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Sản phẩm bán chạy trong {selectedMonthLabel}
          </h3>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold">
                Chưa có sản phẩm nào được mua trong {selectedMonthLabel}.
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div key={`${product.productId}-${product.variantId}`} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xs font-black text-amber-600 shadow-sm">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 truncate">{product.productName}</p>
                    <p className="text-xs text-slate-400 font-bold truncate">SKU: {product.sku || "---"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">{product.quantitySold || 0}</p>
                    <p className="text-[10px] text-slate-400 font-bold">đã bán</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
          <h3 className="text-lg font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <UserRound className="w-5 h-5 text-emerald-600" />
            Người dùng chi tiêu nhiều nhất trong {selectedMonthLabel}
          </h3>
          <label className="sr-only" htmlFor="top-customers-month">
            Chọn tháng thống kê khách hàng
          </label>
          <input
            id="top-customers-month"
            type="month"
            value={selectedMonth}
            max={getCurrentMonthValue()}
            onChange={(event) => setSelectedMonth(event.target.value || getCurrentMonthValue())}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
          />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            Khách hàng nổi bật
          </span>
        </div>

        {topCustomers.length === 0 ? (
          <div className="py-12 text-center rounded-3xl border-2 border-dashed border-slate-100">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">
              Chưa có dữ liệu chi tiêu trong {selectedMonthLabel}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.userId} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-black text-emerald-600 shadow-sm">
                    #{index + 1}
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{customer.orderCount || 0} đơn</span>
                </div>
                <p className="text-sm font-black text-slate-900 truncate">
                  {customer.fullName || customer.username || `User #${customer.userId}`}
                </p>
                <p className="text-xs text-slate-400 truncate mt-1">{customer.email}</p>
                <p className="text-lg font-black text-blue-600 tracking-tighter mt-4">
                  {formatCurrency(customer.totalSpent || 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-900 tracking-tighter flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Đơn hàng gần đây
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl border border-slate-100">
              Admin orders
            </span>
          </div>

          <div className="p-8 flex-1">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 bg-slate-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-20 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">
                  Chưa có đơn hàng nào được ghi nhận
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 leading-snug">
                        <span className="font-black text-blue-600">Đơn #{order.id}</span> của
                        người dùng <span className="font-bold">#{order.userId}</span> đang ở
                        trạng thái <span className="font-black">{getOrderStatusLabel(order.status)}</span>
                        , tổng giá trị{" "}
                        <span className="font-black">{formatCurrency(order.totalPrice)}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("vi-VN")
                          : "vừa xong"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="text-lg font-black tracking-tighter mb-8 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              Thống kê doanh thu {selectedMonthLabel}
            </h3>
            <div className="space-y-4 relative z-10">
              {Object.entries(stats.revenueByStatus || {}).length > 0 ? (
                Object.entries(stats.revenueByStatus || {}).map(([status, revenue]) => (
                  <div key={status} className="flex items-center justify-between py-1">
                    <span className="text-sm font-bold text-slate-400">
                      {getOrderStatusLabel(status)}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Chưa có dữ liệu doanh thu theo trạng thái.</p>
              )}
            </div>
            <div className="mt-10 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Đơn thành công
                </p>
                <p className="text-xs font-bold">{stats.monthlyOrders || 0} đơn</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tighter mb-6">
              Người dùng mới nhất
            </h3>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                    {user.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              ))}
              {!isLoading && recentUsers.length === 0 ? (
                <p className="text-sm text-slate-400">Chưa có người dùng để hiển thị.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
