/**
 * サーバ側の TZ / 現在時刻を確認する診断エンドポイント。
 * 認証なし (機密情報を返さない)。本番運用後は不要なら削除して良い。
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const tzEnv = process.env.TZ ?? "(unset)";
  const intlTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hours = now.getHours(); // server's local hour
  const utcHours = now.getUTCHours();
  return NextResponse.json({
    now_iso_utc: now.toISOString(),
    now_local_string: now.toString(),
    process_env_TZ: tzEnv,
    intl_resolved_timezone: intlTz,
    server_local_hour: hours,
    server_utc_hour: utcHours,
    delta_hours: hours - utcHours,
    interpretation:
      hours - utcHours === 9 || hours - utcHours === -15
        ? "✓ Server is running in JST (Asia/Tokyo)"
        : `✗ Server is NOT in JST (delta=${hours - utcHours}h). Set TZ=Asia/Tokyo in Vercel env vars.`,
  });
}
