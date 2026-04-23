# 🇧🇹 Bhutan QR Bot

> Telegram bot that auto-generates Bhutan entry QR codes for daily commuters. Skip 10 minutes of form-filling every day.

![Platform](https://img.shields.io/badge/platform-Telegram-26A5E4)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production--ready-success)

---

## ✨ Features

- 🚗 **9 vehicle presets** per user — save once, reuse forever
- 👥 **Passenger management** — save family members, rank by most-used
- 📷 **Photo OCR** — scan passport/ID photos with 5-sec auto-confirm
- ⏰ **Auto-daily schedule** — QR arrives at your chosen time (even custom times like 9:36 AM)
- 🌐 **Multi-language** — English, हिंदी (Hindi), বাংলা (Bengali)
- 🧪 **Test mode** — see step-by-step screenshots before committing
- 💳 **UPI subscription** — ₹99/year with 3 free trial QRs
- 📊 **Admin dashboard** — `/stats` and `/approve` commands

---

## 🎯 How it works

1. User adds their vehicle (Port → Type → Number → ID) — one-time, 30 seconds
2. Each day, user taps their vehicle button
3. Bot opens the Bhutan immigration website (headless browser), fills the form, extracts the QR
4. QR arrives in chat within 60 seconds — ready to show at the gate

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Telegram bot token ([@BotFather](https://t.me/BotFather))
- Your Telegram user ID ([@userinfobot](https://t.me/userinfobot))
- A UPI ID (any Indian UPI handle)

### Install & Run

```bash
# Clone this repo
git clone https://github.com/YOUR_USERNAME/bhutan-qr-bot.git
cd bhutan-qr-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your BOT_TOKEN, ADMIN_ID, UPI_ID

# Run
npm start
```

On Windows, double-click `START.bat` for a guided setup.

---

## 📂 Project Structure

```
bhutan-qr-bot/
├── src/
│   ├── bot.js            # Main Telegram bot (Telegraf)
│   ├── qrGenerator.js    # Puppeteer form automation
│   ├── store.js          # JSON file persistence
│   ├── ocr.js            # Passport photo OCR (Tesseract.js)
│   ├── i18n.js           # English/Hindi/Bengali strings
│   └── payments.js       # UPI deep-link builder
├── data/
│   └── qr-images/        # Generated QRs (auto-cleaned)
├── .env.example          # Configuration template
├── .gitignore
├── package.json
├── START.bat             # Windows one-click launcher
├── nixpacks.toml         # Railway deployment config
├── railway.json
├── LICENSE
└── README.md
```

---

## 🔧 Configuration

Required environment variables (put them in `.env`):

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | `123456:ABC-DEF...` |
| `ADMIN_ID` | Your Telegram user ID | `123456789` |
| `PRICE_INR` | Annual price in rupees | `99` |
| `UPI_ID` | Your UPI handle | `name@okhdfcbank` |
| `PAYEE_NAME` | Name shown to payers | `Bhutan QR Bot` |

---

## 💰 Payment Flow

1. User hits trial limit (3 QRs)
2. Bot shows "Upgrade ₹99/year" button
3. User taps → UPI link opens GPay/PhonePe/Paytm
4. User pays → taps "I have paid"
5. **Admin gets Telegram notification** with user ID
6. Admin verifies payment in their UPI app
7. Admin replies `/approve <user_id>` → subscription activated for 365 days

---

## 🌐 Deployment Options

### Option 1 — Railway (Recommended, free tier available)
See [DEPLOY.md](DEPLOY.md) for step-by-step Railway deployment.

### Option 2 — Your own PC
Just run `START.bat` (Windows) or `npm start` (Mac/Linux). Bot must stay running.

### Option 3 — VPS (Hostinger, DigitalOcean, Contabo)
Standard Node.js deployment. `npm install && npm start` with `pm2` for auto-restart.

---

## 🛠️ Admin Commands

Send these to your bot as the admin:

- `/stats` — Total users, revenue, QRs generated
- `/approve <user_id>` — Activate a user's subscription after payment

---

## ⚠️ Important Notes

**This bot automates a government website.** Verify that Bhutan Immigration allows programmatic form submission before scaling. Consider reaching out to DoI for written permission if running as a commercial service.

**The bot must stay running 24/7** for scheduled auto-QRs to fire and users to get instant responses.

---

## 📄 License

MIT © Siddharth Agarwal

---

## 🙏 Acknowledgments

- [Telegraf](https://github.com/telegraf/telegraf) — Telegram bot framework
- [Puppeteer](https://pptr.dev) — Headless Chrome automation
- [Tesseract.js](https://tesseract.projectnaptha.com) — OCR
