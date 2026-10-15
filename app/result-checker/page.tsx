"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { SCHOOL } from "@/lib/school-config";

type ScoreRow = { subject: string; total: number | string; grade?: string | null };

export default function ResultCheckerPage() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    student: { name: string; admissionNumber: string };
    scores: ScoreRow[];
  } | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/result-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionNumber, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load result");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1e2e43]">
      <MarketingNav />
      <div className="max-w-md mx-auto px-4 py-10">
        <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">Results</p>
        <h1 className="font-serif text-3xl text-[#12345a] mt-1 mb-2">Result checker</h1>
        <p className="text-sm text-[#627184] mb-6">
          Enter the admission number and PIN issued by the school office.
        </p>

        <form
          onSubmit={check}
          className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-3 shadow-sm"
        >
          <input
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            placeholder="Admission number"
            required
            autoComplete="off"
            className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
          />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            required
            autoComplete="off"
            className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
          />
          {error && <p className="text-sm text-brick">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#12345a] text-white py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Checking..." : "Check Result"}
          </button>
        </form>

        {result && (
          <div className="bg-white border border-[#e3e8ed] rounded-2xl p-5 mt-4 report-card-print shadow-sm">
            <div className="no-print mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="text-sm border border-[#12345a] text-[#12345a] px-3 py-1.5 rounded-lg"
              >
                Print
              </button>
            </div>
            <h2 className="font-serif text-lg mb-1">{result.student.name}</h2>
            <p className="text-xs font-mono text-[#627184] mb-3">{result.student.admissionNumber}</p>
            <div className="overflow-x-auto -mx-1">
              <table className="ledger min-w-[280px] w-full">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scores.map((s, i) => (
                    <tr key={i}>
                      <td>{s.subject}</td>
                      <td>{s.total}</td>
                      <td>{s.grade ?? "-"}</td>
                    </tr>
                  ))}
                  {result.scores.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-[#627184] py-4">
                        No scores published for this term yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#627184] mt-4 text-center">
              {SCHOOL.shortName} · Official result checker
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
