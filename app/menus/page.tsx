import { prisma } from "@/lib/prisma";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { MenuSelector, type CategoryGroup } from "./MenuSelector";

export const metadata = {
  title: "MENU｜Beauty Salon TAKI",
};

const CATEGORY_EN: Record<string, string> = {
  カット: "Cut",
  カラー: "Color",
  パーマ: "Perm",
  ケア: "Care",
  アイラッシュ: "Eyelash",
};

export default async function MenusPage() {
  const [categories, uncategorized] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        menus: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
    }),
    prisma.menu.findMany({
      where: { active: true, categoryId: null },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  const groups: CategoryGroup[] = [
    ...categories
      .filter((c) => c.menus.length > 0)
      .map((c) => ({
        name: c.name,
        en: CATEGORY_EN[c.name] ?? c.name,
        menus: c.menus.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          priceYen: m.priceYen,
          durationMinutes: m.durationMinutes,
        })),
      })),
  ];
  if (uncategorized.length > 0) {
    groups.push({
      name: "その他",
      en: "Other",
      menus: uncategorized.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        priceYen: m.priceYen,
        durationMinutes: m.durationMinutes,
      })),
    });
  }

  return (
    <>
      <SiteHeader active="menu" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Menu</p>
          <h1 className="page-title">メニュー・料金</h1>
          <p className="page-desc">
            ご希望のメニューを選択（複数可）してから、日時を選んでください。
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          <MenuSelector groups={groups} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
