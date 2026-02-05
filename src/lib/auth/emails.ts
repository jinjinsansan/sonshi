import { Resend } from "resend";
import { getServerEnv, publicEnv } from "@/lib/env";

type AuthEmailPayload = {
  to: string;
  subject: string;
  title: string;
  body: string;
  buttonLabel: string;
  link: string;
};

function buildHtml({ title, body, buttonLabel, link }: AuthEmailPayload): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#08030f; padding:24px; color:#f8fafc;">
      <div style="max-width:520px;margin:0 auto;background:#14092a;border-radius:18px;padding:32px;border:1px solid rgba(255,255,255,0.08);">
        <p style="letter-spacing:0.35em;font-size:11px;color:#30f0ff;margin:0 0 12px;">SONSHI GACHA</p>
        <h1 style="font-size:22px;margin:0 0 12px;">${title}</h1>
        <p style="font-size:14px;line-height:1.7;color:#d4d4d8;margin:0 0 24px;">${body}</p>
        <a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:linear-gradient(135deg,#ff2d95,#fff65c);color:#120a1a;font-weight:bold;text-decoration:none;">${buttonLabel}</a>
        <p style="font-size:12px;color:#a1a1aa;margin-top:28px;">リンクの有効期限は短時間です。期限切れの場合は再度リクエストしてください。</p>
        <p style="font-size:11px;color:#71717a;margin-top:20px;">${publicEnv.NEXT_PUBLIC_SITE_URL}</p>
      </div>
    </div>
  `;
}

function buildText({ title, body, link }: AuthEmailPayload): string {
  return `${title}\n${body}\n${link}`;
}

async function sendAuthEmail(payload: AuthEmailPayload) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = getServerEnv();
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error("Resend configuration is missing");
  }

  const resend = new Resend(RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: buildHtml(payload),
    text: buildText(payload),
  });

  if (error) {
    console.error("Resend email error", error);
    throw new Error("メール送信に失敗しました。");
  }

  if (data?.id) {
    console.info(`[email] sent ${payload.subject} to ${payload.to} (id=${data.id})`);
  }
}

export async function sendSignupVerificationEmail(to: string, link: string) {
  await sendAuthEmail({
    to,
    link,
    subject: "【SONSHI GACHA】メールアドレス確認",
    title: "メールアドレスを確認してください",
    body: "以下のボタンからメール認証を完了すると、ホールへ入場できます。",
    buttonLabel: "メールを確認する",
  });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  await sendAuthEmail({
    to,
    link,
    subject: "【SONSHI GACHA】パスワード再設定",
    title: "パスワード再設定",
    body: "以下のボタンから新しいパスワードを設定してください。",
    buttonLabel: "パスワードを再設定",
  });
}

export async function sendEmailChangeVerificationEmail(to: string, link: string) {
  await sendAuthEmail({
    to,
    link,
    subject: "【SONSHI GACHA】メールアドレス変更",
    title: "メールアドレス変更の確認",
    body: "以下のボタンからメールアドレス変更を完了してください。",
    buttonLabel: "変更を完了する",
  });
}
