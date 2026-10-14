"use client";

import { useRouter } from "next/navigation";

export function ArmPicker({
  arms,
  selectedArmId,
  date,
}: {
  arms: { id: string; label: string }[];
  selectedArmId?: string;
  /** ISO date (YYYY-MM-DD) — kept when switching class */
  date?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedArmId ?? ""}
      onChange={(e) => {
        const id = e.target.value;
        const q = new URLSearchParams();
        if (id) q.set("armId", id);
        if (date) q.set("date", date);
        router.push(q.toString() ? `/attendance?${q}` : "/attendance");
      }}
      className="border border-line px-3 py-2 text-sm bg-white"
    >
      {arms.length === 0 && <option value="">No classes</option>}
      {arms.map((a) => (
        <option key={a.id} value={a.id}>
          {a.label}
        </option>
      ))}
    </select>
  );
}
