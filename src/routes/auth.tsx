import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/app-context";
import { isValidPhone } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to NOVA" },
      { name: "description", content: "Sign in or create your NOVA account with your phone number." },
      { property: "og:title", content: "Sign in to NOVA" },
      {
        property: "og:description",
        content: "Sign in or create your NOVA account with your phone number.",
      },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/account" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid Kenyan phone number.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (mode === "up" && name.trim().length < 2) {
      toast.error("Enter your name.");
      return;
    }

    setBusy(true);
    const error =
      mode === "in" ? await signIn(phone, password) : await signUp(name, phone, password);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(mode === "in" ? "Welcome back" : "Account created");
    void navigate({ to: "/" });
  };


  const field =
    "h-14 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-[430px] px-5 pb-10 pt-[max(env(safe-area-inset-top),2.5rem)]">
        <span className="btn-primary grid size-14 place-items-center rounded-2xl font-display text-2xl font-black">
          N
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "in" ? "Sign in with your phone number." : "It takes less than a minute."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          {mode === "up" && (
            <input
              className={field}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className={field}
            placeholder="Phone number (07XX XXX XXX)"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <input
            className={field}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-primary press h-14 w-full rounded-2xl text-sm font-bold disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "in" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="press mt-6 w-full py-2 text-sm text-muted-foreground"
        >
          {mode === "in" ? (
            <>
              New here? <span className="font-semibold text-primary">Create an account</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-semibold text-primary">Sign in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
