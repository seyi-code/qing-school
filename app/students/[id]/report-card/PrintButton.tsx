"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-navy text-paper text-sm font-medium px-4 py-2 hover:bg-navy-light shadow-sm"
    >
      Print / Save PDF
    </button>
  );
}
