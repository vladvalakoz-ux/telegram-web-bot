import express from "express";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(`${WEBHOOK_URL}/telegram`);

/* Bybit */
async function getFundingAbove(limit = 0.002) {
  const response = await axios.get(
    "https://api.bybit.com/v5/market/tickers?category=linear"
  );

  const data = response.data.result.list;

  return data
    .filter(i => Math.abs(Number(i.fundingRate)) >= limit)
    .map(i => ({
      symbol: i.symbol,
      fundingRate: Number(i.fundingRate)
    }));
}
/* TELEGRAM WEBHOOK */
app.post("/telegram", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* COMMAND */
bot.on("message", async msg => {
  if (msg.text === "/funding") {
    const data = await getFundingAbove();
    if (!data.length) {
      return bot.sendMessage(msg.chat.id, "Немає funding > 0.2%");
    }

    const text = data
      .slice(0, 10)
      .map(i => `${i.symbol}: ${(i.lastFundingRate * 100).toFixed(2)}%`)
      .join("\n");

    bot.sendMessage(msg.chat.id, text);
  } else {
    bot.sendMessage(msg.chat.id, "Напиши /funding");
  }
});

/* WEB */
app.get("/", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server started"));
