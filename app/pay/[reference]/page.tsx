"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";

/**
 * Payment return / mock checkout page.
 * Live Paystack redirects here after payment; mock mode confirms locally.
 */
export default function PayReferencePage() {
  const params = useParams();
  const search = useSearchParams();
  const reference = String(params.reference || "");
  const provider = (search.get("provider") || "PAYSTACK") as "PAYSTACK" | "FLUTTERWAVE";

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function confirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/fees/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error || "Could not confirm payment");
        return;
      }
      setStatus("ok");
      setMessage(
        data.alreadyApplied
          ? "This payment was already recorded. Thank you."
          : "Payment confirmed. The school has updated the invoice."
      );
    } catch {
      setStatus("err");
      setMessage("Network error");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef]">
      <MarketingNav />
      <div className="flex items-center justify-center px-4 py-10">
        <div className="bg-white border border-[#e3e8ed] rounded-2xl max-w-md w-full space-y-4 text-center p-5 shadow-sm">
          <h1 className="font-serif text-2xl text-[#12345a]">Fee Payment</h1>
          <p className="text-sm text-[#627184] break-all">Reference: {reference}</p>

          {status === "idle" && (
            <>
              <p className="text-sm text-[#627184]">
                If you completed payment with the gateway, tap confirm below. In demo mode this
                simulates a successful charge.
              </p>
              <button
                type="button"
                onClick={confirm}
                className="w-full rounded-xl bg-[#12345a] text-white py-3 text-sm font-semibold"
              >
                Confirm payment
              </button>
            </>
          )}
          {status === "loading" && <p className="text-sm">Verifying…</p>}
          {status === "ok" && <p className="text-sm text-sage">{message}</p>}
          {status === "err" && <p className="text-sm text-brick">{message}</p>}

          <Link href="/" className="block text-sm text-[#12345a] font-semibold underline">
            Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}
