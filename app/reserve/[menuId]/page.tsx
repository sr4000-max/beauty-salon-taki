import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeAvailabilityRange, parseMenuIds } from "@/lib/availability";
import {
  addDays,
  dateToYmd,
  formatJpDate,
  minToTimeStr,
  startOfDay,
} from "@/lib/time";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = { title: "日時を選ぶ｜Beauty Salon TAKI" };

const STATUS_SYMBOL: Record<string, { sym: string; cls: string }> = {
  available: { sym: "○", cls: "text-[color:var(--color-accent)]" },
  full: { sym: "×", cls: "text-stone-400" },
  past: { sym: "", cls: "text-stone-300" },
  closed: { sym: "", cls: "text-stone-300" },
};

const DAYS_TO_SHOW = 14;

export default async function ReservePage({
  params,
  searchParams,
}: {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{
    date?: string;
    staff?: string;
    offset?: string;
    addons?: string;
  }>;
}) {
  const { menuId } = await params;
  const sp = await searchParams;

  const primaryId = Number(menuId);
  const addonIds = parseMenuIds(sp.addons);
  const menuIds = [primaryId, ...addonIds.filter((n) => n !== primaryId)];

  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds }, active: true },
  });
  if (menus.length === 0 || !menus.find((m) => m.id === primaryId)) notFound();

  // sort menus to match the order of menuIds
  const orderedMenus = menuIds
    .map((id) => menus.find((m) => m.id === id))
    .filter((m): m is (typeof menus)[number] => !!m);

  const totalDuration = orderedMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );
  const totalPrice = orderedMenus.reduce((s, m) => s + m.priceYen, 0);
  const addonQuery = addonIds.length ? `&addons=${addonIds.join(",")}` : "";
  const addonPath = addonIds.length ? `?addons=${addonIds.join(",")}` : "";

  const allStaff = await prisma.staff.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const staffParam = sp.staff ?? "any";
  const selectedStaffId =
    staffParam === "any" ? null : Number(staffParam) || null;

  const today = startOfDay(new Date());
  const offset = Math.max(0, Number(sp.offset ?? 0));
  const startDate = addDays(today, offset);
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) =>
    addDays(startDate, i),
  );

  const availabilities = await computeAvailabilityRange({
    startDate: dateToYmd(dates[0]),
    numDays: DAYS_TO_SHOW,
    menuIds,
    staffId: selectedStaffId,
  });

  const allTimeSlots = collectAllSlots(availabilities);

  return (
    <>
      <SiteHeader active="reservation" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Reservation</p>
          <h1 className="page-title">日時を選ぶ</h1>
          <p className="page-desc">ご希望の日時を選択してください。</p>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          <div className="bg-white border border-[var(--color-line)] rounded-sm p-5 mb-6">
            <p className="text-xs tracking-widest text-[color:var(--color-accent)] mb-2">
              選択中メニュー（{orderedMenus.length}件）
            </p>
            <ul className="space-y-1.5 mb-3">
              {orderedMenus.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-baseline text-sm"
                >
                  <span className="font-[var(--font-jp-serif)]">
                    {m.name}{" "}
                    <span className="text-xs text-[color:var(--color-text-light)] ml-1">
                      {m.durationMinutes}分
                    </span>
                  </span>
                  <span className="text-[color:var(--color-text-light)]">
                    ¥{m.priceYen.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-dashed border-[var(--color-line)] pt-2 flex justify-between font-[var(--font-jp-serif)]">
              <span>合計</span>
              <span>
                ¥{totalPrice.toLocaleString()}{" "}
                <span className="text-xs text-[color:var(--color-text-light)] ml-2">
                  / 約{totalDuration}分
                </span>
              </span>
            </div>
            <Link
              href="/menus"
              className="inline-block mt-3 text-xs text-[color:var(--color-accent)] hover:underline"
            >
              ← メニューを選び直す
            </Link>
          </div>

          {allStaff.length > 1 && (
            <div className="bg-white border border-[var(--color-line)] rounded-sm p-4 mb-4">
              <h3 className="text-xs tracking-widest mb-2 text-[color:var(--color-accent)]">
                STAFF / 担当
              </h3>
              <div className="flex gap-2 flex-wrap">
                <StaffPill
                  primaryId={primaryId}
                  addonPath={addonPath}
                  staffParam="any"
                  currentStaffParam={staffParam}
                  label="指名なし"
                  offset={offset}
                  addonQuery={addonQuery}
                />
                {allStaff.map((s) => (
                  <StaffPill
                    key={s.id}
                    primaryId={primaryId}
                    addonPath={addonPath}
                    staffParam={String(s.id)}
                    currentStaffParam={staffParam}
                    label={s.name}
                    color={s.color}
                    offset={offset}
                    addonQuery={addonQuery}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[var(--color-line)] rounded-sm p-3 mb-4 flex items-center gap-2 text-sm flex-wrap">
            <PaginationButton
              primaryId={primaryId}
              addonQuery={addonQuery}
              staffParam={staffParam}
              offset={Math.max(0, offset - DAYS_TO_SHOW)}
              disabled={offset === 0}
              label="← 前の2週間"
            />
            <span className="text-[color:var(--color-text-light)] text-xs">
              {formatJpDate(dates[0])} 〜 {formatJpDate(dates[dates.length - 1])}
            </span>
            <PaginationButton
              primaryId={primaryId}
              addonQuery={addonQuery}
              staffParam={staffParam}
              offset={offset + DAYS_TO_SHOW}
              label="次の2週間 →"
            />
            <div className="ml-auto text-xs text-[color:var(--color-text-light)]">
              <span className="text-[color:var(--color-accent)]">○</span> 予約可{" "}
              <span className="text-stone-400">×</span> 満席
            </div>
          </div>

          {allStaff.length === 0 ? (
            <p className="bg-amber-50 border border-amber-200 rounded p-6 text-center text-amber-900">
              スタッフが登録されていないため予約を受け付けられません
            </p>
          ) : allTimeSlots.length === 0 ? (
            <p className="bg-white border border-[var(--color-line)] rounded p-6 text-center text-[color:var(--color-text-light)]">
              この期間に予約可能な時間がありません
            </p>
          ) : (
            <div className="bg-white border border-[var(--color-line)] rounded-sm overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[color:var(--color-bg-alt)] sticky left-0 z-10 px-2 py-2 border-b border-r border-[var(--color-line)] text-xs font-medium text-[color:var(--color-text-light)] w-16">
                      時刻
                    </th>
                    {dates.map((d, i) => {
                      const isClosed = availabilities[i].isClosed;
                      const dow = d.getDay();
                      return (
                        <th
                          key={i}
                          className={`px-1 py-2 border-b border-[var(--color-line)] text-xs font-medium min-w-12 ${
                            dow === 0
                              ? "text-red-600"
                              : dow === 6
                                ? "text-blue-600"
                                : "text-[color:var(--color-text)]"
                          } ${isClosed ? "bg-[color:var(--color-bg-alt)]" : ""}`}
                        >
                          <div className="font-bold">
                            {d.getMonth() + 1}/{d.getDate()}
                          </div>
                          <div className="text-[10px]">
                            ({["日", "月", "火", "水", "木", "金", "土"][dow]})
                          </div>
                          {isClosed && (
                            <div className="text-[10px] text-stone-400 mt-0.5">休</div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {allTimeSlots.map((min) => (
                    <tr key={min}>
                      <th className="bg-[color:var(--color-bg-alt)] sticky left-0 z-10 px-2 py-1.5 border-r border-b border-[var(--color-line)] text-xs font-mono text-[color:var(--color-text-light)]">
                        {minToTimeStr(min)}
                      </th>
                      {dates.map((d, di) => {
                        const av = availabilities[di];
                        const slot = av.slots.find((s) => s.startMin === min);
                        if (av.isClosed || !slot) {
                          return (
                            <td
                              key={di}
                              className="border-b border-[var(--color-line)] bg-[color:var(--color-bg-alt)] text-center"
                            >
                              <span className="text-stone-300">—</span>
                            </td>
                          );
                        }
                        const meta =
                          STATUS_SYMBOL[slot.status] ?? STATUS_SYMBOL.full;
                        const clickable = slot.status === "available";
                        const href = `/reserve/${primaryId}/form?date=${dateToYmd(d)}&start=${min}&staff=${staffParam}${addonQuery}`;
                        return (
                          <td
                            key={di}
                            className="border-b border-[var(--color-line)] text-center p-0"
                          >
                            {clickable ? (
                              <Link
                                href={href}
                                className={`block py-1.5 hover:bg-[color:var(--color-bg-alt)] ${meta.cls} font-bold`}
                              >
                                {meta.sym}
                              </Link>
                            ) : (
                              <span className={`block py-1.5 ${meta.cls}`}>
                                {meta.sym}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[color:var(--color-text-light)] mt-6 leading-relaxed">
            ※ 当日の予約は現在時刻から2時間30分後以降のみ受け付けています。<br />
            ※ お急ぎの方は <a href="tel:0996-22-4342" className="text-[color:var(--color-accent)] underline">0996-22-4342</a> までお電話ください。
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function collectAllSlots(
  avs: { isClosed: boolean; slots: { startMin: number }[] }[],
): number[] {
  const set = new Set<number>();
  for (const av of avs) {
    if (av.isClosed) continue;
    for (const s of av.slots) set.add(s.startMin);
  }
  return [...set].sort((a, b) => a - b);
}

function StaffPill({
  primaryId,
  addonPath,
  staffParam,
  currentStaffParam,
  label,
  color,
  offset,
  addonQuery,
}: {
  primaryId: number;
  addonPath: string;
  staffParam: string;
  currentStaffParam: string;
  label: string;
  color?: string;
  offset: number;
  addonQuery: string;
}) {
  const active = staffParam === currentStaffParam;
  const sep = addonPath ? "&" : "?";
  return (
    <Link
      href={`/reserve/${primaryId}${addonPath}${sep}staff=${staffParam}&offset=${offset}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-sm transition ${
        active
          ? "bg-[color:var(--color-accent)] text-white border-[var(--color-accent)]"
          : "bg-white border-[var(--color-line)] hover:border-[var(--color-accent)] text-[color:var(--color-text)]"
      }`}
    >
      {color && (
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </Link>
  );
}

function PaginationButton({
  primaryId,
  addonQuery,
  staffParam,
  offset,
  disabled,
  label,
}: {
  primaryId: number;
  addonQuery: string;
  staffParam: string;
  offset: number;
  disabled?: boolean;
  label: string;
}) {
  const cls = `px-3 py-1.5 rounded-sm border text-sm ${
    disabled
      ? "border-[var(--color-line)] text-stone-300 pointer-events-none"
      : "border-[var(--color-line)] text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-alt)]"
  }`;
  if (disabled) return <span className={cls}>{label}</span>;
  return (
    <Link
      href={`/reserve/${primaryId}?staff=${staffParam}&offset=${offset}${addonQuery}`}
      className={cls}
    >
      {label}
    </Link>
  );
}
