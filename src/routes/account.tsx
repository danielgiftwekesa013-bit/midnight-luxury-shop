import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Sparkles } from "lucide-react";
import { Screen, PageHeader, EmptyState } from "@/components/Screen";
import { useAuth } from "@/lib/app-context";
import { supabase } from "@/integrations/supabase/client";
import { ksh, formatDate } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account — NOVA" },
      { name: "description", content: "Manage your NOVA profile, orders and Premium membership." },
      { property: "og:title", content: "Your Account — NOVA" },
      {
        property: "og:description",
        content: "Manage your NOVA profile, orders and Premium membership.",
      },
    ],
  }),
  component: Account,
});

function Account() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: orders } = useQuery({
    queryKey: ["orders", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, payment_status, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!session) {
    return (
      <Screen>
        <PageHeader title="Account" />
        <EmptyState
          title="You're not signed in"
          hint="Sign in to track orders, points and Premium perks."
          cta={{ to: "/auth", label: "Sign in" }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Account" />

      <section className="surface animate-rise rounded-3xl p-5">
        <p className="text-lg font-extrabold">{profile?.name}</p>
        <p className="text-xs text-muted-foreground">{profile?.phone}</p>
        {profile?.premium_status ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3.5" /> Premium member
          </p>
        ) : (
          <Link
            to="/premium"
            className="btn-primary press mt-4 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-xs font-bold"
          >
            Unlock Premium
          </Link>
        )}
      </section>

      <h2 className="mb-3 mt-6 text-sm font-bold">Your orders</h2>
      {(orders ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="space-y-2">
          {(orders ?? []).map((o) => (
            <li key={o.id}>
              <Link
                to="/order/$orderId"
                params={{ orderId: o.id }}
                className="surface press grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{o.order_number}</p>
                  <p className="text-[11px] capitalize text-muted-foreground">
                    {o.payment_status} · {formatDate(o.created_at)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold">{ksh(Number(o.total))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={async () => {
          await signOut();
          void navigate({ to: "/" });
        }}
        className="press mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-destructive"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </Screen>
  );
}
