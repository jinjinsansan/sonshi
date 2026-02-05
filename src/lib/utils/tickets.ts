import { resolveApiUrl } from "@/lib/utils/api";

export type TicketBalanceItem = {
  code: string;
  name: string;
  quantity: number;
  colorToken: string | null;
  sortOrder: number;
};

export async function fetchTicketBalances(): Promise<TicketBalanceItem[]> {
  const endpoint = resolveApiUrl("/api/tickets");
  const response = await fetch(endpoint, {
    cache: "no-store",
    next: { tags: ["tickets"] },
  });

  if (!response.ok) {
    throw new Error("チケット残高の取得に失敗しました");
  }

  const data = await response.json();
  return Array.isArray(data?.tickets) ? data.tickets : [];
}
