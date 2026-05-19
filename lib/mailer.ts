import nodemailer, { type Transporter } from "nodemailer";
import {
  getJstDate,
  getJstDayOfWeek,
  getJstHour,
  getJstMinute,
  getJstMonth,
  getJstYear,
} from "@/lib/time";

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

export type MailAttachment = {
  filename: string;
  content: string;
  contentType: string;
};

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  attachments?: MailAttachment[];
};

export async function sendMail({
  to,
  subject,
  text,
  attachments,
}: MailInput): Promise<void> {
  if (!to) return;
  const t = getTransport();
  const from = process.env.SMTP_FROM ?? "no-reply@example.com";
  if (!t) {
    console.log("[mail:console]", {
      from,
      to,
      subject,
      attachments: attachments?.map((a) => a.filename),
    });
    console.log(text);
    return;
  }
  try {
    await t.sendMail({ from, to, subject, text, attachments });
    console.log("[mail:sent]", {
      to,
      subject,
      attachments: attachments?.map((a) => a.filename),
    });
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
  googleCalendarUrl: string | null;
  icsContent: string | null;
};

function fmtDate(d: Date): string {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${getJstYear(d)}年${getJstMonth(d)}月${getJstDate(d)}日(${days[getJstDayOfWeek(d)]}) ${String(getJstHour(d)).padStart(2, "0")}:${String(getJstMinute(d)).padStart(2, "0")}`;
}

function fmtHm(d: Date): string {
  return `${String(getJstHour(d)).padStart(2, "0")}:${String(getJstMinute(d)).padStart(2, "0")}`;
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
  const calendarBlock = input.googleCalendarUrl
    ? `\nGoogle カレンダーに追加するには下記をクリック:\n${input.googleCalendarUrl}\n` +
      `（このメールに添付の .ics ファイルからは Apple / Outlook など他のカレンダーにも追加できます）\n`
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
${calendarBlock}${cancelBlock}
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

  const customerAttachments: MailAttachment[] | undefined = input.icsContent
    ? [
        {
          filename: "reservation.ics",
          content: input.icsContent,
          contentType: "text/calendar; method=PUBLISH; charset=utf-8",
        },
      ]
    : undefined;

  await Promise.all([
    customerEmail
      ? sendMail({
          to: customerEmail,
          subject: `【${storeName}】ご予約ありがとうございます`,
          text: customerBody,
          attachments: customerAttachments,
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

export type CancellationMailInput = Omit<
  ReservationMailInput,
  "notes" | "cancelUrl" | "googleCalendarUrl" | "icsContent"
>;

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

export type ReminderKind = "DAY_BEFORE" | "SHORT_BEFORE";

export type ReminderMailInput = {
  kind: ReminderKind;
  customerName: string;
  customerEmail: string;
  storeName: string;
  storePhone: string | null;
  menus: MailMenu[];
  totalPrice: number;
  totalDuration: number;
  staffName: string | null;
  startAt: Date;
  endAt: Date;
  cancelUrl: string | null;
  googleCalendarUrl: string | null;
};

export async function sendReminderEmail(
  input: ReminderMailInput,
): Promise<void> {
  const {
    kind,
    customerName,
    customerEmail,
    storeName,
    storePhone,
    menus,
    totalPrice,
    totalDuration,
    staffName,
    startAt,
    endAt,
    cancelUrl,
  } = input;

  const dateLine = `${fmtDate(startAt)} 〜 ${fmtHm(endAt)}`;
  const menuList = menuLines(menus);
  const cancelBlock = cancelUrl
    ? `\nやむを得ずキャンセルされる場合は以下のURLからお手続きください:\n${cancelUrl}\n`
    : "";
  // 1日前リマインダーの時のみ、まだカレンダー追加していない方向けに URL を案内
  const calendarBlock =
    kind === "DAY_BEFORE" && input.googleCalendarUrl
      ? `\nGoogle カレンダーへの追加はこちら:\n${input.googleCalendarUrl}\n`
      : "";

  let subject: string;
  let leadIn: string;

  if (kind === "DAY_BEFORE") {
    subject = `【${storeName}】明日のご予約のご案内`;
    leadIn = `${customerName} 様

明日のご予約のご案内です。
お間違いのないよう、念のためお時間をご確認くださいませ。`;
  } else {
    subject = `【${storeName}】まもなくご予約のお時間です`;
    leadIn = `${customerName} 様

まもなくご予約のお時間が近づいてまいりました。
お気をつけてお越しくださいませ。`;
  }

  const body = `${leadIn}

----------------------------------------
■ ご予約内容
日時: ${dateLine}
担当: ${staffName ?? "—"}

メニュー（${menus.length}件）:
${menuList}

合計: ¥${totalPrice.toLocaleString()}（税込） / 約${totalDuration}分
----------------------------------------
${calendarBlock}${cancelBlock}
ご来店をお待ちしております。

${storeName}${storePhone ? "\nTEL: " + storePhone : ""}
`;

  await sendMail({
    to: customerEmail,
    subject,
    text: body,
  });
}
