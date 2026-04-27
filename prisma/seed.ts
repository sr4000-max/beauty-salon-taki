import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const STORE = {
  name: "Beauty Salon TAKI",
  phone: "0996-22-4342",
  address: "〒895-0055 鹿児島県薩摩川内市西開聞町1-11",
};

const HOURS = [
  { dayOfWeek: 0, isClosed: false, openMin: 570, closeMin: 1140 },
  { dayOfWeek: 1, isClosed: true, openMin: 570, closeMin: 1140 },
  { dayOfWeek: 2, isClosed: false, openMin: 570, closeMin: 1140 },
  { dayOfWeek: 3, isClosed: false, openMin: 570, closeMin: 1140 },
  { dayOfWeek: 4, isClosed: false, openMin: 570, closeMin: 1140 },
  { dayOfWeek: 5, isClosed: false, openMin: 570, closeMin: 1140 },
  { dayOfWeek: 6, isClosed: false, openMin: 570, closeMin: 1140 },
];

const CATEGORIES = ["カット", "カラー", "パーマ", "ケア", "アイラッシュ"];

const MENUS = [
  { cat: "カット", name: "カット", desc: "骨格と髪質に合わせた似合わせカット。", price: 3600, dur: 60, sort: 0 },
  { cat: "カット", name: "カット（小学生まで）", desc: "学割メニュー。", price: 1600, dur: 60, sort: 10 },
  { cat: "カット", name: "カット（中学生）", desc: "学割メニュー。", price: 1800, dur: 60, sort: 11 },
  { cat: "カット", name: "カット（高校生）", desc: "学割メニュー。", price: 2000, dur: 60, sort: 12 },
  { cat: "カラー", name: "カラー", desc: "豊富なカラーバリエーションをご用意。", price: 6600, dur: 120, sort: 0 },
  { cat: "カラー", name: "ヘナ100%カラー", desc: "髪と頭皮にやさしい、天然成分100%のヘナカラー。", price: 9600, dur: 120, sort: 1 },
  { cat: "カラー", name: "グレーカラー(白髪染め)", desc: "白髪をしっかりカバー。ヘナをブレンドした処方も可能。", price: 6000, dur: 90, sort: 2 },
  { cat: "パーマ", name: "パーマ", desc: "やわらかな質感に仕上がる定番のパーマ。", price: 7200, dur: 120, sort: 0 },
  { cat: "パーマ", name: "ツイスト・スパイラル", desc: "動きと立体感のある今っぽいパーマ。", price: 8400, dur: 150, sort: 1 },
  { cat: "パーマ", name: "ストレートパーマ", desc: "やわらかなストレートヘアに。", price: 12000, dur: 180, sort: 2 },
  { cat: "パーマ", name: "デジタルパーマ", desc: "持ちが良く、しっかりとしたカールに。", price: 12000, dur: 180, sort: 3 },
  { cat: "ケア", name: "トリートメント(ホームケア付き)", desc: "サロンケア+ご自宅用ケアセット。", price: 3600, dur: 30, sort: 0 },
  { cat: "ケア", name: "髪質改善トリートメント", desc: "髪の内部から補修するこだわりのトリートメント。", price: 4050, dur: 45, sort: 1 },
  { cat: "ケア", name: "シャンプー", desc: "こだわりのシャンプー単品メニュー。", price: 2400, dur: 30, sort: 2 },
  { cat: "ケア", name: "ヘッドスパ(シャンプー込み)", desc: "頭皮環境を整え、リラックスできるスパメニュー。", price: 3600, dur: 60, sort: 3 },
  { cat: "アイラッシュ", name: "まつ毛パーマ", desc: "自まつ毛を活かして自然なカールを。", price: 3600, dur: 45, sort: 0 },
  { cat: "アイラッシュ", name: "まつ毛エクステンション(初回)", desc: "初回導入メニュー。", price: 6000, dur: 90, sort: 1 },
  { cat: "アイラッシュ", name: "まつ毛エクステンション(メンテナンス)", desc: "残っている状態でのリペアメニュー。", price: 4800, dur: 60, sort: 2 },
];

type Snapshot = {
  stores: any[];
  businessHours: any[];
  holidays: any[];
  blocks: any[];
  categories: any[];
  staff: any[];
  menus: any[];
  reservations: any[];
  extras: any[];
};

