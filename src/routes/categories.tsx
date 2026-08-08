import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, PageHeader } from "@/components/Screen";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/queries";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — NOVA" },
      { name: "description", content: "Browse NOVA products by category: audio, wearables and power." },
      { property: "og:title", content: "Categories — NOVA" },
      { property: "og:description", content: "Browse NOVA products by category." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: products } = useProducts();
  const [active, setActive] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set((products ?? []).map((p) => p.category)))],
    [products],
  );
  const list = (products ?? []).filter((p) => active === "All" || p.category === active);

  return (
    <Screen>
      <PageHeader title="Categories" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`press h-10 shrink-0 rounded-full px-4 text-xs font-semibold ${
              active === c
                ? "btn-primary"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Screen>
  );
}
