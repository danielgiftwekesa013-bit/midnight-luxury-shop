import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to NOVA" },
      { name: "description", content: "A quick tour of premium mobile shopping with NOVA." },
      { property: "og:title", content: "Welcome to NOVA" },
      { property: "og:description", content: "A quick tour of premium mobile shopping with NOVA." },
    ],
  }),
  component: Onboarding,
});

const slides = [
  {
    key: "logo",
    title: "NOVA",
    tagline: "Premium shopping, in your pocket.",
  },
  {
    key: "shop",
    title: "Shop Premium. Keep It Simple.",
    tagline: "Tap a product, pay with M-Pesa, done. No clutter, no long forms.",
  },
  {
    key: "premium",
    title: "Unlock Rewards With Premium.",
    tagline:
      "Premium members earn loyalty and referral points on every purchase — and redeem them for real products later.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = slides[step]!;

  const finish = () => {
    localStorage.setItem("nova.onboarded", "1");
    void navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.5rem)]">
        <div className="flex justify-end">
          <button onClick={finish} className="press p-2 text-sm text-muted-foreground">
            Skip
          </button>
        </div>

        <div key={slide.key} className="animate-rise flex flex-1 flex-col items-center justify-center text-center">
          {step === 0 && (
            <span className="btn-primary animate-pop grid size-24 place-items-center rounded-[28px] font-display text-4xl font-black">
              N
            </span>
          )}
          {step === 1 && (
            <span className="premium-panel animate-pop grid size-24 place-items-center rounded-[28px]">
              <ShoppingBag className="size-11 text-primary" strokeWidth={1.6} />
            </span>
          )}
          {step === 2 && (
            <span className="premium-panel animate-pop grid size-24 place-items-center rounded-[28px]">
              <Sparkles className="size-11 text-primary" strokeWidth={1.6} />
            </span>
          )}

          <h1 className="mt-8 text-3xl font-extrabold leading-tight">{slide.title}</h1>
          <p className="mt-3 max-w-[19rem] text-sm leading-relaxed text-muted-foreground">
            {slide.tagline}
          </p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {slides.map((s, i) => (
            <span
              key={s.key}
              className={
                i === step
                  ? "h-1.5 w-7 rounded-full bg-primary transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-border transition-all"
              }
            />
          ))}
        </div>

        {step < slides.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="btn-primary press h-14 w-full rounded-2xl text-sm font-bold"
          >
            Next
          </button>
        ) : (
          <button
            onClick={finish}
            className="btn-primary press h-14 w-full rounded-2xl text-sm font-bold"
          >
            Get Started
          </button>
        )}
      </div>
    </div>
  );
}
