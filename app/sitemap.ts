import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://www.takibs.com";

export const revalidate = 3600; // 1 時間キャッシュ

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/menus`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // 個別メニューページ (active のみ)
  try {
    const menus = await prisma.menu.findMany({
      where: { active: true },
      select: { id: true },
    });
    const menuUrls: MetadataRoute.Sitemap = menus.map((m) => ({
      url: `${BASE}/reserve/${m.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    return [...staticUrls, ...menuUrls];
  } catch {
    // ビルド中で DB 未接続の場合でも sitemap 生成は継続
    return staticUrls;
  }
}
