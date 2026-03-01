import { ENV } from "./env.ts";
import type { AuthContext, TgUser } from "./types.ts";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function parseInitData(initData: string): Map<string, string> {
  const params = new URLSearchParams(initData);
  const map = new Map<string, string>();
  for (const [k, v] of params.entries()) map.set(k, v);
  return map;
}

export async function verifyTelegramInitDataOrThrow(initData: string): Promise<AuthContext> {
  if (!initData) throw new Error("Missing Telegram initData");

  const map = parseInitData(initData);
  const hash = map.get("hash");
  if (!hash) throw new Error("Missing hash in initData");
  map.delete("hash");

  const pairs: string[] = [];
  Array.from(map.keys()).sort().forEach((k) => pairs.push(`${k}=${map.get(k) ?? ""}`));
  const dataCheckString = pairs.join("\n");

  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), ENV.TELEGRAM_BOT_TOKEN);
  const computedHashBytes = await hmacSha256(secretKey, dataCheckString);
  const computedHashHex = toHex(computedHashBytes);

  if (computedHashHex !== hash) throw new Error("Invalid initData signature");

  const userStr = map.get("user");
  if (!userStr) throw new Error("Missing user in initData");
  const tgUser = JSON.parse(userStr) as TgUser;

  if (!tgUser?.id) throw new Error("Invalid Telegram user");

  return { tgUser, rawInitData: initData };
}

export async function telegramSendMessage(chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Telegram sendMessage failed: ${res.status} ${t}`);
  }
}

export function tgDisplayName(u: TgUser): string {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return name || u.username || String(u.id);
}
