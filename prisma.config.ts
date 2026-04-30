// Prisma の設定。マイグレーション用には Pooler ではなく直結 URL（DIRECT_URL）が必要。
// Supabase の場合:
//   DATABASE_URL  = Transaction Pooler (port 6543, pgbouncer=true) — アプリ実行用
//   DIRECT_URL    = Session Pooler or Direct (port 5432)            — db push / migrate 用
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
