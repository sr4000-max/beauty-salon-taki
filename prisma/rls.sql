-- Row-Level Security (RLS) 有効化スクリプト
--
-- 背景:
--   Supabase は public スキーマの全テーブルを PostgREST API として自動公開する。
--   RLS が無効だと、anon キーを持つ誰でも全データを読み書きできてしまう
--   (Security Advisor の "RLS Disabled in Public" エラーの原因)。
--
-- このアプリは Prisma で DB に直接接続しており (postgres ロール = テーブル所有者)、
-- PostgREST API は使っていない。そのため RLS を有効化するだけでよく、
-- ポリシーは不要 (API 経由のアクセスは全拒否、アプリの動作には影響なし)。
--
-- 実行方法:
--   Supabase ダッシュボード > SQL Editor に貼り付けて実行。
--   実行後、Advisors > Security > Rerun linter でエラーが消えたことを確認する。
--
-- 注意:
--   新しいテーブルを追加 (prisma migrate / db push) したら、
--   そのテーブルにも同様に enable row level security を実行すること。

alter table public."Store" enable row level security;
alter table public."MenuCategory" enable row level security;
alter table public."Holiday" enable row level security;
alter table public."BusinessHour" enable row level security;
alter table public."Staff" enable row level security;
alter table public."Block" enable row level security;
alter table public."Menu" enable row level security;
alter table public."Reservation" enable row level security;
alter table public."ReservationExtraMenu" enable row level security;

-- 2026-07 追加: 回数券テーブル (customerName / token を含むため特に重要)
alter table public."Ticket" enable row level security;
alter table public."TicketLog" enable row level security;
