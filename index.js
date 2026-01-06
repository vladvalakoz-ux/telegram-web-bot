import express from "express";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";

const app = express();
app.use(express.json());

/* ENV */
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("ENV variables missing");
  process.exit(1);
}

/* TELEGRAM BOT (WEBHOOK) */
const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(`${WEBHOOK_URL}/telegram`);

/* OKX FUNDING */
async function getFundingAbove(limit = 0.002) {
  const res = await axios.get(
    "https://www.okx.com/api/v5/market/tickers?instType=SWAP"
  );

  return res.data.data
    .filter(i => i.fundingRate !== "")
    .filter(i => Math.abs(Number(i.fundingRate)) >= limit)
    .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate))
    .slice(0, 10)
    .map(i => ({
      symbol: i.instId,
      funding: Number(i.fundingRate)
    }));
}

/* TELEGRAM WEBHOOK */
app.post("/telegram", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* COMMANDS */
bot.on("message", async msg => {
  if (msg.text === "/funding") {
    const data = await getFundingAbove();

    if (!data.length) {
      return bot.sendMessage(msg.chat.id, "Немає funding > 0.2%");
    }

    const text = data
      .map(i => `${i.symbol}: ${(i.funding * 100).toFixed(2)}%`)
      .join("\n");

    return bot.sendMessage(msg.chat.id, text);
  }

  bot.sendMessage(msg.chat.id, "Команда: /funding");
});

/* WEB */
app.get("/", (req, res) => res.send("OK"));

/* START */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server started on", PORT);
});
