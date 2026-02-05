import { Resend } from "resend";
import { Webhook } from "standardwebhooks";

import { getServerEnv, publicEnv } from "@/lib/env";

type EmailActionType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change"
  | "email_change_new"
  | "reauthentication";

type EmailData = {
  email_action_type: EmailActionType;
  token?: string;
  token_hash?: string;
  token_hash_new?: string;
  token_new?: string;
  new_token?: string;
  redirect_to?: string;
  site_url?: string;
  email?: string;
  new_email?: string;
  confirmation_url?: string;
};

type HookPayload = {
  user: {
    email?: string;
    user_metadata?: Record<string, unknown> | null;
  };
  email_data: EmailData;
};

const subjects: Record<EmailActionType, string> = {
  signup: "メールアドレスの確認",
  recovery: "パスワード再設定",
  invite: "SONSHI GACHAへ招待されました",
  magiclink: "ログインリンク",
  email_change: "メールアドレス変更の確認",
  email_change_new: "新しいメールアドレスの確認",
  reauthentication: "再認証コード",
};

const renderTemplate = (action: EmailActionType, emailData: EmailData) => {
  const safeToken = emailData.token ?? "";
  const safeNewToken = emailData.new_token ?? emailData.token_new ?? "";
  const confirmationUrl = buildConfirmationUrl(emailData);
  const linkBlock = confirmationUrl
    ? `<p><a href="${confirmationUrl}">確認リンクを開く</a></p>`
    : "";
  const tokenBlock = safeToken ? `<p>確認コード: ${safeToken}</p>` : "";
  const newTokenBlock = safeNewToken ? `<p>新しい確認コード: ${safeNewToken}</p>` : "";

  switch (action) {
    case "signup":
      return `
        <h2>メールアドレスの確認</h2>
        <p>${publicEnv.NEXT_PUBLIC_SITE_NAME}をご利用いただきありがとうございます。</p>
        ${linkBlock}
        ${tokenBlock}
      `;
    case "recovery":
      return `
        <h2>パスワード再設定</h2>
        <p>以下のリンクからパスワードを再設定してください。</p>
        ${linkBlock}
        ${tokenBlock}
      `;
    case "invite":
      return `
        <h2>SONSHI GACHAへようこそ</h2>
        <p>${emailData.site_url ?? publicEnv.NEXT_PUBLIC_SITE_URL}への招待が届きました。</p>
        ${linkBlock}
        ${tokenBlock}
      `;
    case "magiclink":
      return `
        <h2>ログインリンク</h2>
        <p>以下のリンクからログインしてください。</p>
        ${linkBlock}
        ${tokenBlock}
      `;
    case "email_change":
      return `
        <h2>メールアドレス変更の確認</h2>
        <p>${emailData.email ?? "現在のメールアドレス"} から ${emailData.new_email ?? "新しいメールアドレス"} への変更を確認してください。</p>
        ${linkBlock}
        ${tokenBlock}
        ${newTokenBlock}
      `;
    case "email_change_new":
      return `
        <h2>新しいメールアドレスの確認</h2>
        <p>以下のリンクから新しいメールアドレスを確認してください。</p>
        ${linkBlock}
        ${newTokenBlock || tokenBlock}
      `;
    case "reauthentication":
      return `
        <h2>再認証</h2>
        <p>再認証のためのコードを入力してください。</p>
        ${tokenBlock}
      `;
    default:
      return `
        <h2>お知らせ</h2>
        <p>以下のリンクをご確認ください。</p>
        ${linkBlock}
      `;
  }
};

const buildConfirmationUrl = (emailData: EmailData) => {
  if (emailData.confirmation_url) return emailData.confirmation_url;

  const tokenHash =
    emailData.email_action_type === "email_change_new"
      ? emailData.token_hash_new ?? emailData.token_hash
      : emailData.token_hash ?? emailData.token_hash_new;
  if (!tokenHash) return "";

  const baseUrl = `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`;
  const params = new URLSearchParams({
    token: tokenHash,
    type: emailData.email_action_type,
  });

  if (emailData.redirect_to) {
    params.set("redirect_to", emailData.redirect_to);
  }

  return `${baseUrl}?${params.toString()}`;
};

export async function POST(request: Request) {
  const serverEnv = getServerEnv();

  if (!serverEnv.RESEND_API_KEY || !serverEnv.RESEND_FROM_EMAIL) {
    return new Response("Missing Resend configuration", { status: 500 });
  }

  if (!serverEnv.SUPABASE_EMAIL_HOOK_SECRET) {
    return new Response("Missing Supabase email hook secret", { status: 500 });
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);
  const hookSecret = serverEnv.SUPABASE_EMAIL_HOOK_SECRET.replace("v1,whsec_", "");
  const webhook = new Webhook(hookSecret);

  let verifiedPayload: HookPayload;
  try {
    verifiedPayload = webhook.verify(payload, headers) as HookPayload;
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  const { user, email_data: emailData } = verifiedPayload;
  const recipient =
    emailData.email_action_type === "email_change_new"
      ? emailData.new_email ?? user?.email
      : emailData.email ?? user?.email;
  if (!recipient) {
    return new Response("Missing user email", { status: 400 });
  }

  const resend = new Resend(serverEnv.RESEND_API_KEY);
  const subject = subjects[emailData.email_action_type] ?? "Notification";
  const html = renderTemplate(emailData.email_action_type, emailData);

  try {
    await resend.emails.send({
      from: serverEnv.RESEND_FROM_EMAIL,
      to: recipient,
      subject,
      html,
    });
  } catch {
    return new Response("Failed to send email", { status: 500 });
  }

  return Response.json({ ok: true });
}
