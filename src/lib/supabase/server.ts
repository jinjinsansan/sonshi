import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

type CookiePayload = { name: string; value: string };

function createSupabaseClient(cookieFns: {
  getAll: () => Promise<CookiePayload[] | null> | CookiePayload[] | null;
  setAll?: (cookies: { name: string; value: string; options: CookieOptions }[]) => Promise<void> | void;
}): SupabaseClient<Database> {
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: cookieFns,
    }
  );
}

export function getSupabaseServerClient(): SupabaseClient<Database> {
  const cookiesPromise = cookies();

  return createSupabaseClient({
    getAll: async () => {
      const store = await cookiesPromise;
      return store.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll: async (cookieList) => {
      const store = await cookiesPromise;
      const mutableStore = store as unknown as {
        set: (cookie: { name: string; value: string; options?: CookieOptions }) => void;
      };

      if (typeof mutableStore.set !== "function") {
        return;
      }

      cookieList.forEach((cookie) => {
        try {
          mutableStore.set({ name: cookie.name, value: cookie.value, ...cookie.options });
        } catch (error) {
          console.error("Failed to set Supabase cookie in server client", error);
        }
      });
    },
  });
}

export function getSupabaseActionClient(): SupabaseClient<Database> {
  const cookiesPromise = cookies();

  return createSupabaseClient({
    getAll: async () => {
      const store = await cookiesPromise;
      return store.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll: async (cookieList) => {
      const store = await cookiesPromise;
      const mutableStore = store as unknown as {
        set: (cookie: { name: string; value: string; options?: CookieOptions }) => void;
      };

      if (typeof mutableStore.set !== "function") {
        throw new Error("Cookie store is not mutable in this context. Use within a server action.");
      }

      cookieList.forEach((cookie) => {
        mutableStore.set({ name: cookie.name, value: cookie.value, ...cookie.options });
      });
    },
  });
}
