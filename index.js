import express from "express";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN not set");
  process.exit(1);
}

const app = express();

app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  async function getFundingAbove(limit = 0.002) {
  const url = "https://fapi.binance.com/fapi/v1/premiumIndex";

  const response = await axios.get(url);
  const data = response.data;

  return data.filter(item => {
    const rate = Number(item.lastFundingRate);
    return Math.abs(rate) >= limit;
  });
}
  console.log(`Web server listening on ${PORT}`);
});

const bot = new TelegramBot(token, { polling: true });

bot.on("message", msg => {
  bot.sendMessage(msg.chat.id, "Бот працює ✅");
});

console.log("Telegram bot started 🚀");
