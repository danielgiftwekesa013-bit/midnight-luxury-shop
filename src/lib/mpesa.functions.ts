import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const initiateMpesaPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; phone: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, total, customer_id, payment_status")
      .eq("id", data.orderId)
      .eq("customer_id", userId)
      .maybeSingle();

    if (error || !order) {
      return { state: "failed" as const, message: "Order not found." };
    }

    const { readDarajaConfig, stkPush } = await import("@/lib/mpesa.server");
    const cfg = readDarajaConfig();
    if (!cfg) {
      return {
        state: "failed" as const,
        message:
          "M-Pesa is not connected yet. Add your Daraja credentials to enable live STK Push.",
      };
    }

    try {
      const result = await stkPush({
        cfg,
        phone: data.phone,
        amount: Number(order.total),
        reference: order.order_number,
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({ payment_reference: result.checkoutRequestId, payment_status: "waiting" })
        .eq("id", order.id);

      return {
        state: "waiting" as const,
        message: "Check your phone and enter your M-Pesa PIN.",
        checkoutRequestId: result.checkoutRequestId,
      };

    } catch (e) {
      return {
        state: "failed" as const,
        message: e instanceof Error ? e.message : "M-Pesa request failed.",
      };
    }
  });

/**
 * The database is the only source of truth for payment status; it is written
 * by the verified Daraja callback, never by the client.
 */
export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("payment_status, order_status, order_number, total")
      .eq("id", data.orderId)
      .eq("customer_id", context.userId)
      .maybeSingle();

    return { payment_status: order?.payment_status ?? "unknown" };
  });
