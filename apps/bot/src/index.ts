import { Telegraf, Markup } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import { ENV, deepLinkForMaster, webAppUrl } from "./telegram.js";

const bot = new Telegraf(ENV.TELEGRAM_BOT_TOKEN);
const db = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function displayName(ctx: any): string {
  const u = ctx.from;
  if (!u) return "Мастер";
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return name || u.username || String(u.id);
}

async function upsertMaster(tgUserId: number, name: string) {
  const { data, error } = await db
    .from("masters")
    .upsert({ tg_user_id: tgUserId, display_name: name, is_active: true }, { onConflict: "tg_user_id" })
    .select("id, display_name")
    .single();
  if (error) throw error;
  return data;
}

bot.start(async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;

  const payload = (ctx as any).startPayload as string | undefined;
  if (payload?.startsWith("master_")) {
    const masterId = payload.replace("master_", "");
    await ctx.reply(
      "Открываю запись 👇",
      Markup.inlineKeyboard([[Markup.button.webApp("Записаться", webAppUrl(`/m/${masterId}`))]])
    );
    return;
  }

  const name = displayName(ctx);
  const master = await upsertMaster(tgId, name);
  const link = deepLinkForMaster(master.id);

  await ctx.reply(
    `Привет, ${master.display_name}!\n\n` +
      `Твоя ссылка для клиентов:\n${link}\n\n` +
      `Открой кабинет, чтобы добавить услуги и расписание.`,
    Markup.inlineKeyboard([
      [Markup.button.webApp("Открыть кабинет", webAppUrl(`/master`))],
      [Markup.button.callback("Моя ссылка", "MY_LINK")],
      [Markup.button.webApp("Открыть страницу записи", webAppUrl(`/m/${master.id}`))]
    ])
  );
});

bot.action("MY_LINK", async (ctx) => {
  try {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    const { data, error } = await db.from("masters").select("id").eq("tg_user_id", tgId).maybeSingle();
    if (error) throw error;
    if (!data) return ctx.reply("Сначала нажми /start");

    await ctx.reply(`Твоя ссылка:\n${deepLinkForMaster(data.id)}`);
  } finally {
    await ctx.answerCbQuery();
  }
});

bot.catch((err) => console.error(err));

bot.launch().then(() => console.log("Bot started"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
