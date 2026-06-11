"use client";

import { useEffect } from "react";

export function PrintAutoTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);
  return null;
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-sm border border-stone-300 px-4 py-2 rounded"
    >
      🖨 印刷ダイアログを開く
    </button>
  );
}
