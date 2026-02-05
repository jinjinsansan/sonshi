import Link from "next/link";
import { confirmEmailChangeAction } from "../actions";

type EmailChangePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function EmailChangePage({ searchParams }: EmailChangePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-white">リンクが無効です</h1>
        <p className="text-sm text-zinc-400">メールアドレス変更リンクを確認してください。</p>
        <Link href="/login" className="text-neon-blue">
          ログインへ戻る
        </Link>
      </div>
    );
  }

  const result = await confirmEmailChangeAction(token);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">
        {result.status === "ok" ? "メールアドレスを更新しました" : "リンクが無効です"}
      </h1>
      <p className="text-sm text-zinc-400">
        {result.status === "ok" ? "新しいメールアドレスでログインしてください。" : result.message}
      </p>
      <Link href="/login" className="text-neon-blue">
        ログインへ戻る
      </Link>
    </div>
  );
}
