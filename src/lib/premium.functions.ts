import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Starts the one-time Premium unlock payment. Premium is only granted after
 * the M-Pesa callback verifies the payment on the backend — never from the
 * client.
 */
export const startPremiumUnlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string; amount: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment, error } = await supabaseAdmin
      .from("premium_payments")
      .insert({ customer_id: context.userId, amount: data.amount, status: "initiated" })
      .select("id")
      .single();

    if (error || !payment) {
      return { state: "failed" as const, message: "Could not start the payment." };
    }

    const { readDarajaConfig, stkPush } = await import("@/lib/mpesa.server");
    const cfg = readDarajaConfig();
    if (!cfg) {
      return {
        state: "failed" as const,
        message:
          "M-Pesa is not connected yet. Add your Daraja credentials to enable live STK Push.",
        paymentId: payment.id,
      };
    }

    try {
      const result = await stkPush({
        cfg,
        phone: data.phone,
        amount: data.amount,
        reference: `PREMIUM-${payment.id.slice(0, 8)}`,
      });
      await supabaseAdmin
        .from("premium_payments")
        .update({ payment_reference: result.checkoutRequestId, status: "waiting" })
        .eq("id", payment.id);
      return {
        state: "waiting" as const,
        message: "Check your phone and enter your M-Pesa PIN.",
        paymentId: payment.id,
      };
    } catch (e) {
      return {
        state: "failed" as const,
        message: e instanceof Error ? e.message : "M-Pesa request failed.",
        paymentId: payment.id,
      };
    }
  });

export const getPremiumPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paymentId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: payment } = await context.supabase
      .from("premium_payments")
      .select("status")
      .eq("id", data.paymentId)
      .maybeSingle();
    return { status: payment?.status ?? "unknown" };
  });
