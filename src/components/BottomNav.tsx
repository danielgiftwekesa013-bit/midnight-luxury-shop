import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingBag, Sparkles, User } from "lucide-react";
import { useCart } from "@/lib/app-context";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/premium", label: "Premium", icon: Sparkles },
  { to: "/account", label: "Account", icon: User },
] as const;

export function BottomNav() {
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-[430px] items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="press relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl"
              >
                <span className="relative">
                  <Icon
                    className={active ? "size-6 text-primary" : "size-6 text-muted-foreground"}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  {to === "/cart" && count > 0 && (
                    <span className="animate-pop absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {count}
                    </span>
                  )}
                </span>
                <span
                  className={
                    active
                      ? "text-[10px] font-semibold text-primary"
                      : "text-[10px] text-muted-foreground"
                  }
                >
                  {label}
                </span>
                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
