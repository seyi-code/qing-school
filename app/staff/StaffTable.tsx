"use client";

import { FormEvent, Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { passwordPolicyHint } from "@/lib/password-policy";

type StaffRow = {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  category: string;
  phone: string | null;
  monthlySalary: number | null;
  isActive: boolean;
  email: string;
  role: string;
};

const ROLES = ["TEACHER", "ACCOUNTANT", "SECRETARY", "IT", "PRINCIPAL", "ADMIN"] as const;

export function StaffTable({ rows }: { rows: StaffRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        designation: fd.get("designation") || null,
        category: fd.get("category"),
        phone: fd.get("phone") || null,
        monthlySalary: fd.get("monthlySalary") || null,
        role: fd.get("role"),
        isActive: fd.get("isActive") === "true",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Update failed");
      return;
    }
    setMsg("Staff updated.");
    setEditingId(null);
    router.refresh();
  }

  async function resetPassword(staffId: string) {
    const newPassword = prompt(
      `New password for this staff account.\n${passwordPolicyHint()}`
    );
    if (!newPassword) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resetPassword", staffId, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Reset failed");
      return;
    }
    setMsg("Password reset successfully.");
  }

  return (
    <div className="space-y-3">
      {msg && (
        <p className={`text-sm ${msg.includes("updated") || msg.includes("reset") ? "text-sage" : "text-brick"}`}>
          {msg}
        </p>
      )}

      <div className="md:hidden space-y-2">
        {rows.map((s) => (
          <div key={s.id} className="ledger-block !p-3 space-y-2">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-medium text-sm">
                  {s.lastName}, {s.firstName}
                </p>
                <p className="text-xs font-mono text-ink/50">{s.staffId}</p>
                <p className="text-xs text-ink/50">{s.email}</p>
              </div>
              <span className={`status-pill text-[10px] h-fit ${s.isActive ? "text-sage" : "text-brick"}`}>
                {s.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <p className="text-xs text-ink/70">
              {s.designation ?? "—"} · {s.category === "TEACHING" ? "Teaching" : "Non-teaching"} · {s.role}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                className="btn-ghost !py-1 !px-2.5 !text-xs"
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
              >
                {editingId === s.id ? "Cancel" : "Edit"}
              </button>
              <button
                type="button"
                className="btn-ghost !py-1 !px-2.5 !text-xs"
                disabled={busy}
                onClick={() => resetPassword(s.id)}
              >
                Reset password
              </button>
            </div>
            {editingId === s.id && (
              <form onSubmit={(e) => save(e, s.id)} className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
                <label className="text-xs">
                  First name
                  <input name="firstName" required defaultValue={s.firstName} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white" />
                </label>
                <label className="text-xs">
                  Last name
                  <input name="lastName" required defaultValue={s.lastName} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white" />
                </label>
                <label className="text-xs col-span-2">
                  Designation
                  <input name="designation" defaultValue={s.designation ?? ""} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white" />
                </label>
                <label className="text-xs">
                  Phone
                  <input name="phone" defaultValue={s.phone ?? ""} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white" />
                </label>
                <label className="text-xs">
                  Category
                  <select name="category" defaultValue={s.category} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white">
                    <option value="TEACHING">Teaching</option>
                    <option value="NON_TEACHING">Non-teaching</option>
                  </select>
                </label>
                <label className="text-xs">
                  Role
                  <select name="role" defaultValue={s.role} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white">
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  Monthly salary
                  <input name="monthlySalary" type="number" min={0} step="0.01" defaultValue={s.monthlySalary ?? ""} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white" />
                </label>
                <label className="text-xs col-span-2">
                  Status
                  <select name="isActive" defaultValue={s.isActive ? "true" : "false"} className="block w-full border border-line rounded-lg px-2 py-1.5 bg-white">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
                <div className="col-span-2">
                  <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
                    {busy ? "Saving…" : "Save staff"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block ledger-block !p-0 overflow-x-auto">
        <table className="ledger">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Category</th>
              <th>Login role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <Fragment key={s.id}>
                <tr>
                  <td className="font-mono text-xs">{s.staffId}</td>
                  <td>
                    {s.lastName}, {s.firstName}
                    <div className="text-xs text-ink/50">{s.email}</div>
                  </td>
                  <td>{s.designation ?? "-"}</td>
                  <td>{s.category === "TEACHING" ? "Teaching" : "Non-teaching"}</td>
                  <td>{s.role}</td>
                  <td>
                    <span className={`status-pill text-[10px] ${s.isActive ? "text-sage" : "text-brick"}`}>
                      {s.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap space-x-2">
                    <button type="button" className="text-navy font-medium hover:underline" onClick={() => setEditingId(editingId === s.id ? null : s.id)}>
                      {editingId === s.id ? "Cancel" : "Edit"}
                    </button>
                    <button type="button" className="text-ink/60 hover:underline" disabled={busy} onClick={() => resetPassword(s.id)}>
                      Reset password
                    </button>
                  </td>
                </tr>
                {editingId === s.id && (
                  <tr>
                    <td colSpan={7} className="bg-navy/5">
                      <form onSubmit={(e) => save(e, s.id)} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 text-sm">
                        <label className="text-xs">
                          First name
                          <input name="firstName" required defaultValue={s.firstName} className="block w-full border border-line px-2 py-1 bg-white" />
                        </label>
                        <label className="text-xs">
                          Last name
                          <input name="lastName" required defaultValue={s.lastName} className="block w-full border border-line px-2 py-1 bg-white" />
                        </label>
                        <label className="text-xs">
                          Designation
                          <input name="designation" defaultValue={s.designation ?? ""} className="block w-full border border-line px-2 py-1 bg-white" />
                        </label>
                        <label className="text-xs">
                          Phone
                          <input name="phone" defaultValue={s.phone ?? ""} className="block w-full border border-line px-2 py-1 bg-white" />
                        </label>
                        <label className="text-xs">
                          Category
                          <select name="category" defaultValue={s.category} className="block w-full border border-line px-2 py-1 bg-white">
                            <option value="TEACHING">Teaching</option>
                            <option value="NON_TEACHING">Non-teaching</option>
                          </select>
                        </label>
                        <label className="text-xs">
                          Role
                          <select name="role" defaultValue={s.role} className="block w-full border border-line px-2 py-1 bg-white">
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs">
                          Monthly salary
                          <input name="monthlySalary" type="number" min={0} step="0.01" defaultValue={s.monthlySalary ?? ""} className="block w-full border border-line px-2 py-1 bg-white" />
                        </label>
                        <label className="text-xs">
                          Status
                          <select name="isActive" defaultValue={s.isActive ? "true" : "false"} className="block w-full border border-line px-2 py-1 bg-white">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </label>
                        <div className="col-span-2 md:col-span-4">
                          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
                            {busy ? "Saving…" : "Save staff"}
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
