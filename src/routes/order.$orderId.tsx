import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Screen } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { ksh } from "@/lib/format";

export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Confirmed — NOVA" },
      { name: "description", content: "Your NOVA order summary and payment confirmation." },
      { property: "og:title", content: "Order Confirmed — NOVA" },
      { property: "og:description", content: "Your NOVA order summary and payment confirmation." },
    ],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { orderId } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, total, payment_status, order_status, created_at")
        .eq("id", orderId)
        .maybeSingle();
      const { data: items } = await supabase
        .from("order_items")
        .select("id, quantity, price, products(name)")
        .eq("order_id", orderId);
      return { order, items: items ?? [] };
    },
  });

  const order = data?.order;
  const paid = order?.payment_status === "paid";

  return (
    <Screen withNav={false}>
      <div className="animate-rise flex flex-col items-center pt-16 text-center">
        <span
          className={`animate-pop grid size-20 place-items-center rounded-full ${paid ? "bg-success/15" : "bg-muted"}`}
        >
          <CheckCircle2 className={`size-10 ${paid ? "text-success" : "text-muted-foreground"}`} />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">
          {paid ? "Payment Successful" : "Order Placed"}
        </h1>
        <p className="mt-2 max-w-[18rem] text-sm text-muted-foreground">
          {paid
            ? "We've received your M-Pesa payment and your order is confirmed."
            : "Your order is saved. It will be confirmed once the M-Pesa payment is verified."}
        </p>
      </div>

      <section className="surface mt-8 rounded-3xl p-4">
        <Row label="Order number" value={order?.order_number ?? "—"} />
        <Row label="Amount" value={order ? ksh(Number(order.total)) : "—"} />
        <Row label="Payment" value={order?.payment_status ?? "—"} />
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {data?.items.map((i) => (
            <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
              <span className="truncate text-muted-foreground">
                {(i.products as { name: string } | null)?.name} × {i.quantity}
              </span>
              <span className="font-semibold">{ksh(Number(i.price) * i.quantity)}</span>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/"
        className="btn-primary press mt-8 flex h-14 w-full items-center justify-center rounded-2xl text-sm font-bold"
      >
        Continue Shopping
      </Link>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold capitalize">{value}</span>
    </div>
  );
}
