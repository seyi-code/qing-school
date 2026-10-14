"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-[#1a3a6e] text-white text-sm font-medium px-4 py-2 hover:bg-[#0f2748]"
    >
      Print / Save PDF
    </button>
  );
}
