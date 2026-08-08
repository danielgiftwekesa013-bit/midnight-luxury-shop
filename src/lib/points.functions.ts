import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Redeeming points is server-authoritative: balances are recomputed from the
 * ledger and a redemption is rejected when it would push the balance below
 * zero, so point balances can never go negative.
 */
export const redeemPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { productId: string; source: "loyalty" | "referral" }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, phone, premium_status")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.premium_status) {
      return { ok: false as const, message: "Premium members only." };
    }

    const { data: product } = await supabase
      .from("products")
      .select("id, name, price, stock, active")
      .eq("id", data.productId)
      .maybeSingle();

    if (!product || !product.active || product.stock <= 0) {
      return { ok: false as const, message: "Product unavailable." };
    }

    const table = data.source === "loyalty" ? "loyalty_points" : "referral_points";
    const { data: txs } = await supabase.from(table).select("transaction_type, amount");
    const balance = (txs ?? []).reduce(
      (n, t) => n + (t.transaction_type === "earned" ? t.amount : -t.amount),
      0,
    );

    const cost = Math.round(Number(product.price));
    if (balance < cost) {
      return { ok: false as const, message: "Not enough points." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: userId,
        total: cost,
        payment_method: "points",
        payment_status: "paid",
        order_status: "confirmed",
        customer_name: profile.name,
        phone: profile.phone,
        delivery_info: "To be confirmed on delivery",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      return { ok: false as const, message: "Could not create the order." };
    }

    await supabaseAdmin
      .from("order_items")
      .insert({ order_id: order.id, product_id: product.id, quantity: 1, price: cost });

    await supabaseAdmin.from(table).insert({
      customer_id: userId,
      transaction_type: "redeemed",
      amount: cost,
      description: `Redeemed for ${product.name}`,
    });

    await supabaseAdmin
      .from("products")
      .update({ stock: product.stock - 1 })
      .eq("id", product.id);

    return { ok: true as const, orderId: order.id, orderNumber: order.order_number };
  });
