import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOVA — Shop Premium Tech, Pay with M-Pesa" },
      {
        name: "description",
        content:
          "Browse featured premium tech and check out with M-Pesa in a few taps on your phone.",
      },
      { property: "og:title", content: "NOVA — Shop Premium Tech, Pay with M-Pesa" },
      {
        property: "og:description",
        content: "Featured premium tech, one-tap Buy Now and instant M-Pesa checkout.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const [searching, setSearching] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (localStorage.getItem("nova.onboarded") !== "1") {
      void navigate({ to: "/onboarding" });
    }
  }, [navigate]);

  const list = useMemo(() => {
    if (!products) return [];
    const q = term.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, term]);

  return (
    <Screen>
      <TopBar
        searching={searching}
        onSearchToggle={() => {
          setSearching((s) => !s);
          setTerm("");
        }}
      />

      {searching && (
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search products"
          className="animate-rise mb-4 h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      )}

      <section className="premium-panel animate-rise mb-6 rounded-3xl p-5">
        <h2 className="text-xl font-extrabold leading-tight">
          Shop premium.
          <br />
          Pay with M-Pesa.
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Fast checkout. Delivered across Kenya.
        </p>
      </section>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-bold">Featured Products</h2>
        <span className="text-xs text-muted-foreground">{list.length} items</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface h-72 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Screen>
  );
}
