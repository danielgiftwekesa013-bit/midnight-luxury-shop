import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Screen, PageHeader, EmptyState } from "@/components/Screen";
import { useAuth } from "@/lib/app-context";
import { useProducts, usePoints, balanceOf } from "@/lib/queries";
import { pts } from "@/lib/format";
import { redeemPoints } from "@/lib/points.functions";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem Points — NOVA" },
      { name: "description", content: "Turn your NOVA loyalty and referral points into products." },
      { property: "og:title", content: "Redeem Points — NOVA" },
      {
        property: "og:description",
        content: "Turn your NOVA loyalty and referral points into products.",
      },
    ],
  }),
  component: Redeem,
});

function Redeem() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const redeem = useServerFn(redeemPoints);
  const { data: products } = useProducts();
  const loyalty = usePoints("loyalty", profile?.id);
  const referral = usePoints("referral", profile?.id);
  const [source, setSource] = useState<"loyalty" | "referral">("loyalty");
  const [busy, setBusy] = useState<string | null>(null);

  if (!profile?.premium_status) {
    return (
      <Screen>
        <PageHeader title="Redeem" />
        <EmptyState
          title="Premium members only"
          hint="Unlock Premium once to redeem points for products."
          cta={{ to: "/premium", label: "Unlock Premium" }}
        />
      </Screen>
    );
  }

  const balance = source === "loyalty" ? balanceOf(loyalty.data) : balanceOf(referral.data);

  const run = async (productId: string) => {
    setBusy(productId);
    const result = await redeem({ data: { productId, source } });
    setBusy(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["points"] });
    toast.success("Redeemed successfully");
    if ("orderId" in result && typeof result.orderId === "string") {
      void navigate({ to: "/order/$orderId", params: { orderId: result.orderId } });
    }
  };

  return (
    <Screen>
      <PageHeader title="Redeem" />

      <div className="surface flex gap-1 rounded-2xl p-1">
        {(["loyalty", "referral"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSource(k)}
            className={`press h-11 flex-1 rounded-xl text-xs font-bold capitalize ${
              source === k ? "btn-primary" : "text-muted-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Balance: <span className="font-bold text-foreground">{pts(balance)} pts</span>
      </p>

      <ul className="mt-5 space-y-3">
        {(products ?? []).map((p) => {
          const affordable = balance >= p.price;
          return (
            <li key={p.id} className="surface flex items-center gap-3 rounded-3xl p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-black">
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-primary">{pts(p.price)} pts</p>
              </div>
              <button
                onClick={() => run(p.id)}
                disabled={!affordable || busy === p.id}
                className="btn-primary press h-10 shrink-0 rounded-xl px-4 text-xs font-bold disabled:opacity-40"
              >
                {busy === p.id ? "…" : "Redeem"}
              </button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
