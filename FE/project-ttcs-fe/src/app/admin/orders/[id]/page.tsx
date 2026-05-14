"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { orderApi } from "@/lib/api-endpoints";
import type { ApiError } from "@/lib/api";
import type { Order } from "@/types/api";
import { OrderDetailView } from "@/app/components/orders/OrderDetailView";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setOrder(await orderApi.getAdminById(Number(id)));
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError?.message || "Không thể tải chi tiết đơn hàng.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrder();
  }, [id]);

  if (isLoading) {
    return <div className="rounded-3xl bg-white p-10 font-bold text-slate-500">Đang tải chi tiết đơn hàng...</div>;
  }

  if (error || !order) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-red-100 bg-red-50 p-6 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <p className="font-bold">{error || "Không tìm thấy đơn hàng."}</p>
      </div>
    );
  }

  return <OrderDetailView order={order} backHref="/admin/orders" />;
}
