"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "PRESENT" | "ABSENT" | "LATE";

export function AttendanceForm({
  armId,
  date,
  students,
  alreadySaved = false,
}: {
  armId: string;
  date: string;
  students: { id: string; name: string; status: Status }[];
  alreadySaved?: boolean;
}) {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, Status>>(
    Object.fromEntries(students.map((s) => [s.id, s.status]))
  );
  const [notifyParents, setNotifyParents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        armId,
        date,
        notifyParents,
        marks: students.map((s) => ({ studentId: s.id, status: marks[s.id] })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setOk(false);
      setMsg(data.error || "Save failed");
      return;
    }
    setOk(true);
    const absent = data.absent ?? 0;
    const sms = data.smsSent ?? 0;
    const skip = data.smsSkipped ?? 0;
    setMsg(
      notifyParents && absent > 0
        ? `Saved. ${absent} absent. Parent SMS: ${sms} sent, ${skip} skipped (no phone / failed).`
        : `Saved for ${date}.`
    );
    router.refresh();
  }

  function markAll(status: Status) {
    setMarks(Object.fromEntries(students.map((s) => [s.id, status])));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <button
          type="button"
          onClick={() => markAll("PRESENT")}
          className="border border-line px-3 py-1.5 hover:bg-navy/5"
        >
          Mark all present
        </button>
        <label className="flex items-center gap-2 text-xs text-ink/70 ml-auto">
          <input
            type="checkbox"
            checked={notifyParents}
            onChange={(e) => setNotifyParents(e.target.checked)}
          />
          SMS parents of absent students
        </label>
      </div>

      <div className="overflow-x-auto border border-line rounded-lg">
        <table className="ledger text-sm w-full">
          <thead>
            <tr>
              <th className="text-left">Student</th>
              <th className="text-center">Present</th>
              <th className="text-center">Late</th>
              <th className="text-center">Absent</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                {(["PRESENT", "LATE", "ABSENT"] as Status[]).map((st) => (
                  <td key={st} className="text-center">
                    <input
                      type="radio"
                      name={`att-${s.id}`}
                      checked={marks[s.id] === st}
                      onChange={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                      aria-label={`${s.name} ${st}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving || students.length === 0}
          onClick={handleSave}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save attendance"}
        </button>
        {msg && (
          <span className={`text-sm ${ok ? "text-sage" : "text-brick"}`}>{msg}</span>
        )}
        {alreadySaved && !msg && (
          <span className="text-xs text-ink/50">Previously saved for this date — saving again overwrites.</span>
        )}
      </div>
    </div>
  );
}
