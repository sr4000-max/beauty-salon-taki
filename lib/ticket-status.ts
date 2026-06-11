/**
 * 回数券のステータス判定（共通ロジック）。
 * - usedUp: 残数 0
 * - expired: 有効期限切れ（残数あっても無効）
 * - active: 通常
 */
export type TicketStatus = "active" | "expired" | "usedUp";

export function getTicketStatus(t: {
  totalCount: number;
  usedCount: number;
  expiresAt: Date | null;
}): TicketStatus {
  if (t.usedCount >= t.totalCount) return "usedUp";
  if (t.expiresAt && t.expiresAt.getTime() < Date.now()) return "expired";
  return "active";
}

/**
 * 期限まで残り日数。
 * - 過去 → 負の数
 * - 期限なし → null
 */
export function daysUntilExpiry(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const ms = expiresAt.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  active: "有効",
  expired: "期限切れ",
  usedUp: "使い切り",
};
