"use client";

import { useRouter } from "next/navigation";

export function DateNav({
  armId,
  date,
  history,
}: {
  armId?: string;
  date: string;
  /** ISO dates that already have marks for this arm */
  history: { date: string; marked: number; present: number }[];
}) {
  const router = useRouter();

  function go(next: string) {
    const q = new URLSearchParams();
    if (armId) q.set("armId", armId);
    q.set("date", next);
    router.push(`/attendance?${q}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;
  const hist = history.find((h) => h.date === date);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Date</label>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="border border-line px-3 py-2 text-sm bg-white"
        />
        {!isToday && (
          <button
            type="button"
            onClick={() => go(today)}
            className="text-xs border border-navy text-navy px-2.5 py-1.5 hover:bg-navy/5"
          >
            Today
          </button>
        )}
      </div>

      {hist && hist.marked > 0 && (
        <div className="rounded-lg border border-sage/30 bg-sage/10 px-3 py-2 text-sm text-ink">
          <span className="font-medium text-sage-dark">Already marked for this date.</span>{" "}
          {hist.marked} student{hist.marked === 1 ? "" : "s"} · {hist.present} present. You can
          still edit and save to correct mistakes.
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-ink/45 self-center mr-1">Recent:</span>
          {history.slice(0, 10).map((h) => {
            const active = h.date === date;
            return (
              <button
                key={h.date}
                type="button"
                onClick={() => go(h.date)}
                className={`text-[11px] px-2 py-1 rounded-full border tabular-nums ${
                  active
                    ? "border-navy bg-navy text-paper"
                    : "border-line bg-white text-ink/70 hover:border-navy/40"
                }`}
                title={`${h.present} present / ${h.marked} marked`}
              >
                {h.date.slice(5)} · {h.present}/{h.marked}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
