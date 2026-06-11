"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export function TicketQR({
  url,
  size = 220,
}: {
  url: string;
  size?: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 border border-stone-200 rounded">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          marginSize={0}
        />
      </div>
      <button
        type="button"
        onClick={copyUrl}
        className="mt-3 text-xs text-stone-600 hover:text-stone-900 underline"
      >
        {copied ? "✓ URL をコピーしました" : "URL をコピー"}
      </button>
      <p className="mt-1 text-xs text-stone-400 font-mono break-all max-w-xs text-center">
        {url}
      </p>
    </div>
  );
}
