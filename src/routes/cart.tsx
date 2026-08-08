import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Screen, PageHeader, EmptyState } from "@/components/Screen";
import { useCart } from "@/lib/app-context";
import { ksh } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — NOVA" },
      { name: "description", content: "Review your NOVA cart and check out with M-Pesa." },
      { property: "og:title", content: "Your Cart — NOVA" },
      { property: "og:description", content: "Review your NOVA cart and check out with M-Pesa." },
    ],
  }),
  component: CartScreen,
});

function CartScreen() {
  const { lines, total, setQuantity, remove, clearDirectBuy } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <Screen>
        <PageHeader title="Cart" />
        <EmptyState
          title="Your cart is empty"
          hint="Add something premium and check out with M-Pesa in seconds."
          cta={{ to: "/", label: "Start shopping" }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Cart" />

      <ul className="space-y-3">
        {lines.map(({ product, quantity }) => (
          <li key={product.id} className="surface animate-rise flex gap-3 rounded-3xl p-3">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-black">
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
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="mt-0.5 text-sm font-bold text-primary">{ksh(product.price)}</p>
                </div>
                <button
                  aria-label={`Remove ${product.name}`}
                  onClick={() => remove(product.id)}
                  className="press grid size-9 shrink-0 place-items-center rounded-full border border-border"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                  className="press grid size-9 place-items-center rounded-xl border border-border bg-elevated"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-7 text-center text-sm font-semibold">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                  disabled={quantity >= product.stock}
                  className="press grid size-9 place-items-center rounded-xl border border-border bg-elevated disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {product.stock} in stock
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="surface mt-5 rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-extrabold">{ksh(total)}</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[4.75rem] z-30">
        <div className="mx-auto max-w-[430px] px-4">
          <button
            onClick={() => {
              clearDirectBuy();
              void navigate({ to: "/checkout" });
            }}
            className="btn-primary press h-14 w-full rounded-2xl text-sm font-bold"
          >
            Checkout · {ksh(total)}
          </button>
        </div>
      </div>

      <Link to="/" className="press mt-6 block py-2 text-center text-xs text-muted-foreground">
        Continue shopping
      </Link>
    </Screen>
  );
}
