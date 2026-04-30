# 本番デプロイ手順（Supabase + Vercel / 東京リージョン）

このアプリは **Vercel (Tokyo / hnd1)** + **Supabase PostgreSQL (ap-northeast-1)** の構成を想定しています。両方とも東京リージョンに揃えるので、日本国内ユーザーから見たレイテンシは最小化されます。

所要時間の目安: **30〜60 分**

---

## 1. Supabase アカウントの作成と Tokyo プロジェクト作成

### 1-1. アカウント作成

1. https://supabase.com にアクセス
2. 右上の **「Start your project」** をクリック
3. **GitHub アカウント** でサインアップ（推奨）。GitHub を持っていない場合はメール登録も可
4. Organization 作成画面が出たら、組織名（例: `taki`）と Type は **Personal** を選択

### 1-2. 新規プロジェクトの作成

1. ダッシュボードで **「New project」** をクリック
2. 以下を入力:
   - **Name**: `beauty-salon-taki`（任意）
   - **Database Password**: 強固なパスワードを生成（**必ずメモして保存**。後で接続文字列に使う）
   - **Region**: **`Northeast Asia (Tokyo)` を必ず選択** ← ここが重要
   - **Pricing Plan**: `Free`（500MB DB / 月 50,000 MAU まで無料）
3. **「Create new project」** をクリック → DB のプロビジョニングに 1〜2 分かかる

### 1-3. 接続文字列の取得

1. プロジェクト画面の左サイドバーから **「Project Settings」（歯車アイコン）→ 「Database」** を開く
2. **「Connection string」** セクションで以下の 2 つをコピー:

   **(A) Transaction Pooler — DATABASE_URL に設定**
   - 上部のタブから **「Transaction」** を選択
   - 表示される URL（例: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`）をコピー
   - `[YOUR-PASSWORD]` を 1-2 で設定したパスワードに置き換え
   - **末尾に `?pgbouncer=true&connection_limit=1` を付ける**（Prisma 必須）

   **(B) Session Pooler — DIRECT_URL に設定**
   - タブから **「Session」** を選択
   - 表示される URL（例: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`）をコピー
   - 同様にパスワードを置換

---

## 2. ローカルから Supabase にスキーマと初期データを投入

### 2-1. `.env` を編集

`reserve/.env` を以下のように書き換え:

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

ADMIN_PASSWORD="<本番用の強いパスワード>"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="sr4000@gmail.com"
SMTP_PASS="diqgvrswslpqcexj"
SMTP_FROM="Beauty Salon TAKI <sr4000+taki@gmail.com>"
```

### 2-2. スキーマを Supabase に適用

```bash
cd reserve
npm run db:push
```

→ Supabase 上に Store / Menu / Reservation 等のテーブルが作成される。

### 2-3. 既存データの移行（既に Neon にデータがある場合）

`prisma/data-snapshot.json` がある場合、`npm run db:seed` がスナップショットから自動的に復元します。

スナップショットがない / 新規ならデフォルトの店舗・メニュー・スタッフが投入されます:

```bash
npm run db:seed
```

### 2-4. ローカルから動作確認

```bash
npm run dev
```

→ http://localhost:3000 にアクセスして、メニューや予約フローが Supabase 経由で動くことを確認。

---

## 3. GitHub にコードをプッシュ

Vercel は GitHub リポジトリと連携してデプロイするため、まず GitHub に push します。

### 3-1. GitHub リポジトリ作成

1. https://github.com/new で **Private** リポジトリを作成（例: `beauty-salon-taki`）
2. 「README は付けない」で OK

### 3-2. ローカルから push

```bash
cd reserve
git remote add origin git@github.com:YOUR_GITHUB/beauty-salon-taki.git
# または HTTPS の場合: https://github.com/YOUR_GITHUB/beauty-salon-taki.git

git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

`.env` は `.gitignore` で除外されているので、シークレットがコミットされる心配はありません。

---

## 4. Vercel にデプロイ

### 4-1. Vercel アカウント作成

1. https://vercel.com/signup
2. **GitHub アカウント** でサインアップ

### 4-2. プロジェクトのインポート

1. Vercel ダッシュボードで **「Add New」 → 「Project」**
2. GitHub の `beauty-salon-taki` リポジトリを選択し **「Import」**
3. Configure Project 画面で:
   - **Framework Preset**: `Next.js`（自動検出）
   - **Root Directory**: そのまま（リポジトリのルート）
   - **Build Command**: `prisma generate && next build`（vercel.json で定義済みなのでそのまま）

### 4-3. 環境変数を設定

「Environment Variables」セクションで以下を **すべて** 追加:

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase の Transaction Pooler URL（`?pgbouncer=true&connection_limit=1` 付き） |
| `DIRECT_URL` | Supabase の Session Pooler URL |
| `ADMIN_PASSWORD` | 本番用の強いパスワード |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `sr4000@gmail.com` |
| `SMTP_PASS` | `diqgvrswslpqcexj` |
| `SMTP_FROM` | `Beauty Salon TAKI <sr4000+taki@gmail.com>` |

すべて `Production` / `Preview` / `Development` 全環境にチェックを入れる。

### 4-4. デプロイ

1. **「Deploy」** をクリック → 1〜2 分でビルド完了
2. 完了後、`https://beauty-salon-taki-xxxx.vercel.app` のような URL が発行される

→ 開いて動作確認。**`/admin/login`** でログインし、予約データが Supabase に書き込まれることを確認。

---

## 5. 独自ドメインを紐付ける（任意）

### 5-1. ドメインを取得（既に持っているならスキップ）

おすすめ:
- **Cloudflare Registrar**（原価販売、メール無料）
- **お名前.com**（日本語サポート、安価）

### 5-2. Vercel に追加

1. Vercel プロジェクト → **「Settings」 → 「Domains」**
2. 取得したドメイン（例: `beauty-salon-taki.com`）を入力 → 「Add」
3. 表示される DNS レコード（A / CNAME）を、ドメイン管理画面で設定
4. 数分〜数時間で SSL 証明書が自動発行され HTTPS でアクセス可能に

---

## 運用 Tips

### Supabase の自動スリープ対策

Supabase Free プランは **1 週間アクセスがないとプロジェクトが一時停止** します。サロンが稼働している間はアクセスがあるはずですが、念のため:
- 月 1 回のヘルスチェック cron（Vercel cron 等）を設定する
- もしくは Supabase Pro（$25/月）にアップグレード

### 予約データのバックアップ

Supabase ダッシュボード → Database → Backups で日次バックアップを確認。
手動バックアップは `pg_dump` で取得可能。

### 環境変数の更新

Vercel ダッシュボード → Settings → Environment Variables から変更後、再デプロイ（`Redeploy` ボタン）が必要。

---

## トラブルシュート

### "FATAL: Tenant or user not found"
→ Supabase の `DATABASE_URL` のユーザー名が `postgres.プロジェクトref` になっているか確認。`postgres` 単体だと弾かれる。

### "Error: prepared statement does not exist"
→ Pooler 経由のときは `?pgbouncer=true&connection_limit=1` が必須。

### Vercel deploy で `Prisma Client not found`
→ `package.json` の `build` に `prisma generate` が含まれているか確認（既に設定済み）。

### メールが届かない
→ Gmail のアプリパスワードが有効か、迷惑メールフォルダを確認。Vercel の Function Logs（Vercel ダッシュボード → Logs）で `[mail:sent]` か `[mail:error]` が出ているか確認。
