import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Profile } from "./types";
import { phoneToAuthEmail, normalizePhone } from "./format";

/* ------------------------------- Auth ---------------------------------- */

type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (name: string, phone: string, password: string) => Promise<string | null>;
  signIn: (phone: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, phone, premium_status, premium_unlocked_at, referral_code")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) void loadProfile(session.user.id);
  }, [session?.user.id, loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profile,
      loading,
      signUp: async (name, phone, password) => {
        const { error } = await supabase.auth.signUp({
          email: phoneToAuthEmail(phone),
          password,
          options: { data: { name, phone: normalizePhone(phone) } },
        });
        return error ? error.message : null;
      },
      signIn: async (phone, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: phoneToAuthEmail(phone),
          password,
        });
        return error ? "Wrong phone number or password." : null;
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
      refreshProfile: async () => {
        if (session?.user.id) await loadProfile(session.user.id);
      },
    }),
    [session, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AppProviders");
  return ctx;
}

/* ------------------------------- Cart ---------------------------------- */

export type CartLine = { product: Product; quantity: number };

type CartValue = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  buyNow: (product: Product) => CartLine[];
  directBuy: CartLine[] | null;
  clearDirectBuy: () => void;
};

const CartContext = createContext<CartValue | null>(null);
const CART_KEY = "nova.cart.v1";

function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [directBuy, setDirectBuy] = useState<CartLine[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const total = lines.reduce((n, l) => n + l.quantity * l.product.price, 0);
    return {
      lines,
      count,
      total,
      add: (product, quantity = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.product.id === product.id);
          const nextQty = Math.min((existing?.quantity ?? 0) + quantity, product.stock);
          if (nextQty <= 0) return prev;
          return existing
            ? prev.map((l) => (l.product.id === product.id ? { ...l, quantity: nextQty } : l))
            : [...prev, { product, quantity: nextQty }];
        }),
      setQuantity: (productId, quantity) =>
        setLines((prev) =>
          prev.flatMap((l) => {
            if (l.product.id !== productId) return [l];
            const q = Math.max(0, Math.min(quantity, l.product.stock));
            return q === 0 ? [] : [{ ...l, quantity: q }];
          }),
        ),
      remove: (productId) => setLines((prev) => prev.filter((l) => l.product.id !== productId)),
      clear: () => setLines([]),
      buyNow: (product) => {
        const line = [{ product, quantity: 1 }];
        setDirectBuy(line);
        return line;
      },
      directBuy,
      clearDirectBuy: () => setDirectBuy(null),
    };
  }, [lines, directBuy]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside AppProviders");
  return ctx;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
