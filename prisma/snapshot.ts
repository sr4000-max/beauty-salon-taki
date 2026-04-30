/**
 * 現在の DATABASE_URL の中身を全部 JSON に書き出して
 * `prisma/data-snapshot.json` に保存する。
 *
 * 用途: DB 移行時 (Neon → Supabase など)。
 *   1. このスクリプトを古い DATABASE_URL に対して実行 → スナップショット保存
 *   2. .env を新しい DATABASE_URL に書き換え
 *   3. `npm run db:push` で新 DB にスキーマを作る
 *   4. `npm run db:seed` がスナップショットを検出して自動的に復元
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Dumping current database to snapshot...");
  const [
    stores,
    businessHours,
    holidays,
    blocks,
    categories,
    staff,
    menus,
    reservations,
    extras,
  ] = await Promise.all([
    prisma.store.findMany(),
    prisma.businessHour.findMany(),
    prisma.holiday.findMany(),
    prisma.block.findMany(),
    prisma.menuCategory.findMany(),
    prisma.staff.findMany(),
    prisma.menu.findMany(),
    prisma.reservation.findMany(),
    prisma.reservationExtraMenu.findMany(),
  ]);

  const snapshot = {
    stores,
    businessHours,
    holidays,
    blocks,
    categories,
    staff,
    menus,
    reservations,
    extras,
    _meta: {
      createdAt: new Date().toISOString(),
      sourceUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":***@"),
    },
  };

  const path = join(process.cwd(), "prisma", "data-snapshot.json");
  writeFileSync(path, JSON.stringify(snapshot, null, 2));
  console.log(
    `Snapshot saved to ${path}\n` +
      `  stores=${stores.length}\n` +
      `  businessHours=${businessHours.length}\n` +
      `  holidays=${holidays.length}\n` +
      `  blocks=${blocks.length}\n` +
      `  categories=${categories.length}\n` +
      `  staff=${staff.length}\n` +
      `  menus=${menus.length}\n` +
      `  reservations=${reservations.length}\n` +
      `  extras=${extras.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
