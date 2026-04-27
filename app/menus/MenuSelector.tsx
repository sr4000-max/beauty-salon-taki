"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type MenuRow = {
  id: number;
  name: string;
  description: string | null;
  priceYen: number;
  durationMinutes: number;
};

export type CategoryGroup = {
  name: string;
  en: string;
  menus: MenuRow[];
};

export function MenuSelector({ groups }: { groups: CategoryGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const allMenus = groups.flatMap((g) => g.menus);
  const selectedMenus = allMenus.filter((m) => selected.has(m.id));
  const totalPrice = selectedMenus.reduce((s, m) => s + m.priceYen, 0);
  const totalDuration = selectedMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleOpen(name: string) {
    setOpen((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function proceed() {
    if (selected.size === 0) return;
    const ids = [...selected];
    const primary = ids[0];
    const addons = ids.slice(1);
    const url =
      `/reserve/${primary}` +
      (addons.length ? `?addons=${addons.join(",")}` : "");
    router.push(url);
  }

  return (
    <>
      {/* 上部に sticky で常に見えるサマリーバー */}
      <div
        className="sticky z-30 bg-[color:var(--color-bg)]/95 backdrop-blur-sm border border-[var(--color-line)] rounded-sm shadow-sm py-3 px-4 mb-5 flex items-center gap-3 flex-wrap"
        style={{ top: "84px" }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[color:var(--color-text-light)]">
            {selected.size === 0
              ? "メニューを選択してください（複数選択可）"
              : `${selected.size}件選択中`}
          </div>
          {selected.size > 0 && (
            <div className="font-[var(--font-jp-serif)] text-base mt-0.5">
              合計 ¥{totalPrice.toLocaleString()}
              <span className="text-xs text-[color:var(--color-text-light)] ml-2">
                / 約{totalDuration}分
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={proceed}
          disabled={selected.size === 0}
          className="btn-primary"
          style={{ padding: "12px 28px" }}
        >
          日時を選ぶ →
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="menu-note">現在予約可能なメニューがありません。</p>
      ) : (
        <div className="space-y-4 mb-8">
          {groups.map((g) => {
            const isOpen = open[g.name] ?? false;
            const groupSelectedCount = g.menus.filter((m) =>
              selected.has(m.id),
            ).length;
            return (
              <div
                key={g.name}
                className="bg-white border border-[var(--color-line)] rounded-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(g.name)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[color:var(--color-bg-alt)] transition text-left"
                >
                  <div>
                    <div className="font-[var(--font-en)] text-2xl tracking-[0.15em] text-[color:var(--color-accent)]">
                      {g.en}
                    </div>
                    <div className="text-xs tracking-[0.2em] text-[color:var(--color-text-light)] mt-0.5">
                      {g.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {groupSelectedCount > 0 && (
                      <span className="text-xs text-white bg-[color:var(--color-accent)] px-2 py-0.5 rounded-sm">
                        {groupSelectedCount}件選択中
                      </span>
                    )}
                    <span
                      className={`text-[color:var(--color-accent)] transition-transform inline-block ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <ul className="border-t border-[var(--color-line)]">
                    {g.menus.map((m) => {
                      const checked = selected.has(m.id);
                      return (
                        <li
                          key={m.id}
                          className={`border-b border-dashed border-[var(--color-line)] last:border-b-0 ${checked ? "bg-[color:var(--color-bg-alt)]" : ""}`}
                        >
                          <label className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-[color:var(--color-bg-alt)]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(m.id)}
                              className="mt-1.5 w-4 h-4 accent-[color:var(--color-accent)]"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                  <h3 className="font-[var(--font-jp-serif)] font-medium">
                                    {m.name}{" "}
                                    <span className="duration">
                                      {m.durationMinutes}分
                                    </span>
                                  </h3>
                                  {m.description && (
                                    <p className="text-xs text-[color:var(--color-text-light)] mt-1 leading-relaxed">
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                                <div className="font-[var(--font-jp-serif)] text-lg text-[color:var(--color-accent)] whitespace-nowrap">
                                  ¥{m.priceYen.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="menu-note">
        ※ 表示価格はすべて税込です。<br />
        ※ 表示の施術時間は目安です。髪の長さや状態により前後する場合がございます。<br />
        ※ メニューについてご不明な点は、お気軽にお問い合わせください。<br />
        ※ TEL：
        <a href="tel:0996-22-4342" style={{ color: "#8a7860" }}>
          0996-22-4342
        </a>
      </p>

      <div className="text-center text-xs text-[color:var(--color-text-light)] mt-4">
        <Link href="/" className="hover:underline">
          ← トップへ戻る
        </Link>
      </div>
    </>
  );
}
