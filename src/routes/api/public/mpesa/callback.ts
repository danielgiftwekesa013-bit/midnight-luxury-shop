import { createFileRoute } from "@tanstack/react-router";

/**
 * Daraja STK Push callback. Safaricom posts the final payment result here.
 * This is the ONLY place an order may be marked as paid.
 *
 * Wire this URL into MPESA_CALLBACK_URL once Daraja credentials are connected.
 */
export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as {
          Body?: {
            stkCallback?: {
              ResultCode?: number;
              CheckoutRequestID?: string;
              CallbackMetadata?: { Item?: Array<{ Name: string; Value?: string | number }> };
            };
          };
        };

        const cb = payload.Body?.stkCallback;
        if (!cb?.CheckoutRequestID) {
          return new Response("ignored", { status: 200 });
        }

        const receipt = cb.CallbackMetadata?.Item?.find(
          (i) => i.Name === "MpesaReceiptNumber",
        )?.Value;

        const status =
          cb.ResultCode === 0 ? "paid" : cb.ResultCode === 1032 ? "cancelled" : "failed";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: status,
            order_status: status === "paid" ? "confirmed" : "pending",
            payment_reference: receipt ? String(receipt) : null,
          })
          .eq("payment_reference", cb.CheckoutRequestID);

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});
