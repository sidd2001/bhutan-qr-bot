# 🚀 Deployment Guide

This guide gets your bot running 24/7 in the cloud so users can use it anytime, even when your PC is off.

## 🎯 Recommended: Railway (easiest, no computer needed)

Railway is a cloud platform that runs your bot 24/7. **Free tier: $5 credit/month** (enough for a small bot).

### Step 1 — Create GitHub account
- Go to [github.com](https://github.com) → Sign up
- Use your phone, no computer needed

### Step 2 — Create a new repository
- Click **+ (top right)** → **New repository**
- Name it: `bhutan-qr-bot`
- Keep it **Public** (required for free Railway) or Private (paid Railway)
- Don't add README/gitignore (we have our own)
- Click **Create repository**

### Step 3 — Upload this code
**Option A: Web upload (easiest)**
- On the empty repo page, click **"uploading an existing file"**
- Drag & drop **all files** from this zip (not the folder itself)
- Make sure `.env` is NOT uploaded (only `.env.example`)
- Commit with message: "Initial commit"

**Option B: Git command line** (if you know git)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bhutan-qr-bot.git
git push -u origin main
```

### Step 4 — Deploy to Railway
1. Go to [railway.app](https://railway.app) → **Login with GitHub**
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Pick your `bhutan-qr-bot` repo
5. Railway starts building (3-5 min)

### Step 5 — Add environment variables
On your Railway project page:
1. Click your service (the box)
2. Click **"Variables"** tab
3. Click **"+ New Variable"** — add these one by one:

| Name | Value |
|------|-------|
| `BOT_TOKEN` | Your token from @BotFather |
| `ADMIN_ID` | Your Telegram ID from @userinfobot |
| `PRICE_INR` | `99` |
| `UPI_ID` | Your UPI ID (e.g. `9876543210@okhdfcbank`) |
| `PAYEE_NAME` | `Bhutan QR Bot` |

4. Railway auto-redeploys after each variable

### Step 6 — Verify it's working
- Click **"Deployments"** tab → latest deployment → **"View Logs"**
- You should see: `✅ Bhutan QR Bot (FINAL) is LIVE!`
- Open Telegram → search your bot → tap Start 🎉

---

## 🎯 Alternative: Render.com

Similar to Railway, also free tier available:

1. [render.com](https://render.com) → Sign up with GitHub
2. **New +** → **Web Service**
3. Connect your GitHub repo
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add environment variables (same as Railway)
7. Deploy

⚠️ Render free tier sleeps after 15 min of inactivity — bot wakes up on first message (takes 30 sec). For production, use paid tier ($7/mo).

---

## 🎯 Alternative: Your Own VPS

If you have a VPS (Hostinger, DigitalOcean, Contabo):

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install dependencies for Puppeteer
sudo apt install -y chromium-browser libx11-xcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 \
  libxss1 libxrandr2 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
  libpangocairo-1.0-0 libgtk-3-0

# Clone and setup
git clone https://github.com/YOUR_USERNAME/bhutan-qr-bot.git
cd bhutan-qr-bot
npm install
cp .env.example .env
nano .env  # Fill in your values

# Install PM2 for auto-restart
sudo npm install -g pm2
pm2 start src/bot.js --name bhutan-bot
pm2 startup  # enables auto-start on reboot
pm2 save
```

Check logs: `pm2 logs bhutan-bot`
Restart: `pm2 restart bhutan-bot`
Stop: `pm2 stop bhutan-bot`

---

## 🎯 Alternative: Run on your PC (testing only)

1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Extract this zip
3. Create `.env` from `.env.example`
4. Double-click `START.bat` (Windows) or run `npm install && npm start` (Mac/Linux)

⚠️ **Bot stops when your PC sleeps or shuts down.** Use cloud hosting for production.

---

## 🔧 Troubleshooting

### Bot doesn't respond on Telegram
- Check logs: `❌ No bot token!` → you forgot to set `BOT_TOKEN`
- Make sure your token is from @BotFather (not copied from an old deleted bot)

### "Cannot find module" error
- Run `npm install` again
- On Railway/Render: check build logs, may be a deploy failure

### Puppeteer fails / Chrome not found
- On Railway: `nixpacks.toml` in this repo handles it automatically
- On VPS: install Chromium (`apt install chromium-browser`)
- On your PC: `npm install` downloads Chrome on first run

### Payments don't reach you
- Verify `ADMIN_ID` is your numeric Telegram ID
- Test by sending yourself a fake payment: should get a notification
- Check that the UPI app shows the payment in its history

---

## 💰 Cost Estimates

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | $5/mo credit | ~$5/mo for small bot |
| Render | Free (sleeps) | $7/mo always-on |
| Hostinger VPS | None | ₹299/mo (~$3.60) |
| Contabo VPS | None | ₹500/mo (~$6) |
| Your PC | Free (but uses electricity) | — |

**For launch**: Railway free tier or Render free tier
**For 50+ users**: Upgrade to paid ($5-7/mo)
**For 500+ users**: VPS (₹500/mo) handles it easily

---

## 📊 Post-Launch Checklist

- [ ] Bot responds to `/start`
- [ ] Add your own vehicle → generate a QR → confirm it works
- [ ] Test payment flow with ₹1 to yourself
- [ ] Approve yourself with `/approve`
- [ ] Check `/stats` command works
- [ ] Share your bot link: `https://t.me/YourBotUsername`
- [ ] Post in local commuter groups / WhatsApp
- [ ] Monitor Railway/Render logs for errors
- [ ] Back up `data/store.json` weekly (contains all user data)

---

## 🔄 Updating the bot

After making changes locally:

```bash
git add .
git commit -m "Fixed XYZ"
git push
```

Railway/Render auto-redeploys within 2 minutes.

---

Good luck with your launch! 🇧🇹🚀
