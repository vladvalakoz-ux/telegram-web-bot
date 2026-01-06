import express from "express";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("ENV vars missing");
  process.exit(1);
}

/* TELEGRAM */
const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(`${WEBHOOK_URL}/telegram`);

/* OKX FUNDING */
async function getFundingAbove(limit = 0.002) {
  // 1️⃣ всі perpetual
  const instrumentsRes = await axios.get(
    "https://www.okx.com/api/v5/public/instruments",
    { params: { instType: "SWAP" } }
  );

  const instruments = instrumentsRes.data.data;
  const result = [];

  // 2️⃣ funding по кожному
  for (const inst of instruments) {
    try {
      const frRes = await axios.get(
        "https://www.okx.com/api/v5/public/funding-rate",
        { params: { instId: inst.instId } }
      );

      const rate = Number(frRes.data.data[0].fundingRate);

      if (Math.abs(rate) >= limit) {
        result.push({
          symbol: inst.instId,
          fundingRate: rate
        });
      }
    } catch (e) {
      // пропускаємо помилки
    }
  }

  return result;
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
      .slice(0, 10)
      .map(
        i => `${i.symbol}: ${(i.fundingRate * 100).toFixed(2)}%`
      )
      .join("\n");

    bot.sendMessage(msg.chat.id, text);
  } else {
    bot.sendMessage(msg.chat.id, "Напиши /funding");
  }
});

/* WEB */
app.get("/", (_, res) => res.send("OK"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server started"));
