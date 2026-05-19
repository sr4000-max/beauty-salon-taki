/**
 * カレンダー連携用のヘルパー。
 *
 * - buildGoogleCalendarUrl: クリックすると Google カレンダーが pre-fill された
 *   イベント追加画面で開く URL を生成する (どの端末でもブラウザで動く)。
 * - buildIcsContent: メール添付用 .ics ファイルの本文を組み立てる
 *   (Apple カレンダー / Outlook / Yahoo カレンダー 等にも対応)。
 *
 * 注意: Date は UTC として ICS / Google Calendar に渡し、表示は受信側のタイムゾーンで
 *       行わせる (Z suffix)。サーバの TZ に依存しない。
 */

const pad = (n: number) => String(n).padStart(2, "0");

function formatUtcCompact(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export type CalendarEventInput = {
  title: string;
  startAt: Date;
  endAt: Date;
  description: string;
  location: string;
};

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const dates = `${formatUtcCompact(input.startAt)}/${formatUtcCompact(input.endAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates,
    details: input.description,
    location: input.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// 75 オクテット超の行は CRLF + 半角スペースで折り返す (RFC 5545)
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + (i === 0 ? 75 : 74));
    out.push(i === 0 ? chunk : " " + chunk);
    i += i === 0 ? 75 : 74;
  }
  return out.join("\r\n");
}

export type IcsEventInput = CalendarEventInput & {
  uid: string;
  organizerName?: string;
  organizerEmail?: string;
};

/**
 * 予約 → カレンダーイベント。
 * タイトル: 「サロン名: メニュー1 + メニュー2」
 * 説明文: メニュー一覧 + キャンセル URL
 */
export function buildReservationCalendarEvent(opts: {
  reservationId: number;
  storeName: string;
  storeAddress: string | null;
  storePhone: string | null;
  menuNames: string[];
  startAt: Date;
  endAt: Date;
  cancelUrl: string | null;
}): CalendarEventInput & { uid: string } {
  const title = `${opts.storeName}: ${opts.menuNames.join(" + ")}`;
  const descLines = [
    `メニュー: ${opts.menuNames.join(" / ")}`,
    opts.storePhone ? `TEL: ${opts.storePhone}` : null,
    opts.cancelUrl ? `\nキャンセルはこちら:\n${opts.cancelUrl}` : null,
  ].filter((x): x is string => !!x);
  return {
    title,
    startAt: opts.startAt,
    endAt: opts.endAt,
    description: descLines.join("\n"),
    location: opts.storeAddress ?? opts.storeName,
    uid: `reservation-${opts.reservationId}@beauty-salon-taki`,
  };
}

export function buildIcsContent(input: IcsEventInput): string {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Beauty Salon TAKI//Reservation//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${formatUtcCompact(now)}`,
    `DTSTART:${formatUtcCompact(input.startAt)}`,
    `DTEND:${formatUtcCompact(input.endAt)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    `LOCATION:${escapeIcsText(input.location)}`,
    input.organizerName && input.organizerEmail
      ? `ORGANIZER;CN=${escapeIcsText(input.organizerName)}:mailto:${input.organizerEmail}`
      : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter((x): x is string => !!x)
    .map(foldLine);
  return lines.join("\r\n") + "\r\n";
}
