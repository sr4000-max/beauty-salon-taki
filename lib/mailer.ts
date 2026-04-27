import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (cached !== undefined) return cached;
  const host = process.env.SMTP_HOST;
  if (!host) {
    cached = null;
    return null;
  }
  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
  return cached;
}

export type MailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail({ to, subject, text }: MailInput): Promise<void> {
  if (!to) return;
  const t = getTransport();
  const from = process.env.SMTP_FROM ?? "no-reply@example.com";
  if (!t) {
    console.log("[mail:console]", { from, to, subject });
    console.log(text);
    return;
  }
  try {
    await t.sendMail({ from, to, subject, text });
    console.log("[mail:sent]", { to, subject });
  } catch (err) {
    console.error("[mail:error]", err);
  }
}

export type MailMenu = {
  name: string;
  priceYen: number;
  durationMinutes: number;
};

export type ReservationMailInput = {
  customerName: string;
  customerEmail: string | null;
  adminEmail: string | null;
  storeName: string;
  storePhone: string | null;
  menus: MailMenu[];
  totalPrice: number;
  totalDuration: number;
  staffName: string | null;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  cancelUrl: string | null;
};

function fmtDate(d: Date): string {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function menuLines(menus: MailMenu[]): string {
  return menus
    .map(
      (m) =>
        `  ・${m.name}（${m.durationMinutes}分 / ¥${m.priceYen.toLocaleString()}）`,
    )
    .join("\n");
}

export async function sendReservationEmails(
  input: ReservationMailInput,
): Promise<void> {
  const {
    customerName,
    customerEmail,
    adminEmail,
    storeName,
    storePhone,
    menus,
    totalPrice,
    totalDuration,
    staffName,
    startAt,
    endAt,
    notes,
    cancelUrl,
  } = input;

  const dateLine = `${fmtDate(startAt)} 〜 ${fmtHm(endAt)}`;
  const menuList = menuLines(menus);
  const cancelBlock = cancelUrl
    ? `\nご予約のキャンセルは以下のURLから可能です（24時間受付）:\n${cancelUrl}\n`
    : "";

  const customerBody = `${customerName} 様

このたびは${storeName}にご予約いただき、誠にありがとうございます。
以下の内容でご予約を承りました。

----------------------------------------
■ ご予約内容
日時: ${dateLine}
担当: ${staffName ?? "—"}

メニュー（${menus.length}件）:
${menuList}

合計: ¥${totalPrice.toLocaleString()}（税込） / 約${totalDuration}分
${notes ? `\nご要望: ${notes}\n` : ""}----------------------------------------
${cancelBlock}
ご来店をお待ちしております。

${storeName}${storePhone ? "\nTEL: " + storePhone : ""}
`;

  const adminBody = `新規予約が入りました。

----------------------------------------
日時: ${dateLine}
お客様: ${customerName}
担当: ${staffName ?? "—"}

メニュー（${menus.length}件）:
${menuList}

合計: ¥${totalPrice.toLocaleString()} / 約${totalDuration}分
${notes ? `\nご要望: ${notes}\n` : ""}----------------------------------------
`;

  await Promise.all([
    customerEmail
      ? sendMail({
          to: customerEmail,
          subject: `【${storeName}】ご予約ありがとうございます`,
          text: customerBody,
        })
      : Promise.resolve(),
    adminEmail
      ? sendMail({
          to: adminEmail,
          subject: `【予約通知】${customerName} 様 - ${dateLine}`,
          text: adminBody,
        })
      : Promise.resolve(),
  ]);
}

export type CancellationMailInput = Omit<ReservationMailInput, "notes" | "cancelUrl">;

export async function sendCancellationEmails(
  input: CancellationMailInput,
): Promise<void> {
  const {
    customerName,
    customerEmail,
    adminEmail,
    storeName,
    storePhone,
    menus,
    totalPrice,
    totalDuration,
    staffName,
    startAt,
    endAt,
  } = input;

  const dateLine = `${fmtDate(startAt)} 〜 ${fmtHm(endAt)}`;
  const menuList = menuLines(menus);

  const customerBody = `${customerName} 様

下記のご予約をキャンセルいたしました。

----------------------------------------
日時: ${dateLine}
担当: ${staffName ?? "—"}

メニュー（${menus.length}件）:
${menuList}

合計: ¥${totalPrice.toLocaleString()} / 約${totalDuration}分
----------------------------------------

またのご利用をお待ちしております。

${storeName}${storePhone ? "\nTEL: " + storePhone : ""}
`;

  const adminBody = `予約がキャンセルされました（お客様による自己キャンセル）。

----------------------------------------
日時: ${dateLine}
お客様: ${customerName}
担当: ${staffName ?? "—"}

メニュー（${menus.length}件）:
${menuList}

合計: ¥${totalPrice.toLocaleString()} / 約${totalDuration}分
----------------------------------------
`;

  await Promise.all([
    customerEmail
      ? sendMail({
          to: customerEmail,
          subject: `【${storeName}】ご予約キャンセルのお知らせ`,
          text: customerBody,
        })
      : Promise.resolve(),
    adminEmail
      ? sendMail({
          to: adminEmail,
          subject: `【キャンセル通知】${customerName} 様 - ${dateLine}`,
          text: adminBody,
        })
      : Promise.resolve(),
  ]);
}
