import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Screen, PageHeader, EmptyState } from "@/components/Screen";
import { useAuth, useCart } from "@/lib/app-context";
import { supabase } from "@/integrations/supabase/client";
import { ksh, isValidPhone, normalizePhone } from "@/lib/format";
import type { PaymentState } from "@/lib/types";
import { initiateMpesaPayment, getPaymentStatus } from "@/lib/mpesa.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — NOVA" },
      { name: "description", content: "Confirm your order and pay securely with M-Pesa." },
      { property: "og:title", content: "Checkout — NOVA" },
      { property: "og:description", content: "Confirm your order and pay securely with M-Pesa." },
    ],
  }),
  component: Checkout,
});

const STATE_COPY: Record<PaymentState, string> = {
  idle: "",
  initiated: "Payment initiated…",
  waiting: "Waiting for your M-Pesa PIN…",
  successful: "Payment successful",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
  timeout: "Payment timed out",
};

function Checkout() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const { lines, total, directBuy, clearDirectBuy, clear } = useCart();
  const initiate = useServerFn(initiateMpesaPayment);
  const checkStatus = useServerFn(getPaymentStatus);

  const items = directBuy ?? lines;
  const amount = items.reduce((n, l) => n + l.quantity * l.product.price, 0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState("");
  const [state, setState] = useState<PaymentState>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!session) void navigate({ to: "/auth" });
  }, [session, navigate]);

  useEffect(() => {
    if (profile) {
      setName((n) => n || profile.name);
      setPhone((p) => p || profile.phone);
    }
  }, [profile]);

  useEffect(() => () => void (timer.current && window.clearInterval(timer.current)), []);

  const busy = state === "initiated" || state === "waiting";

  const pay = async () => {
    if (!session) return;
    if (name.trim().length < 2) {
      toast.error("Enter your name.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid M-Pesa phone number.");
      return;
    }
    if (delivery.trim().length < 4) {
      toast.error("Enter your delivery details.");
      return;
    }

    setState("initiated");
    setMessage("");

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: session.user.id,
        total: amount,
        payment_method: "mpesa",
        payment_status: "initiated",
        order_status: "pending",
        customer_name: name.trim(),
        phone: normalizePhone(phone),
        delivery_info: delivery.trim(),
      })
      .select("id")
      .single();

    if (error || !order) {
      setState("failed");
      setMessage("Could not create your order. Please try again.");
      return;
    }

    await supabase.from("order_items").insert(
      items.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        quantity: l.quantity,
        price: l.product.price,
      })),
    );

    const result = await initiate({ data: { orderId: order.id, phone: normalizePhone(phone) } });
    setMessage(result.message);

    if (result.state === "failed") {
      setState("failed");
      return;
    }

    setState("waiting");
    let elapsed = 0;
    timer.current = window.setInterval(async () => {
      elapsed += 4;
      const status = await checkStatus({ data: { orderId: order.id } });
      if (status.payment_status === "paid") {
        window.clearInterval(timer.current!);
        setState("successful");
        if (!directBuy) clear();
        clearDirectBuy();
        void navigate({ to: "/order/$orderId", params: { orderId: order.id } });
      } else if (status.payment_status === "cancelled") {
        window.clearInterval(timer.current!);
        setState("cancelled");
      } else if (status.payment_status === "failed") {
        window.clearInterval(timer.current!);
        setState("failed");
      } else if (elapsed >= 90) {
        window.clearInterval(timer.current!);
        setState("timeout");
        setMessage("We didn't get a confirmation in time. Check your M-Pesa messages.");
      }
    }, 4000);
  };

  if (items.length === 0) {
    return (
      <Screen>
        <PageHeader title="Checkout" />
        <EmptyState
          title="Nothing to check out"
          hint="Pick a product first, then pay with M-Pesa."
          cta={{ to: "/", label: "Browse products" }}
        />
      </Screen>
    );
  }

  const field =
    "h-14 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

  return (
    <Screen>
      <PageHeader title="Checkout" />

      <section className="surface rounded-3xl p-4">
        <ul className="space-y-3">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-black">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty {quantity} · {ksh(product.price)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {ksh(product.price * quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-extrabold">{ksh(amount)}</span>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h2 className="text-sm font-bold">Delivery details</h2>
        <input
          className={field}
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={field}
          placeholder="M-Pesa phone number"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className="min-h-24 w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          placeholder="Delivery address / pickup point"
          value={delivery}
          onChange={(e) => setDelivery(e.target.value)}
        />
      </section>

      <section className="premium-panel mt-5 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15">
            <ShieldCheck className="size-5 text-success" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">M-Pesa</p>
            <p className="text-xs text-muted-foreground">
              Pay {ksh(amount)} via M-Pesa STK Push
            </p>
          </div>
        </div>
      </section>

      {state !== "idle" && (
        <p
          className={`animate-rise mt-4 rounded-2xl border border-border bg-card p-3 text-xs ${
            state === "successful" ? "text-success" : "text-muted-foreground"
          }`}
        >
          <span className="font-semibold">{STATE_COPY[state]}</span>
          {message && <> — {message}</>}
        </p>
      )}

      <button
        onClick={pay}
        disabled={busy}
        className="btn-primary press mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {busy ? STATE_COPY[state] : `Pay ${ksh(amount)} with M-Pesa`}
      </button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Payment is confirmed by our backend before your order is marked as paid.
      </p>
    </Screen>
  );
}
