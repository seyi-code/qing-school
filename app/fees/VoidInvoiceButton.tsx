"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Void an unpaid invoice (e.g. duplicate transport fee). Soft-delete via status. */
export function VoidInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onVoid() {
    if (
      !confirm(
        "Void this unpaid invoice? It will be hidden from the fees list. Use this for duplicates only."
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch("/api/fees/invoices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invoiceId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      alert(data.error || "Could not void invoice");
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onVoid}
      disabled={busy}
      className="text-xs text-brick/80 hover:text-brick underline disabled:opacity-50"
    >
      {busy ? "…" : "Void"}
    </button>
  );
}
