import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/app-context";

export function TopBar({
  onSearchToggle,
  searching,
}: {
  onSearchToggle: () => void;
  searching: boolean;
}) {
  const { count } = useCart();

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="btn-primary grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black">
          N
        </span>
        <span className="truncate font-display text-lg font-extrabold tracking-tight">NOVA</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          aria-label="Search products"
          onClick={onSearchToggle}
          className={`press grid size-10 place-items-center rounded-full border border-border ${searching ? "bg-primary text-primary-foreground" : "bg-card"}`}
        >
          <Search className="size-[18px]" />
        </button>
        <Link
          to="/cart"
          aria-label="Cart"
          className="press relative grid size-10 place-items-center rounded-full border border-border bg-card"
        >
          <ShoppingBag className="size-[18px]" />
          {count > 0 && (
            <span className="animate-pop absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        <Link
          to="/account"
          aria-label="Account"
          className="press grid size-10 place-items-center rounded-full border border-border bg-card"
        >
          <User className="size-[18px]" />
        </Link>
      </div>
    </header>
  );
}
