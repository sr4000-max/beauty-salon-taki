/**
 * このアプリは日本国内サロン専用。すべての時刻表現は JST (UTC+9) として扱う。
 *
 * Vercel のサーバランタイムは UTC で動くため、`new Date(y, m, d)` や `.getHours()`
 * のような local time API をそのまま使うと、サーバが UTC か JST かで挙動が変わる。
 * その差を完全に隠蔽するため、ここでは Date を「絶対時刻 (epoch ms)」として扱い、
 * 表示・組み立ては必ず明示的に JST オフセットを掛けるユーティリティを通す。
 *
 * - `combineDateAndMin('2026-05-19', 600)` → 2026-05-19 10:00 JST の UTC instant
 * - `getJstHour(d)` → そのDateを JST に変換した時の hour (0-23)
 * - サーバが UTC でも JST でも同じ結果になる
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStrToMin(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Date を JST に変換したときの構成要素を取り出す。
 * Date 自体は絶対時刻なので「変換」は単に UTC + 9h を見るだけ。
 */
function jstParts(d: Date) {
  const shifted = new Date(d.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

export function getJstYear(d: Date): number {
  return jstParts(d).year;
}
export function getJstMonth(d: Date): number {
  return jstParts(d).month;
}
export function getJstDate(d: Date): number {
  return jstParts(d).day;
}
export function getJstHour(d: Date): number {
  return jstParts(d).hour;
}
export function getJstMinute(d: Date): number {
  return jstParts(d).minute;
}
export function getJstDayOfWeek(d: Date): number {
  return jstParts(d).dayOfWeek;
}
export function getJstHm(d: Date): string {
  const p = jstParts(d);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Date → "YYYY-MM-DD" (JST) */
export function dateToYmd(d: Date): string {
  const p = jstParts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * "YYYY-MM-DD" を「JST の その日 00:00」として解釈し、対応する UTC 瞬間を返す。
 * 例: "2026-05-19" → 2026-05-18T15:00:00.000Z (= JST 2026-05-19 00:00)
 */
export function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - JST_OFFSET_MS);
}

/**
 * "YYYY-MM-DD" + 「JST の min 分」→ 対応する UTC 瞬間。
 * 例: ("2026-05-19", 600) → 2026-05-19T01:00:00.000Z (= JST 10:00)
 */
export function combineDateAndMin(ymd: string, min: number): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, min) - JST_OFFSET_MS);
}

export const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatJpDate(d: Date): string {
  const p = jstParts(d);
  return `${p.month}/${p.day}(${DOW_LABELS[p.dayOfWeek]})`;
}

export function formatJpDateLong(d: Date): string {
  const p = jstParts(d);
  return `${p.year}年${p.month}月${p.day}日(${DOW_LABELS[p.dayOfWeek]})`;
}

/**
 * Date に n 日加算 (絶対時刻として 24h * n を加算)。
 * 夏時間 (DST) のある国では正確でないが、日本に DST はないので問題なし。
 */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}

/**
 * Date の JST における 00:00 を返す。
 * 例: d = 2026-05-19T05:00Z (JST 14:00) → 2026-05-18T15:00Z (JST 2026-05-19 00:00)
 */
export function startOfDay(d: Date): Date {
  return ymdToDate(dateToYmd(d));
}
