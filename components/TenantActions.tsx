"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAN_STUDENT_CAPS } from "@/lib/plan-caps";

type Tenant = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  plan: string;
  maxStudents: number;
  isActive: boolean;
  studentCount?: number;
};

export function TenantActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState(tenant.name);
  const [shortName, setShortName] = useState(tenant.shortName);
  const [plan, setPlan] = useState(tenant.plan || "STARTER");
  const [maxStudents, setMaxStudents] = useState(String(tenant.maxStudents));

  const isKms = tenant.slug.toLowerCase() === "kms";

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/platform/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: tenant.id,
          name: name.trim(),
          shortName: shortName.trim().toUpperCase(),
          plan,
          maxStudents: Number(maxStudents) || PLAN_STUDENT_CAPS.STARTER,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Update failed");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(hard: boolean) {
    const label = hard ? "PERMANENTLY DELETE" : "suspend (soft-delete)";
    if (
      !window.confirm(
        hard
          ? `Hard-delete ${tenant.name}? Only allowed if it has 0 students. This cannot be undone.`
          : `Suspend ${tenant.name}? It will be inactive until reactivated.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/platform/tenants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: tenant.id, hard }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || `Could not ${label}`);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-1 justify-end">
        <button
          type="button"
          className="btn-ghost !px-2.5 !py-1 !text-[11px]"
          onClick={() => {
            setName(tenant.name);
            setShortName(tenant.shortName);
            setPlan(tenant.plan || "STARTER");
            setMaxStudents(String(tenant.maxStudents));
            setMsg("");
            setOpen((v) => !v);
          }}
        >
          {open ? "Close" : "Edit"}
        </button>
        {!isKms && (
          <button
            type="button"
            className="btn-ghost !px-2.5 !py-1 !text-[11px] text-brick"
            disabled={busy}
            onClick={() => remove(false)}
          >
            Suspend
          </button>
        )}
      </div>

      {open && (
        <div className="mt-1 w-[min(100vw-2rem,20rem)] rounded-xl border border-line bg-white p-3 shadow-lg text-left space-y-2 z-10">
          <p className="text-[11px] font-semibold text-navy uppercase tracking-wide">
            Edit tenant · {tenant.slug}
          </p>
          <label className="block text-[11px] text-ink/50">
            School name
            <input
              className="mt-0.5 w-full border border-line rounded-lg px-2 py-1.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-[11px] text-ink/50">
            Short name (saved UPPERCASE)
            <input
              className="mt-0.5 w-full border border-line rounded-lg px-2 py-1.5 text-sm font-mono uppercase"
              value={shortName}
              maxLength={12}
              onChange={(e) => setShortName(e.target.value.toUpperCase())}
              placeholder="DEBTEB"
            />
          </label>
          <label className="block text-[11px] text-ink/50">
            Plan
            <select
              className="mt-0.5 w-full border border-line rounded-lg px-2 py-1.5 text-sm"
              value={plan}
              onChange={(e) => {
                const p = e.target.value;
                setPlan(p);
                const cap =
                  PLAN_STUDENT_CAPS[p as keyof typeof PLAN_STUDENT_CAPS] ??
                  PLAN_STUDENT_CAPS.STARTER;
                setMaxStudents(String(cap));
              }}
            >
              <option value="STARTER">STARTER ({PLAN_STUDENT_CAPS.STARTER})</option>
              <option value="PRO">PRO ({PLAN_STUDENT_CAPS.PRO})</option>
              <option value="ENTERPRISE">ENTERPRISE ({PLAN_STUDENT_CAPS.ENTERPRISE})</option>
            </select>
          </label>
          <label className="block text-[11px] text-ink/50">
            Student cap
            <input
              type="number"
              min={50}
              className="mt-0.5 w-full border border-line rounded-lg px-2 py-1.5 text-sm tabular-nums"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
            />
          </label>
          {msg && <p className="text-[11px] text-brick">{msg}</p>}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="btn-primary !px-3 !py-1.5 !text-xs disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            {!isKms && (tenant.studentCount ?? 0) === 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(true)}
                className="btn-ghost !px-3 !py-1.5 !text-xs text-brick disabled:opacity-60"
              >
                Hard delete
              </button>
            )}
          </div>
          <p className="text-[10px] text-ink/40">
            Slug stays <code className="font-mono">{tenant.slug}</code> (URL). Short name is for
            admissions / display (e.g. DEBTEB).
          </p>
        </div>
      )}
    </div>
  );
}
