"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

type Props = {
  customerName: string;
  treatment: string;
  totalCount: number;
  expiresLabel: string | null;
  storePhone: string | null;
  customerUrl: string;
  ticketId: number;
};

export function TicketPdfClient(props: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    "preparing" | "ready" | "generating" | "downloaded" | "error"
  >("preparing");
  const [errorMsg, setErrorMsg] = useState("");
  const triggeredRef = useRef(false);

  async function generateAndDownload() {
    if (!cardRef.current) return;
    setStatus("generating");
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // 高解像度でキャプチャ (印刷品質向け)
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      // A6 縦 (105 x 148 mm)
      const pdf = new jsPDF({
        unit: "mm",
        format: "a6",
        orientation: "portrait",
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, 105, 148, undefined, "FAST");
      pdf.save(`回数券_${props.customerName}_${props.ticketId}.pdf`);
      setStatus("downloaded");
    } catch (e) {
      console.error("PDF generation error", e);
      setErrorMsg(e instanceof Error ? e.message : "unknown");
      setStatus("error");
    }
  }

  // 初回マウント時に DOM 描画完了を待ってから自動ダウンロード
  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    // フォント・QR の描画完了を少し待つ
    const t = setTimeout(() => {
      setStatus("ready");
      void generateAndDownload();
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-stone-50 min-h-screen p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-4 bg-white border border-stone-200 rounded p-4 text-center text-sm">
          {status === "preparing" && "プレビューを生成中..."}
          {status === "generating" && "PDF を生成中..."}
          {status === "ready" && "ダウンロードを開始します..."}
          {status === "downloaded" && (
            <>
              <p className="text-emerald-700 font-medium mb-2">
                ✓ PDF をダウンロードしました
              </p>
              <button
                type="button"
                onClick={generateAndDownload}
                className="text-xs text-stone-600 underline mr-3"
              >
                再ダウンロード
              </button>
              <a
                href={`/admin/tickets/${props.ticketId}`}
                className="text-xs text-stone-600 underline"
              >
                ← 詳細に戻る
              </a>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-red-700 mb-2">PDF 生成エラー: {errorMsg}</p>
              <button
                type="button"
                onClick={generateAndDownload}
                className="text-xs text-stone-600 underline"
              >
                再試行
              </button>
            </>
          )}
        </div>

        {/* キャプチャ対象のカード (画面にもプレビューとして表示) */}
        <div className="bg-white shadow-md mx-auto" style={{ width: "315px" }}>
          <div ref={cardRef} style={cardStyle}>
            <header style={{ textAlign: "center" }}>
              <div style={headerEnStyle}>Beauty Salon TAKI</div>
              <div style={headerJpStyle}>ビューティーサロンたき</div>
            </header>

            <div style={{ textAlign: "center", marginTop: "8mm" }}>
              <div style={customerStyle}>{props.customerName} 様</div>
              <div style={treatmentStyle}>{props.treatment}</div>
              <div style={countInfoStyle}>
                {props.totalCount} 回コース
                {props.expiresLabel && (
                  <>
                    <br />
                    有効期限 {props.expiresLabel}
                  </>
                )}
              </div>
            </div>

            <div style={qrWrapStyle}>
              <div style={qrBoxStyle}>
                <QRCodeSVG
                  value={props.customerUrl}
                  size={170}
                  level="M"
                  marginSize={0}
                />
              </div>
            </div>

            <div style={footerStyle}>
              このQRコードで残数確認ができます
              {props.storePhone && (
                <>
                  <br />
                  TEL: {props.storePhone}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// インラインスタイル (CSS変数を使わず、html-to-image でキャプチャしやすくする)
const cardStyle: React.CSSProperties = {
  width: "315px",
  height: "444px",
  padding: "16px 14px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  fontFamily:
    '"Hiragino Kaku Gothic ProN", "Yu Gothic", system-ui, sans-serif',
  color: "#2d2620",
  background: "#ffffff",
};
const headerEnStyle: React.CSSProperties = {
  fontFamily: '"Cormorant Garamond", serif',
  fontSize: "22px",
  fontWeight: 500,
  letterSpacing: "0.1em",
  color: "#8a7860",
  marginBottom: "2mm",
};
const headerJpStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#8a7860",
  letterSpacing: "0.2em",
};
const customerStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 500,
  marginBottom: "2mm",
};
const treatmentStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b5f55",
  marginBottom: "3mm",
};
const countInfoStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#555",
  lineHeight: 1.6,
};
const qrWrapStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};
const qrBoxStyle: React.CSSProperties = {
  padding: "6px",
  border: "1px solid #eee",
  background: "#fff",
};
const footerStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#888",
  lineHeight: 1.6,
  textAlign: "center",
};
