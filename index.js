import express from "express";
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
  console.log(`Web server listening on ${PORT}`);
});

const bot = new TelegramBot(token, { polling: true });

bot.on("message", msg => {
  bot.sendMessage(msg.chat.id, "Бот працює ✅");
});

console.log("Telegram bot started 🚀");
