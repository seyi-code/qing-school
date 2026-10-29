"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_STUDENT_CAPS } from "@/lib/plan-caps";
import { PLAN_PRICE_NGN_MONTHLY, formatPlanPriceNgn } from "@/lib/billing-catalog";

type SchoolOpt = {
  id: string;
  name: string;
  slug: string;
  plan?: string | null;
  maxStudents?: number | null;
  subscriptionStatus?: string | null;
};

function formatCap(n: number) {
  return n.toLocaleString();
}

export function PlatformBillingForm({
  schools,
  liveBilling = false,
  flutterwaveLive = false,
}: {
  schools: SchoolOpt[];
  liveBilling?: boolean;
  flutterwaveLive?: boolean;
}) {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [plan, setPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [provider, setProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [customCap, setCustomCap] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const selected = useMemo(
    () => schools.find((s) => s.id === schoolId),
    [schools, schoolId]
  );

  async function setPlanOnly() {
    if (!schoolId) return;
    setLoading(true);
    setMsg("");
    const body: Record<string, unknown> = { schoolId, plan };
    const cap = Number(customCap);
    if (customCap && Number.isFinite(cap) && cap > 0) body.maxStudents = Math.floor(cap);
    const res = await fetch("/api/platform/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to set plan");
      return;
    }
    setMsg(`Plan set to ${plan} (manual). Cap ${data.school?.maxStudents ?? "—"}.`);
    router.refresh();
  }

  async function subscribe(e: FormEvent) {
    e.preventDefault();
    if (!schoolId || !email) {
      setMsg("School and billing email required for checkout");
      return;
    }
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/platform/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: provider === "flutterwave" ? "subscribe_flutterwave" : "subscribe",
        schoolId,
        plan,
        email,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "Subscribe failed");
      return;
    }
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
      return;
    }
    setMsg(
      data.message ||
        (data.mock
          ? `Mock OK — ${provider}: plan applied, no charge (add API keys for live).`
          : "Subscription started")
    );
    router.refresh();
  }

  if (!schools.length) return null;

  return (
    <form onSubmit={subscribe} className="ledger-block space-y-3 text-sm max-w-lg">
      <h2 className="font-serif text-lg m-0">SaaS billing</h2>
      <p className="text-xs text-ink/60 m-0">
        Paystack: {liveBilling ? "live keys detected" : "mock (no PAYSTACK_SECRET_KEY)"}. Flutterwave:{" "}
        {flutterwaveLive ? "live keys detected" : "mock (no FLUTTERWAVE_SECRET_KEY)"}.
      </p>
      <label className="block">
        <span className="text-xs text-ink/50">School</span>
        <select
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.slug})
              {s.subscriptionStatus ? ` · ${s.subscriptionStatus}` : ""}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <p className="text-xs text-ink/50 m-0">
          Current: <span className="font-medium text-ink/70">{selected.plan}</span>
          {typeof selected.maxStudents === "number"
            ? ` · ${formatCap(selected.maxStudents)} students`
            : ""}
          {selected.subscriptionStatus ? ` · ${selected.subscriptionStatus}` : ""}
        </p>
      ) : null}
      <label className="block">
        <span className="text-xs text-ink/50">Plan</span>
        <select
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={plan}
          onChange={(e) => {
            const p = e.target.value as typeof plan;
            setPlan(p);
            setCustomCap(String(PLAN_STUDENT_CAPS[p]));
          }}
        >
          <option value="STARTER">
            STARTER — {formatCap(PLAN_STUDENT_CAPS.STARTER)} · {formatPlanPriceNgn("STARTER")}
          </option>
          <option value="PRO">
            PRO — {formatCap(PLAN_STUDENT_CAPS.PRO)} · {formatPlanPriceNgn("PRO")}
          </option>
          <option value="ENTERPRISE">
            ENTERPRISE — {formatCap(PLAN_STUDENT_CAPS.ENTERPRISE)} ·{" "}
            {formatPlanPriceNgn("ENTERPRISE")}
          </option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Payment provider</span>
        <select
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={provider}
          onChange={(e) => setProvider(e.target.value as typeof provider)}
        >
          <option value="paystack">Paystack (subscriptions)</option>
          <option value="flutterwave">Flutterwave (checkout)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">
          Student cap (optional override — blank = plan default)
        </span>
        <input
          type="number"
          min={1}
          max={100000}
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={customCap}
          onChange={(e) => setCustomCap(e.target.value)}
          placeholder={`e.g. ${PLAN_STUDENT_CAPS[plan]}`}
        />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Billing email (required for checkout)</span>
        <input
          type="email"
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@school.ng"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={setPlanOnly}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Working…" : "Set plan / cap (no charge)"}
        </button>
        <button type="submit" disabled={loading || !email} className="btn-ghost disabled:opacity-60">
          {loading ? "Working…" : `Start ${provider === "paystack" ? "Paystack" : "Flutterwave"}`}
        </button>
      </div>
      {msg && <p className="text-xs text-ink/70">{msg}</p>}
      <p className="text-[11px] text-ink/40 m-0">
        Catalog: STARTER ₦{PLAN_PRICE_NGN_MONTHLY.STARTER.toLocaleString()} · PRO ₦
        {PLAN_PRICE_NGN_MONTHLY.PRO.toLocaleString()} · ENTERPRISE ₦
        {PLAN_PRICE_NGN_MONTHLY.ENTERPRISE.toLocaleString()} / month. See docs/BILLING.md.
      </p>
    </form>
  );
}
