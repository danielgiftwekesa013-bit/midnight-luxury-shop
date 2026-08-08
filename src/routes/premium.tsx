import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Loader2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Screen, PageHeader } from "@/components/Screen";
import { useAuth } from "@/lib/app-context";
import { usePoints, balanceOf } from "@/lib/queries";
import { ksh, pts, isValidPhone, normalizePhone } from "@/lib/format";
import { PREMIUM_PRICE, type PaymentState } from "@/lib/types";
import { startPremiumUnlock, getPremiumPaymentStatus } from "@/lib/premium.functions";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium Rewards — NOVA" },
      {
        name: "description",
        content: "Unlock NOVA Premium once and earn loyalty and referral points you can redeem.",
      },
      { property: "og:title", content: "Premium Rewards — NOVA" },
      {
        property: "og:description",
        content: "One-time unlock. Earn loyalty and referral points and redeem them for products.",
      },
    ],
  }),
  component: Premium,
});

function Premium() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session === null && !localStorage.getItem("nova.onboarded")) return;
  }, [session]);

  if (!session) {
    return (
      <Screen>
        <PageHeader title="Premium" />
        <UnlockPitch>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="btn-primary press h-14 w-full rounded-2xl text-sm font-bold"
          >
            Sign in to continue
          </button>
        </UnlockPitch>
      </Screen>
    );
  }

  if (!profile?.premium_status) {
    return (
      <Screen>
        <PageHeader title="Premium" />
        <UnlockPitch>
          <UnlockForm defaultPhone={profile?.phone ?? ""} onDone={refreshProfile} />
        </UnlockPitch>
      </Screen>
    );
  }

  return <PremiumDashboard customerId={profile.id} />;
}

function UnlockPitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-rise">
      <section className="premium-panel rounded-3xl p-6 text-center">
        <span className="btn-primary mx-auto grid size-16 place-items-center rounded-2xl">
          <Sparkles className="size-8" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold">Unlock Premium</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          One-time payment: <span className="font-bold text-foreground">{ksh(PREMIUM_PRICE)}</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">No subscription. Never expires.</p>
      </section>

      <ul className="mt-5 space-y-2.5">
        <Perk icon={Gift} title="Loyalty Points" text="Earn points on every purchase." />
        <Perk icon={Users} title="Referral Points" text="Earn when friends shop with your code." />
        <Perk icon={Sparkles} title="Redeem for products" text="Turn your points into real items." />
      </ul>

      <div className="mt-6">{children}</div>
    </div>
  );
}

function Perk({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Gift;
  title: string;
  text: string;
}) {
  return (
    <li className="surface flex items-center gap-3 rounded-2xl p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12">
        <Icon className="size-5 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}

function UnlockForm({ defaultPhone, onDone }: { defaultPhone: string; onDone: () => void }) {
  const start = useServerFn(startPremiumUnlock);
  const check = useServerFn(getPremiumPaymentStatus);
  const [phone, setPhone] = useState(defaultPhone);
  const [state, setState] = useState<PaymentState>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => () => void (timer.current && window.clearInterval(timer.current)), []);

  const unlock = async () => {
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid M-Pesa phone number.");
      return;
    }
    setState("initiated");
    const result = await start({
      data: { phone: normalizePhone(phone), amount: PREMIUM_PRICE },
    });
    setMessage(result.message);
    if (result.state === "failed" || !result.paymentId) {
      setState("failed");
      return;
    }
    setState("waiting");
    const paymentId = result.paymentId;
    let elapsed = 0;
    timer.current = window.setInterval(async () => {
      elapsed += 4;
      const status = await check({ data: { paymentId } });
      if (status.status === "paid") {
        window.clearInterval(timer.current!);
        setState("successful");
        onDone();
      } else if (status.status === "cancelled" || status.status === "failed") {
        window.clearInterval(timer.current!);
        setState(status.status as PaymentState);
      } else if (elapsed >= 90) {
        window.clearInterval(timer.current!);
        setState("timeout");
      }
    }, 4000);
  };

  const busy = state === "initiated" || state === "waiting";

  return (
    <div className="space-y-3">
      <input
        className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        placeholder="M-Pesa phone number"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button
        onClick={unlock}
        disabled={busy}
        className="btn-primary press flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {busy ? "Waiting for M-Pesa…" : `Unlock Premium · ${ksh(PREMIUM_PRICE)}`}
      </button>
      {state !== "idle" && message && (
        <p className="rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}

function PremiumDashboard({ customerId }: { customerId: string }) {
  const loyalty = usePoints("loyalty", customerId);
  const referral = usePoints("referral", customerId);

  return (
    <Screen>
      <PageHeader title="Premium" />
      <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
        <Sparkles className="size-3.5" /> Premium member
      </p>

      <div className="space-y-3">
        <PointsCard
          title="Loyalty Points"
          value={balanceOf(loyalty.data)}
          to="/loyalty"
          icon={Gift}
        />
        <PointsCard
          title="Referral Points"
          value={balanceOf(referral.data)}
          to="/referrals"
          icon={Users}
        />
      </div>

      <Link
        to="/redeem"
        className="surface press mt-5 flex h-14 items-center justify-center rounded-2xl text-sm font-semibold"
      >
        Redeem points for products
      </Link>
    </Screen>
  );
}

function PointsCard({
  title,
  value,
  to,
  icon: Icon,
}: {
  title: string;
  value: number;
  to: string;
  icon: typeof Gift;
}) {
  return (
    <section className="premium-panel animate-rise rounded-3xl p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <p className="mt-3 font-display text-4xl font-extrabold">{pts(value)}</p>
      <Link
        to={to}
        className="btn-primary press mt-4 inline-flex h-11 items-center justify-center rounded-2xl px-6 text-xs font-bold"
      >
        Redeem
      </Link>
    </section>
  );
}
