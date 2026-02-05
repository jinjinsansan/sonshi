import Link from "next/link";
import { verifyEmailAction } from "../actions";

type VerifyPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-white">確認リンクが無効です</h1>
        <p className="text-sm text-zinc-400">リンクを確認して、もう一度お試しください。</p>
        <Link href="/login" className="text-neon-blue">
          ログインへ戻る
        </Link>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">
        {result.status === "ok" ? "メール認証が完了しました" : "確認リンクが無効です"}
      </h1>
      <p className="text-sm text-zinc-400">
        {result.status === "ok"
          ? "ログインしてホールへ入場してください。"
          : result.message ?? "リンクを確認して、もう一度お試しください。"}
      </p>
      <Link href="/login" className="text-neon-blue">
        ログインへ戻る
      </Link>
    </div>
  );
}
