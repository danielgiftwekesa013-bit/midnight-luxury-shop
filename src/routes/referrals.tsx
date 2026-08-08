import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Screen, PageHeader, EmptyState } from "@/components/Screen";
import { useAuth } from "@/lib/app-context";
import { usePoints, balanceOf } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { pts, formatDate } from "@/lib/format";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referral Points — NOVA" },
      { name: "description", content: "Share your NOVA referral code and redeem referral points." },
      { property: "og:title", content: "Referral Points — NOVA" },
      {
        property: "og:description",
        content: "Share your NOVA referral code and redeem referral points.",
      },
    ],
  }),
  component: Referrals,
});

function Referrals() {
  const { profile } = useAuth();
  const { data } = usePoints("referral", profile?.id);

  const { data: referrals } = useQuery({
    queryKey: ["referrals", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("referrals")
        .select("id, status, points_awarded, created_at")
        .order("created_at", { ascending: false });
      return rows ?? [];
    },
  });

  if (!profile?.premium_status) {
    return (
      <Screen>
        <PageHeader title="Referral Points" />
        <EmptyState
          title="Premium members only"
          hint="Unlock Premium once to earn referral points when friends shop."
          cta={{ to: "/premium", label: "Unlock Premium" }}
        />
      </Screen>
    );
  }

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${profile.referral_code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(profile.referral_code);
    toast.success("Referral code copied");
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "NOVA", text: `Shop on NOVA with my code ${profile.referral_code}`, url: link });
    } else {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied");
    }
  };

  return (
    <Screen>
      <PageHeader title="Referral Points" />
      <section className="premium-panel animate-rise rounded-3xl p-6 text-center">
        <p className="text-xs text-muted-foreground">Your Referral Points</p>
        <p className="mt-2 font-display text-5xl font-extrabold">{pts(balanceOf(data))}</p>
        <p className="mt-1 text-xs text-muted-foreground">Points</p>
        <Link
          to="/redeem"
          className="btn-primary press mt-5 inline-flex h-12 items-center justify-center rounded-2xl px-8 text-sm font-bold"
        >
          Redeem Points
        </Link>
      </section>

      <section className="surface mt-5 rounded-3xl p-4">
        <p className="text-xs text-muted-foreground">Your Referral Code</p>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="truncate font-display text-2xl font-extrabold tracking-widest">
            {profile.referral_code}
          </p>
          <button
            onClick={copy}
            className="press flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-elevated px-3 text-xs font-semibold"
          >
            <Copy className="size-3.5" /> COPY
          </button>
        </div>
        <button
          onClick={share}
          className="btn-primary press mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold"
        >
          <Share2 className="size-4" /> Share Referral
        </button>
      </section>

      <h2 className="mb-3 mt-6 text-sm font-bold">Referral activity</h2>
      {(referrals ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">No referrals yet. Share your code to start.</p>
      ) : (
        <ul className="space-y-2">
          {(referrals ?? []).map((r) => (
            <li
              key={r.id}
              className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold capitalize">Referral {r.status}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-success">
                +{pts(r.points_awarded)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
