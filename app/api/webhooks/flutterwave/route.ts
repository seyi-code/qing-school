import { NextRequest, NextResponse } from "next/server";
import { applyFlutterwaveSubscriptionEvent } from "@/lib/integrations/flutterwave-billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Flutterwave webhook.
 * Dashboard → Webhooks → https://YOUR_DOMAIN/api/webhooks/flutterwave
 * Optional: FLUTTERWAVE_WEBHOOK_HASH must match verif-hash header.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hashHeader = req.headers.get("verif-hash") || "";
  const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH || "";
  const paymentsMode = (process.env.PAYMENTS_MODE || "").toLowerCase();
  const allowMock = paymentsMode === "mock" || paymentsMode === "dev";

  if (expected) {
    if (hashHeader !== expected) {
      return NextResponse.json({ error: "Invalid verif-hash" }, { status: 401 });
    }
  } else if (!process.env.FLUTTERWAVE_SECRET_KEY && !allowMock) {
    return NextResponse.json(
      { error: "Flutterwave webhook not configured" },
      { status: 503 }
    );
  }

  let event: {
    event?: string;
    data?: {
      status?: string;
      tx_ref?: string;
      meta?: { schoolId?: string; plan?: string; type?: string };
      customer?: { email?: string };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data || {};
  const name = (event.event || "").toLowerCase();

  try {
    if (
      name.includes("charge") ||
      name.includes("payment") ||
      data.status === "successful" ||
      data.status === "success"
    ) {
      const result = await applyFlutterwaveSubscriptionEvent({
        status: data.status,
        tx_ref: data.tx_ref,
        meta: data.meta,
        customer: data.customer,
      });
      return NextResponse.json({ received: true, ...result });
    }
    return NextResponse.json({ received: true, ignored: true, event: name });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[flutterwave webhook]", message);
    return NextResponse.json({ received: true, error: message }, { status: 500 });
  }
}