async function hydrateFromSnapshot(snapshot: Snapshot) {
  console.log("Snapshot detected. Restoring previous SQLite state into PostgreSQL...");

  // Insert in dependency order with explicit IDs preserved.
  for (const s of snapshot.stores) {
    await prisma.store.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        phone: s.phone,
        address: s.address,
        adminEmail: s.adminEmail,
        slotMinutes: s.slotMinutes,
      },
      create: s,
    });
  }
  for (const bh of snapshot.businessHours) {
    await prisma.businessHour.upsert({
      where: { id: bh.id },
      update: bh,
      create: bh,
    });
  }
  for (const h of snapshot.holidays) {
    await prisma.holiday.upsert({
      where: { id: h.id },
      update: { ...h, date: new Date(h.date) },
      create: { ...h, date: new Date(h.date) },
    });
  }
  for (const c of snapshot.categories) {
    await prisma.menuCategory.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  for (const st of snapshot.staff) {
    await prisma.staff.upsert({
      where: { id: st.id },
      update: st,
      create: st,
    });
  }
  for (const m of snapshot.menus) {
    await prisma.menu.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  for (const b of snapshot.blocks) {
    await prisma.block.upsert({
      where: { id: b.id },
      update: { ...b, date: new Date(b.date) },
      create: { ...b, date: new Date(b.date) },
    });
  }
  for (const r of snapshot.reservations) {
    const fixed = {
      ...r,
      startAt: new Date(r.startAt),
      endAt: new Date(r.endAt),
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
    await prisma.reservation.upsert({
      where: { id: r.id },
      update: fixed,
      create: fixed,
    });
  }
  for (const e of snapshot.extras) {
    await prisma.reservationExtraMenu.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    });
  }

  // PostgreSQL のシーケンスを最大 ID + 1 に進める（autoincrement の衝突回避）
  const tables = [
    ["Store", "stores"],
    ["BusinessHour", "businessHours"],
    ["Holiday", "holidays"],
    ["Block", "blocks"],
    ["MenuCategory", "categories"],
    ["Staff", "staff"],
    ["Menu", "menus"],
    ["Reservation", "reservations"],
    ["ReservationExtraMenu", "extras"],
  ] as const;
  for (const [table, key] of tables) {
    const arr = (snapshot as any)[key] as any[];
    if (!arr.length) continue;
    const maxId = Math.max(...arr.map((x) => x.id ?? 0));
    if (maxId > 0) {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), ${maxId})`,
      );
    }
  }

  console.log(
    `Restored: stores=${snapshot.stores.length}, categories=${snapshot.categories.length}, staff=${snapshot.staff.length}, menus=${snapshot.menus.length}, reservations=${snapshot.reservations.length}`,
  );
}

async function seedDefaults() {
  let store = await prisma.store.findFirst({ include: { businessHours: true } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: STORE.name,
        phone: STORE.phone,
        address: STORE.address,
        slotMinutes: 30,
        businessHours: { create: HOURS },
      },
      include: { businessHours: true },
    });
    console.log("Created store:", store.name);
  } else if (store.name === "サロン サンプル" || store.name === "サロン") {
    await prisma.store.update({
      where: { id: store.id },
      data: { name: STORE.name, phone: STORE.phone, address: STORE.address },
    });
    for (const h of HOURS) {
      await prisma.businessHour.upsert({
        where: { storeId_dayOfWeek: { storeId: store.id, dayOfWeek: h.dayOfWeek } },
        update: { isClosed: h.isClosed, openMin: h.openMin, closeMin: h.closeMin },
        create: { storeId: store.id, ...h },
      });
    }
    console.log("Updated existing store to:", STORE.name);
  } else {
    console.log("Store already configured:", store.name);
  }

  if ((await prisma.menuCategory.count()) === 0) {
    for (let i = 0; i < CATEGORIES.length; i++) {
      await prisma.menuCategory.create({
        data: { name: CATEGORIES[i], sortOrder: i },
      });
    }
    console.log("Seeded categories");
  }

  if ((await prisma.staff.count()) === 0) {
    await prisma.staff.create({
      data: {
        name: "スタッフ1",
        color: "#8a7860",
        workDays: "0,2,3,4,5,6",
        sortOrder: 0,
      },
    });
    console.log("Seeded default staff");
  }

  if ((await prisma.menu.count()) === 0) {
    const cats = await prisma.menuCategory.findMany();
    const catByName = new Map(cats.map((c) => [c.name, c.id]));
    for (const m of MENUS) {
      await prisma.menu.create({
        data: {
          name: m.name,
          description: m.desc,
          priceYen: m.price,
          durationMinutes: m.dur,
          sortOrder: m.sort,
          categoryId: catByName.get(m.cat) ?? null,
        },
      });
    }
    console.log(`Seeded ${MENUS.length} menus`);
  }
}

async function main() {
  const snapshotPath = join(__dirname, "data-snapshot.json");
  if (existsSync(snapshotPath)) {
    const empty = (await prisma.store.count()) === 0;
    if (empty) {
      const snapshot = JSON.parse(
        readFileSync(snapshotPath, "utf-8"),
      ) as Snapshot;
      await hydrateFromSnapshot(snapshot);
      return;
    } else {
      console.log("Database already has data, skipping snapshot import.");
      return;
    }
  }
  await seedDefaults();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
