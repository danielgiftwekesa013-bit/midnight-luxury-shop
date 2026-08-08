import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/lib/app-context";
import { ksh } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { add, buyNow } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  const handleAdd = () => {
    if (soldOut) return;
    add(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1100);
  };

  const handleBuy = () => {
    if (soldOut) return;
    buyNow(product);
    void navigate({ to: "/checkout" });
  };

  return (
    <article className="surface animate-rise overflow-hidden rounded-3xl">
      <div className="relative aspect-square w-full bg-black">
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
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            Sold out
          </span>
        )}
        {added && (
          <span className="animate-pop absolute inset-0 grid place-items-center bg-background/70">
            <span className="grid size-14 place-items-center rounded-full bg-success text-success-foreground">
              <Check className="size-7" strokeWidth={3} />
            </span>
          </span>
        )}
      </div>

      <div className="space-y-3 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{product.name}</h3>
          <p className="mt-0.5 text-base font-bold text-primary">{ksh(product.price)}</p>
        </div>
        <div className="grid gap-2">
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="press flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-elevated text-xs font-semibold disabled:opacity-40"
          >
            <Plus className="size-4" /> Add to Cart
          </button>
          <button
            onClick={handleBuy}
            disabled={soldOut}
            className="btn-primary press flex h-11 items-center justify-center rounded-2xl text-xs font-bold disabled:opacity-40"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
