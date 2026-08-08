import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, PageHeader, EmptyState } from "@/components/Screen";
import { useAuth } from "@/lib/app-context";
import { usePoints, balanceOf } from "@/lib/queries";
import { pts, formatDate } from "@/lib/format";

export const Route = createFileRoute("/loyalty")({
  head: () => ({
    meta: [
      { title: "Loyalty Points — NOVA" },
      { name: "description", content: "See your NOVA loyalty points balance and history." },
      { property: "og:title", content: "Loyalty Points — NOVA" },
      { property: "og:description", content: "See your NOVA loyalty points balance and history." },
    ],
  }),
  component: Loyalty,
});

function Loyalty() {
  const { profile } = useAuth();
  const { data } = usePoints("loyalty", profile?.id);

  if (!profile?.premium_status) {
    return (
      <Screen>
        <PageHeader title="Loyalty Points" />
        <EmptyState
          title="Premium members only"
          hint="Unlock Premium once to start earning and redeeming loyalty points."
          cta={{ to: "/premium", label: "Unlock Premium" }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Loyalty Points" />
      <section className="premium-panel animate-rise rounded-3xl p-6 text-center">
        <p className="text-xs text-muted-foreground">Your Loyalty Points</p>
        <p className="mt-2 font-display text-5xl font-extrabold">{pts(balanceOf(data))}</p>
        <p className="mt-1 text-xs text-muted-foreground">Points</p>
        <Link
          to="/redeem"
          className="btn-primary press mt-5 inline-flex h-12 items-center justify-center rounded-2xl px-8 text-sm font-bold"
        >
          Redeem Points
        </Link>
      </section>

      <h2 className="mb-3 mt-6 text-sm font-bold">History</h2>
      {(data ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">No point activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((t) => (
            <li
              key={t.id}
              className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold capitalize">
                  {t.description || `Points ${t.transaction_type}`}
                </p>
                <p className="text-[11px] text-muted-foreground">{formatDate(t.created_at)}</p>
              </div>
              <span
                className={`shrink-0 text-sm font-bold ${t.transaction_type === "earned" ? "text-success" : "text-muted-foreground"}`}
              >
                {t.transaction_type === "earned" ? "+" : "−"}
                {pts(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
