"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary px-4 py-2 text-sm">
      Print / Save PDF
    </button>
  );
}
