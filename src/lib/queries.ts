import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PointTx, Product } from "./types";

export function productsQuery() {
  return {
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image, stock, category, active")
        .eq("active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, price: Number(p.price) })) as Product[];
    },
  };
}

export function useProducts() {
  return useQuery(productsQuery());
}

export function usePoints(kind: "loyalty" | "referral", customerId: string | undefined) {
  return useQuery({
    queryKey: ["points", kind, customerId],
    enabled: !!customerId,
    queryFn: async (): Promise<PointTx[]> => {
      const table = kind === "loyalty" ? "loyalty_points" : "referral_points";
      const { data, error } = await supabase
        .from(table)
        .select("id, transaction_type, amount, description, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PointTx[];
    },
  });
}

export function balanceOf(txs: PointTx[] | undefined): number {
  return (txs ?? []).reduce(
    (n, t) => n + (t.transaction_type === "earned" ? t.amount : -t.amount),
    0,
  );
}
