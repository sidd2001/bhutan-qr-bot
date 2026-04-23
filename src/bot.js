// ============================================================
//  Bhutan QR Bot — FINAL (Telegram)
//  • Side-by-side buttons: "Preset N" + "+ Passengers"
//  • OCR photo → 5-sec confirm → auto-save passenger
//  • Most-used passengers on top
//  • QR sent only as chat photo (no phone gallery save)
// ============================================================
const { Telegraf, Markup } = require("telegraf");
const schedule = require("node-schedule");

const QRGenerator = require("./qrGenerator");
const Store = require("./store");
const { parsePassengerPhoto } = require("./ocr");
const { t } = require("./i18n");
const Payments = require("./payments");

const { PORT_LIST, TYPE_LIST, VEHICLE_EMOJI } = QRGenerator;

// ── Config ──────────────────────────────────────────────────
const BOT_TOKEN  = process.env.BOT_TOKEN  || "PASTE_YOUR_TOKEN_HERE";
const ADMIN_ID   = process.env.ADMIN_ID   || "";
const PRICE_INR  = parseInt(process.env.PRICE_INR || "99");
const UPI_ID     = process.env.UPI_ID     || "";
const PAYEE_NAME = process.env.PAYEE_NAME || "Bhutan QR Bot";

if (BOT_TOKEN === "PASTE_YOUR_TOKEN_HERE") {
  console.log("\n❌ No bot token! Edit .env and add BOT_TOKEN=... from @BotFather\n");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const langOf = (ctx) => Store.getLanguage(String(ctx.from.id));

// ============================================================
//  MAIN MENU — app-style layout
// ============================================================
function buildMainKeyboard(userId, lang) {
  const presets = Store.getAllPresets(userId);
  const schedules = Store.getAllSchedules(userId);
  const rows = [];

  // ── VEHICLE CARDS (side-by-side: tap-to-QR + passengers) ──
  for (let i = 1; i <= 9; i++) {
    const p = presets[i];
    if (!p) continue;
    const emoji = VEHICLE_EMOJI[p.type] || "🚗";
    const schedBadge = schedules[i] ? " ⏰" : "";
    rows.push([
      Markup.button.callback(`${emoji}  ${p.vehicle}${schedBadge}`, `qr_${i}`),
      Markup.button.callback(`👥  With others`, `qrp_${i}`),
    ]);
  }

  // ── divider row (visual breathing space) ──
  if (Object.keys(presets).length > 0) {
    rows.push([Markup.button.callback("─────────  ⚙️  ─────────", "noop")]);
  }

  // ── QUICK ACTIONS ──
  rows.push([
    Markup.button.callback("➕  Add Vehicle", "new_preset"),
    Markup.button.callback("🗑  Remove", "delete_menu"),
  ]);
  rows.push([
    Markup.button.callback("⏰  Auto-Daily", "schedule_menu"),
    Markup.button.callback("👥  My People", "passengers_menu"),
  ]);

  // ── SETTINGS ──
  rows.push([
    Markup.button.callback("💎  Subscription", "show_subscription"),
    Markup.button.callback("🌐  Language", "pick_language"),
  ]);
  rows.push([
    Markup.button.callback("🧪  Test", "test_menu"),
    Markup.button.callback("ℹ️  Help", "how_it_works"),
  ]);

  return Markup.inlineKeyboard(rows);
}

async function showMenu(ctx) {
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const presets = Store.getAllPresets(userId);
  const sub = Store.getSubscription(userId);
  const passengers = Store.getPassengers(userId);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  // Header
  let txt = `╔══════════════════════╗\n`;
  txt    += `║  🇧🇹  *BHUTAN QR*  🇧🇹  ║\n`;
  txt    += `╚══════════════════════╝\n`;
  txt    += `📅  ${today}\n\n`;

  // Status card
  if (sub.plan === "paid") {
    const until = new Date(sub.paidUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    txt += `┌─────────────────────┐\n`;
    txt += `│ 💎  *PREMIUM*         │\n`;
    txt += `│ Valid until ${until}  \n`;
    txt += `│ 🎫 ${sub.totalQRs || 0} QRs made  │\n`;
    txt += `└─────────────────────┘\n\n`;
  } else if (sub.plan === "trial") {
    txt += `┌─────────────────────┐\n`;
    txt += `│ 🎁  *FREE TRIAL*      │\n`;
    txt += `│ ${sub.trialCount} QR${sub.trialCount !== 1 ? "s" : ""} remaining        │\n`;
    txt += `└─────────────────────┘\n\n`;
  } else {
    txt += `┌─────────────────────┐\n`;
    txt += `│ ⚠️  *TRIAL ENDED*     │\n`;
    txt += `│ Upgrade to continue   │\n`;
    txt += `└─────────────────────┘\n\n`;
  }

  // Vehicle section
  if (!Object.keys(presets).length) {
    txt += `🚗  *No vehicles yet*\n\n`;
    txt += `Tap  *➕ Add Vehicle*  below to create your first one.\n\n`;
    txt += `It takes 30 seconds ⚡`;
  } else {
    txt += `*🚗  YOUR VEHICLES*\n`;
    txt += `_Tap left to generate QR._\n`;
    txt += `_Tap_ *👥 With others* _for passengers._`;
  }

  await ctx.reply(txt, { parse_mode: "Markdown", ...buildMainKeyboard(userId, lang) });
}

// No-op for decorative divider
bot.action("noop", async (ctx) => { await ctx.answerCbQuery(); });

// ============================================================
//  /start
// ============================================================
bot.start(async (ctx) => {
  const userId = String(ctx.from.id);
  const firstName = ctx.from.first_name || "friend";
  Store.setFirstName(userId, firstName);
  const lang = langOf(ctx);

  if (!Object.keys(Store.getAllPresets(userId)).length) {
    const welcome =
      `╔══════════════════════╗\n` +
      `║   🇧🇹  *BHUTAN QR*        ║\n` +
      `╚══════════════════════╝\n\n` +
      `*Welcome!*\n\n` +
      `First, let's pick your language 👇`;

    await ctx.reply(welcome, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🇬🇧  English", "lang_en")],
        [Markup.button.callback("🇮🇳  हिंदी (Hindi)", "lang_hi")],
        [Markup.button.callback("🇧🇩  বাংলা (Bengali)", "lang_bn")],
      ]),
    });
  } else {
    return showMenu(ctx);
  }
});

bot.command("menu", showMenu);
bot.command("home", showMenu);
bot.command("cancel", async (ctx) => { Store.clearWizard(String(ctx.from.id)); return showMenu(ctx); });

bot.action("back_to_menu", async (ctx) => { await ctx.answerCbQuery(); return showMenu(ctx); });

// ============================================================
//  Language
// ============================================================
bot.action("pick_language", async (ctx) => {
  await ctx.answerCbQuery();
  const lang = langOf(ctx);
  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🌐  *CHOOSE LANGUAGE*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `भाषा चुनें  /  ভাষা বেছে নিন`;

  await ctx.reply(msg, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🇬🇧  English", "lang_en")],
      [Markup.button.callback("🇮🇳  हिंदी (Hindi)", "lang_hi")],
      [Markup.button.callback("🇧🇩  বাংলা (Bengali)", "lang_bn")],
      [Markup.button.callback("◀  Back", "back_to_menu")],
    ]),
  });
});

bot.action(/^lang_(en|hi|bn)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  Store.setLanguage(userId, ctx.match[1]);
  const newLang = ctx.match[1];
  const firstName = ctx.from.first_name || "friend";

  if (!Object.keys(Store.getAllPresets(userId)).length) {
    const welcomeMsg =
      `✨  *${firstName}, namaste!*  ✨\n\n` +
      `🇧🇹  *Bhutan QR Bot*\n` +
      `_Your daily entry, solved._\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎯  *What I do:*\n\n` +
      `• Auto-fills the immigration form\n` +
      `• Generates QR in 60 seconds\n` +
      `• Saves 10+ minutes every day\n` +
      `• Sends QR right here in chat\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎁  *3 free QRs* to try\n` +
      `💎  Then ₹${PRICE_INR}/year for unlimited\n\n` +
      `Let's add your vehicle 👇`;

    await ctx.reply(welcomeMsg, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🚗  Add My Vehicle", "new_preset")],
        [Markup.button.callback("ℹ️  How it works", "how_it_works")],
      ]),
    });
  } else {
    return showMenu(ctx);
  }
});

// ============================================================
//  Help
// ============================================================
bot.action("how_it_works", async (ctx) => {
  await ctx.answerCbQuery();
  const lang = langOf(ctx);
  const help =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `ℹ️   *HOW IT WORKS*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*📝  ONE-TIME SETUP*\n` +
    `Tap  *➕ Add Vehicle*  → answer 4 quick questions\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*⚡  DAILY USE*\n` +
    `Just tap your vehicle button\n` +
    `→  QR arrives in 60 seconds\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*👥  WITH PASSENGERS*\n` +
    `Tap the  *With others*  button\n` +
    `→  Pick from saved people, or\n` +
    `→  Send a photo of their ID\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*⏰  AUTO-DAILY*\n` +
    `Tap  *Auto-Daily*  → pick a time\n` +
    `→  QR auto-arrives every morning\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*🧪  TEST FIRST*\n` +
    `Tap  *Test*  to see the bot fill the form\n` +
    `step-by-step — no credit used`;

  await ctx.reply(help, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([[Markup.button.callback("◀  Back", "back_to_menu")]]),
  });
});

// ============================================================
//  New preset wizard
// ============================================================
bot.action("new_preset", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const existing = Store.getAllPresets(userId);
  let slot = null;
  for (let i = 1; i <= 9; i++) if (!existing[i]) { slot = String(i); break; }
  if (!slot) return ctx.reply("Max 9 vehicles. Delete one first.");
  Store.setWizard(userId, { slot, step: "port", data: {} });
  return askPort(ctx, slot);
});

async function askPort(ctx, slot) {
  const lang = langOf(ctx);
  const btns = PORT_LIST.map((p, i) => [Markup.button.callback(`${i + 1}.  ${p}`, `wiz_port_${i}`)]);
  btns.push([Markup.button.callback("❌  Cancel", "cancel_wizard")]);

  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `*🆕  NEW VEHICLE — ${slot} of 9*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Step 1 of 4*\n` +
    `🚪  *Port of Entry*\n\n` +
    `Where do you cross the border?\n\n` +
    `_Tap your usual port:_`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
}

async function askType(ctx, slot) {
  const lang = langOf(ctx);
  const btns = TYPE_LIST.map((ty, i) => {
    const em = VEHICLE_EMOJI[ty] || "🚗";
    return [Markup.button.callback(`${em}  ${ty}`, `wiz_type_${i}`)];
  });
  btns.push([Markup.button.callback("❌  Cancel", "cancel_wizard")]);

  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `*🆕  NEW VEHICLE — ${slot} of 9*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Step 2 of 4*\n` +
    `🚗  *Vehicle Type*\n\n` +
    `What are you driving?`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
}

async function askVehicleNumber(ctx) {
  const lang = langOf(ctx);
  const wiz = Store.getWizard(String(ctx.from.id));
  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `*🆕  NEW VEHICLE — ${wiz?.slot || ""} of 9*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Step 3 of 4*\n` +
    `🔢  *Vehicle Number*\n\n` +
    `Type it exactly as on your plate:\n\n` +
    `\`WB 70K 0494\`   ← example\n\n` +
    `_Type below 👇_`;

  await ctx.reply(msg, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([[Markup.button.callback("❌  Cancel", "cancel_wizard")]]),
  });
}

async function askDriverId(ctx) {
  const lang = langOf(ctx);
  const wiz = Store.getWizard(String(ctx.from.id));
  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `*🆕  NEW VEHICLE — ${wiz?.slot || ""} of 9*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Step 4 of 4*  _(last one!)_\n` +
    `🆔  *Your ID Number*\n\n` +
    `Type your CID / Passport number\n` +
    `*exactly* as written — with spaces:\n\n` +
    `\`4996 2759 5134\`   ← example\n\n` +
    `✨  _Your name will auto-fetch from the immigration site._`;

  await ctx.reply(msg, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([[Markup.button.callback("❌  Cancel", "cancel_wizard")]]),
  });
}

bot.action(/^wiz_port_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const wiz = Store.getWizard(userId);
  if (!wiz || wiz.step !== "port") return;
  const lang = langOf(ctx);
  const port = PORT_LIST[parseInt(ctx.match[1])];
  wiz.data.port = port;
  Store.setWizard(userId, { ...wiz, step: "type" });
  await ctx.reply(`✅  *Port saved:* ${port}`, { parse_mode: "Markdown" });
  return askType(ctx, wiz.slot);
});

bot.action(/^wiz_type_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const wiz = Store.getWizard(userId);
  if (!wiz || wiz.step !== "type") return;
  const lang = langOf(ctx);
  const type = TYPE_LIST[parseInt(ctx.match[1])];
  wiz.data.type = type;
  Store.setWizard(userId, { ...wiz, step: "vehicle" });
  const em = VEHICLE_EMOJI[type] || "🚗";
  await ctx.reply(`✅  *Vehicle type:* ${em} ${type}`, { parse_mode: "Markdown" });
  return askVehicleNumber(ctx);
});

bot.action("cancel_wizard", async (ctx) => {
  await ctx.answerCbQuery("Cancelled");
  Store.clearWizard(String(ctx.from.id));
  return showMenu(ctx);
});

// ============================================================
//  Generate QR — solo (preset tapped)
// ============================================================
bot.action(/^qr_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  return runPreset(ctx, parseInt(ctx.match[1]), [], false);
});

// ============================================================
//  Generate QR with passengers (preset+passengers tapped)
// ============================================================
bot.action(/^qrp_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const num = parseInt(ctx.match[1]);
  const passengers = Store.getPassengers(userId);
  const preset = Store.getPreset(userId, num);
  const em = preset ? (VEHICLE_EMOJI[preset.type] || "🚗") : "🚗";

  Store.setWizard(userId, { step: "select_passengers", slot: num, data: { selected: [] } });

  const rows = [];
  passengers.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
    rows.push([Markup.button.callback(`${medal}  ${p.name}  (${p.useCount}x)`, `psel_${p.id}`)]);
  });

  rows.push([Markup.button.callback("📷  Send photo to scan new ID", "psnd_noop")]);
  rows.push([Markup.button.callback("⌨️  Type ID manually", "padd_manual")]);
  if (passengers.length) {
    rows.push([Markup.button.callback("✅  Done — Generate QR", `pdone_${num}`)]);
  }
  rows.push([Markup.button.callback("◀  Back", "back_to_menu")]);

  let msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👥  *ADD PASSENGERS*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `${em}  For:  *${preset?.vehicle || `Vehicle ${num}`}*\n\n`;

  if (passengers.length) {
    msg += `*Tap to add (most-used on top):*\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `*Or add new:*\n` +
           `📷  Send a photo of their ID\n` +
           `⌨️  Or type the number manually`;
  } else {
    msg += `_No saved passengers yet._\n\n` +
           `*Add a new one:*\n\n` +
           `📷  Send a photo of their ID, or\n` +
           `⌨️  Type the number manually\n\n` +
           `_Once added, they save automatically for next time._`;
  }

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(rows) });
});

// Passenger selected from saved list (adds to wizard selection)
bot.action(/^psel_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const wiz = Store.getWizard(userId);
  if (!wiz || wiz.step !== "select_passengers") return;

  const id = parseInt(ctx.match[1]);
  const p = Store.getPassengers(userId).find(x => x.id === id);
  if (!p) return;

  if (!wiz.data.selected.includes(id)) wiz.data.selected.push(id);
  Store.setWizard(userId, wiz);

  await ctx.answerCbQuery(`✓ ${p.name} added (${wiz.data.selected.length} total)`);
  // Small refresh message
  const selected = wiz.data.selected.map(sid => {
    const p = Store.getPassengers(userId).find(x => x.id === sid);
    return p ? `• ${p.name}` : "";
  }).filter(Boolean).join("\n");
  await ctx.reply(`*Selected so far (${wiz.data.selected.length}):*\n${selected}\n\nTap another or tap *✅ Done* when finished.`, { parse_mode: "Markdown" });
});

// "Done" → generate QR with selected passengers
bot.action(/^pdone_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const num = parseInt(ctx.match[1]);
  const wiz = Store.getWizard(userId);
  const selectedIds = wiz?.data?.selected || [];
  const allPassengers = Store.getPassengers(userId);
  const chosen = selectedIds.map(id => allPassengers.find(p => p.id === id)).filter(Boolean);

  // Increment use count for each
  chosen.forEach(p => Store.incrementPassengerUse(userId, p.id));

  Store.clearWizard(userId);
  return runPreset(ctx, num, chosen.map(p => ({
    name: p.name, docType: p.docType, docNumber: p.docNumber, nationality: p.nationality,
  })), false);
});

// Manual ID typing
bot.action("padd_manual", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const wiz = Store.getWizard(userId);
  if (!wiz) return;
  Store.setWizard(userId, { ...wiz, step: "add_passenger_manual" });
  await ctx.reply(
    `⌨️ Type the passenger's ID number (with spaces if any):\n\nExample: *ABC1234567*\n\nOr tap back to return.`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("◀ Back", `qrp_${wiz.slot}`)]]),
    }
  );
});

// Confirm a pending passenger (after 5-sec window or user tapped)
bot.action(/^pconf_(accept|reject)_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const pending = Store.getPendingPassenger(userId);
  if (!pending) return ctx.reply("That passenger confirmation expired.");
  Store.clearPendingPassenger(userId);

  if (ctx.match[1] === "reject") {
    await ctx.reply("❌ Not added. Try sending a clearer photo, or tap ⌨️ Type manually.");
    return;
  }

  // Accept
  const p = Store.addOrGetPassenger(userId, pending);
  await ctx.reply(`✅ *${p.name}* saved as passenger.\n\nAdded to the current QR.`, { parse_mode: "Markdown" });
  // Generate QR now
  return runPreset(ctx, pending.presetNum, [{
    name: p.name, docType: p.docType, docNumber: p.docNumber, nationality: p.nationality,
  }], false);
});

bot.action("psnd_noop", async (ctx) => {
  await ctx.answerCbQuery("Just send a photo directly in this chat");
});

// ============================================================
//  Photo handler — intelligent routing
// ============================================================
bot.on("photo", async (ctx) => {
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const presets = Store.getAllPresets(userId);
  const wiz = Store.getWizard(userId);

  if (!Object.keys(presets).length) return ctx.reply(t(lang, "no_vehicles"));

  const photo = ctx.message.photo[ctx.message.photo.length - 1];

  // ── If user is in "select passengers for preset N" flow ──
  // → treat photo as a new passenger, OCR it, auto-add
  if (wiz && wiz.step === "select_passengers") {
    return scanAndAddPassenger(ctx, userId, wiz.slot, photo.file_id, true);
  }

  // ── Otherwise: photo sent standalone ──
  // → ask: which preset to use this photo with
  Store.stashPhoto(userId, ctx.message.message_id, photo.file_id);

  const btns = [];
  for (let i = 1; i <= 9; i++) {
    const p = presets[i];
    if (!p) continue;
    const em = VEHICLE_EMOJI[p.type] || "🚗";
    btns.push([Markup.button.callback(`${em} Preset ${i}: ${p.vehicle}`, `pfoto_${i}_${ctx.message.message_id}`)]);
  }
  btns.push([Markup.button.callback(t(lang, "btn_cancel"), "back_to_menu")]);

  await ctx.reply(
    `📷 ID photo received. Which vehicle for this QR?\n_The photo will be scanned as a passenger._`,
    { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) }
  );
});

bot.action(/^pfoto_(\d+)_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery("Scanning...");
  const userId = String(ctx.from.id);
  const num = parseInt(ctx.match[1]);
  const msgId = ctx.match[2];
  const fileId = Store.getStashedPhoto(userId, msgId);
  if (!fileId) return ctx.reply("Photo expired. Send again.");
  return scanAndAddPassenger(ctx, userId, num, fileId, true);
});

// ── Helper: scan photo, show 5-sec confirm, auto-proceed if no reject ──
async function scanAndAddPassenger(ctx, userId, presetNum, fileId, withAutoConfirm) {
  try {
    // Show "scanning" message immediately for feedback
    const scanningMsg = await ctx.reply(
      `📷  *Scanning ID photo...*\n\n_Reading the document with OCR_\n_This takes 5-10 seconds_`,
      { parse_mode: "Markdown" }
    );

    const link = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(link.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mediaLike = { data: buffer.toString("base64"), mimetype: "image/jpeg" };
    const passengers = await parsePassengerPhoto(mediaLike, 1);

    // Remove the "scanning" message
    try { await ctx.telegram.deleteMessage(ctx.chat.id, scanningMsg.message_id); } catch {}

    if (!passengers.length) {
      return ctx.reply(
        "⚠️ *Couldn't read ID from photo*\n\nTry:\n• A clearer, well-lit photo\n• Flat against the document\n• Or type the ID manually below",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("⌨️ Type ID manually", "padd_manual")],
            [Markup.button.callback("◀ Back", `qrp_${presetNum}`)],
          ]),
        }
      );
    }

    const p = passengers[0];
    const pending = { ...p, presetNum };
    Store.setPendingPassenger(userId, pending);

    // BIG, CLEAR card showing the extracted name prominently
    const scanCard =
      `╔═══════════════════════╗\n` +
      `║  ✨  *ID AUTO-READ*  ✨   ║\n` +
      `╚═══════════════════════╝\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤  *NAME EXTRACTED:*\n\n` +
      `*${p.name.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🆔  *Document:*  ${p.docType}\n` +
      `🔢  *Number:*  \`${p.docNumber}\`\n` +
      `🌍  *Nationality:*  ${p.nationality}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏳  *Auto-continuing in 5 seconds...*\n\n` +
      `_If anything looks wrong, tap below._\n` +
      `_Otherwise just wait — I'll save them and make the QR._`;

    const confirmMsg = await ctx.reply(scanCard, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("❌  Wrong — let me type it", `pconf_reject_${presetNum}`)],
        [Markup.button.callback("✅  Correct — proceed now", `pconf_accept_${presetNum}`)],
      ]),
    });

    // ── 5-second auto-accept ──
    setTimeout(async () => {
      const stillPending = Store.getPendingPassenger(userId);
      if (!stillPending) return; // user already tapped something
      Store.clearPendingPassenger(userId);
      const saved = Store.addOrGetPassenger(userId, stillPending);
      try {
        await ctx.telegram.editMessageText(
          ctx.chat.id, confirmMsg.message_id, undefined,
          `✅  *${saved.name}*  saved as passenger\n\n` +
          `🆔  ${saved.docType} · \`${saved.docNumber}\`\n\n` +
          `_Generating QR now..._`,
          { parse_mode: "Markdown" }
        );
      } catch {}
      await runPreset(ctx, presetNum, [{
        name: saved.name, docType: saved.docType, docNumber: saved.docNumber, nationality: saved.nationality,
      }], false);
    }, 5000);
  } catch (e) {
    await ctx.reply(`❌ Photo error: ${e.message}`);
  }
}

// ============================================================
//  Core: generate QR
// ============================================================
async function runPreset(ctx, num, passengers, testMode) {
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const preset = Store.getPreset(userId, num);
  if (!preset) return ctx.reply(`❌ Preset ${num} not found.`);

  if (!testMode) {
    const check = Store.canGenerateQR(userId);
    if (!check.allowed) return showUpgradePrompt(ctx);
  }

  const em = VEHICLE_EMOJI[preset.type] || "🚗";

  // Build detailed passenger line showing their names (if we have them)
  let paxLine;
  let paxDetails = "";
  if (passengers.length === 0) {
    paxLine = `🧍  Solo trip`;
  } else if (passengers.length === 1) {
    paxLine = `👥  With 1 passenger`;
    const p = passengers[0];
    const displayName = p.name || `ID: ${p.docNumber}  _(name will be auto-fetched)_`;
    paxDetails = `\n*Passenger:*\n• ${displayName}`;
  } else {
    paxLine = `👥  With ${passengers.length} passengers`;
    paxDetails = `\n*Passengers:*\n` + passengers.map(p => {
      const displayName = p.name || `ID: ${p.docNumber}  _(name will be auto-fetched)_`;
      return `• ${displayName}`;
    }).join("\n");
  }

  const generatingCard =
    (testMode ? `🧪  *TEST MODE*\n_Screenshots will follow_\n\n` : "") +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `⏳  *GENERATING QR...*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `${em}  *${preset.vehicle}*  ·  ${preset.type}\n` +
    `🚪  ${preset.port}\n` +
    `${paxLine}` +
    `${paxDetails}\n\n` +
    `_Opening immigration website..._\n` +
    `_This takes about 15-20 seconds_`;

  await ctx.reply(generatingCard, { parse_mode: "Markdown" });

  // Send periodic progress updates so user isn't left wondering
  let progressMsgId = null;
  const progressInterval = setInterval(async () => {
    try {
      if (progressMsgId) {
        await ctx.telegram.deleteMessage(ctx.chat.id, progressMsgId).catch(() => {});
      }
      const m = await ctx.reply("⏳ _Still working..._", { parse_mode: "Markdown" });
      progressMsgId = m.message_id;
    } catch {}
  }, 20000); // every 20 seconds

  try {
    // Hard timeout — if QR takes more than 90 seconds, abort and tell user
    const result = await Promise.race([
      QRGenerator.generate({
        vehicleNumber: preset.vehicle,
        type: preset.type,
        port: preset.port,
        driverid: preset.driverid,
        passengers,
        date: new Date().toISOString().split("T")[0],
        debug: testMode,
      }),
      new Promise((_, rej) => setTimeout(() =>
        rej(new Error("QR generation timed out after 90 seconds. Immigration site may be slow or down.")),
        90000
      )),
    ]);

    clearInterval(progressInterval);
    if (progressMsgId) await ctx.telegram.deleteMessage(ctx.chat.id, progressMsgId).catch(() => {});

    if (testMode && result.stepScreenshots?.length) {
      for (const s of result.stepScreenshots) {
        try {
          await ctx.replyWithPhoto({ source: s.path }, { caption: `🧪  ${s.label.replace(/_/g, " ")}` });
          await new Promise(r => setTimeout(r, 400));
        } catch {}
      }
    }

    if (result.notRegistered) {
      const notRegCard =
        `━━━━━━━━━━━━━━━━━━━\n` +
        `❌  *ID NOT FOUND*\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `Your ID *${preset.driverid}* is not registered in the immigration database.\n\n` +
        `*What to do:*\n` +
        `1️⃣  Visit the pedestrian terminal in person\n` +
        `2️⃣  Register yourself there\n` +
        `3️⃣  Come back and try again\n\n` +
        `_This is a government requirement we can't skip._`;
      return ctx.reply(notRegCard, { parse_mode: "Markdown" });
    }

    if (!testMode) Store.decrementTrial(userId);

    // ── Save manually-entered passengers using the name fetched from govt DB ──
    const savedNames = []; // { docNumber, name } — for caption display
    if (!testMode && passengers.length && result.fetchedPassengerNames) {
      for (const p of passengers) {
        const match = result.fetchedPassengerNames.find(f => f.docNumber === p.docNumber);
        const realName = match?.fetchedName || p.name;

        if (p._isManualEntry) {
          // Only save if we got a real name from the govt database
          if (match?.fetchedName) {
            const saved = Store.addOrGetPassenger(userId, {
              name: match.fetchedName,
              docType: p.docType,
              docNumber: p.docNumber,
              nationality: p.nationality,
            });
            savedNames.push({ docNumber: p.docNumber, name: saved.name, wasJustSaved: true });
            // Notify user this was saved with real name
            await ctx.reply(
              `✅  *Passenger saved to your list:*\n\n` +
              `👤  *${saved.name}*\n` +
              `🆔  \`${saved.docNumber}\`\n\n` +
              `_Next time, just tap their name — no typing needed._`,
              { parse_mode: "Markdown" }
            );
          } else {
            // No name fetched — don't save, warn user
            savedNames.push({ docNumber: p.docNumber, name: p.name || "Unknown", wasJustSaved: false });
            await ctx.reply(
              `⚠️  *Passenger not found in database*\n\n` +
              `ID \`${p.docNumber}\` was used for the QR but *not saved* to your list because the name couldn't be auto-fetched.\n\n` +
              `_This might happen if the ID is incorrect or the person isn't registered._`,
              { parse_mode: "Markdown" }
            );
          }
        } else {
          savedNames.push({ docNumber: p.docNumber, name: realName });
        }
      }
    } else {
      // No fetched names info (test mode or no passengers) — use what we had
      for (const p of passengers) savedNames.push({ docNumber: p.docNumber, name: p.name || "Passenger" });
    }

    // Build passenger list for final QR caption using resolved names
    let paxCaptionLine = paxLine;
    if (savedNames.length > 0) {
      paxCaptionLine += `\n` + savedNames.map(p => `   • ${p.name}`).join("\n");
    }

    const qrCaption =
      (testMode ? `🧪  *TEST RESULT*\n\n` : "") +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🇧🇹  *BHUTAN ENTRY QR*  🇧🇹\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📅  ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}\n` +
      `${em}  ${preset.vehicle}  ·  ${preset.type}\n` +
      `🚪  ${preset.port}\n` +
      (result.driverName ? `👤  ${result.driverName}\n` : "") +
      `${paxCaptionLine}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `✅  *Show this QR at the gate*\n` +
      `📱  _This photo stays in chat only_`;

    await ctx.replyWithPhoto({ source: result.qrImagePath }, { caption: qrCaption, parse_mode: "Markdown" });

    // Delete server-side QR file — we don't keep it
    try { require("fs").unlinkSync(result.qrImagePath); } catch {}

    if (!testMode) {
      const sub = Store.getSubscription(userId);
      if (sub.plan === "trial") {
        if (sub.trialCount > 0) {
          await ctx.reply(`🎁  *${sub.trialCount} free QR${sub.trialCount !== 1 ? "s" : ""} left*`, { parse_mode: "Markdown" });
        }
        if (sub.trialCount === 0) await showUpgradePrompt(ctx);
      }
    }
  } catch (e) {
    clearInterval(progressInterval);
    if (progressMsgId) await ctx.telegram.deleteMessage(ctx.chat.id, progressMsgId).catch(() => {});

    if (testMode && e.stepScreenshots?.length) {
      for (const s of e.stepScreenshots) {
        try { await ctx.replyWithPhoto({ source: s.path }, { caption: `🧪 ${s.label.replace(/_/g, " ")}` }); } catch {}
      }
    }
    await ctx.reply(t(lang, "failed", e.message));
  }
}

// ============================================================
//  Subscription
// ============================================================
async function showUpgradePrompt(ctx) {
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const sub = Store.getSubscription(userId);
  const msg = sub.plan === "expired" ? t(lang, "subscription_expired") : t(lang, "trial_over");
  await ctx.reply(msg, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback(`${t(lang, "upgrade_now")} — ₹${PRICE_INR}/year`, "upgrade")],
      [Markup.button.callback(t(lang, "btn_back"), "back_to_menu")],
    ]),
  });
}

bot.action("show_subscription", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const sub = Store.getSubscription(userId);

  let txt = `━━━━━━━━━━━━━━━━━━━\n`;
  txt    += `💳  *YOUR SUBSCRIPTION*\n`;
  txt    += `━━━━━━━━━━━━━━━━━━━\n\n`;

  if (sub.plan === "paid") {
    const until = new Date(sub.paidUntil).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const daysLeft = Math.ceil((new Date(sub.paidUntil) - new Date()) / 86400000);
    txt += `💎  *PREMIUM — Unlimited*\n\n`;
    txt += `📅  Valid until *${until}*\n`;
    txt += `⏳  *${daysLeft}* days remaining\n`;
    txt += `🎫  Total QRs: *${sub.totalQRs || 0}*\n\n`;
    txt += `✨  _Thank you for supporting the bot!_`;
  } else if (sub.plan === "trial") {
    txt += `🎁  *FREE TRIAL*\n\n`;
    txt += `QRs remaining:  *${sub.trialCount}*\n`;
    txt += `QRs used so far:  *${sub.totalQRs || 0}*\n\n`;
    txt += `━━━━━━━━━━━━━━━━━━━\n`;
    txt += `💎  *UPGRADE BENEFITS*\n`;
    txt += `━━━━━━━━━━━━━━━━━━━\n\n`;
    txt += `✅  Unlimited QRs for 1 year\n`;
    txt += `✅  Auto-daily schedule\n`;
    txt += `✅  Priority support\n`;
    txt += `✅  Just ₹${PRICE_INR}/year`;
  } else {
    txt += `⚠️  *TRIAL ENDED*\n\n`;
    txt += `Upgrade to continue using the bot.\n\n`;
    txt += `💎  ₹${PRICE_INR}/year — unlimited QRs`;
  }

  const btns = [];
  if (sub.plan !== "paid") {
    btns.push([Markup.button.callback(`💎  Upgrade — ₹${PRICE_INR}/year`, "upgrade")]);
  }
  btns.push([Markup.button.callback("◀  Back", "back_to_menu")]);
  await ctx.reply(txt, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
});

bot.action("upgrade", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  if (!UPI_ID) return ctx.reply("⚠️ Payment not configured yet. Admin will add soon.");

  const orderId = `BHT${Date.now().toString().slice(-8)}${userId.slice(-4)}`;
  const upiLink = Payments.buildUpiLink({ pa: UPI_ID, pn: PAYEE_NAME, am: PRICE_INR, tn: `QRBot-${orderId}`, tr: orderId });
  Store.recordPayment(userId, { amount: PRICE_INR, orderId, status: "pending" });

  const paymentCard =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `💎  *UPGRADE TO PREMIUM*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `💰  *₹${PRICE_INR} / year*\n` +
    `✅  Unlimited QRs\n` +
    `✅  Auto-daily schedule\n` +
    `✅  Priority support\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🧾  *ORDER*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Order ID:  \`${orderId}\`\n` +
    `Amount:     ₹${PRICE_INR}\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `📱  *HOW TO PAY*\n\n` +
    `1️⃣  Tap  *Pay via UPI*  below\n` +
    `2️⃣  Complete in GPay / PhonePe / Paytm\n` +
    `3️⃣  Come back, tap  *I have paid*\n\n` +
    `_Admin activates within a few hours_`;

  await ctx.reply(paymentCard, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.url(`📱  Pay ₹${PRICE_INR} via UPI`, upiLink)],
      [Markup.button.callback("✅  I have paid", `paid_${orderId}`)],
      [Markup.button.callback("◀  Back", "back_to_menu")],
    ]),
  });
  if (ADMIN_ID) { try { await bot.telegram.sendMessage(ADMIN_ID, `💰 Payment initiated\nUser: ${ctx.from.first_name} (${userId})\n₹${PRICE_INR}\n${orderId}`); } catch {} }
});

bot.action(/^paid_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const orderId = ctx.match[1];
  const thanksCard =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🙏  *THANK YOU!*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Your payment claim has been sent.\n\n` +
    `⏳  Admin will verify and activate within a few hours.\n` +
    `You'll get a notification here when ready.\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `Order ID:  \`${orderId}\`\n` +
    `━━━━━━━━━━━━━━━━━━━`;
  await ctx.reply(thanksCard, { parse_mode: "Markdown" });
  if (ADMIN_ID) {
    try {
      await bot.telegram.sendMessage(
        ADMIN_ID,
        `🔔 *Payment claim*\nUser: ${ctx.from.first_name} (\`${userId}\`)\nUsername: @${ctx.from.username || "none"}\nOrder: \`${orderId}\`\n₹${PRICE_INR}\n\nTo activate: \`/approve ${userId}\``,
        { parse_mode: "Markdown" }
      );
    } catch {}
  }
});

// ============================================================
//  Admin
// ============================================================
bot.command("approve", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const target = ctx.message.text.split(/\s+/)[1];
  if (!target) return ctx.reply("Usage: /approve <userId>");
  const until = Store.activateSubscription(target, 365);
  await ctx.reply(`✅ Activated ${target} until ${until.toLocaleDateString("en-IN")}`);
  try {
    const lang = Store.getLanguage(target);
    await bot.telegram.sendMessage(target, `🎉 ${t(lang, "subscription_active", until.toLocaleDateString("en-IN"))}\n\nThank you!`, { parse_mode: "Markdown" });
  } catch {}
});

bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const s = Store.getStats();
  await ctx.reply(
    `📊 *Stats*\n👥 Users: ${s.total}\n💎 Paid: ${s.paid}\n🎁 Trial: ${s.trial}\n⏱️ Expired: ${s.expired}\n🎫 QRs: ${s.totalQRs}\n💰 Revenue: ₹${s.revenue}`,
    { parse_mode: "Markdown" }
  );
});

// ============================================================
//  Delete preset menu
// ============================================================
bot.action("delete_menu", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const presets = Store.getAllPresets(userId);
  if (!Object.keys(presets).length) return ctx.reply("No vehicles to remove.");
  const btns = [];
  for (let i = 1; i <= 9; i++) {
    const p = presets[i]; if (!p) continue;
    const em = VEHICLE_EMOJI[p.type] || "🚗";
    btns.push([Markup.button.callback(`🗑  ${em}  ${p.vehicle}`, `del_${i}`)]);
  }
  btns.push([Markup.button.callback("◀  Back", "back_to_menu")]);

  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🗑  *REMOVE VEHICLE*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Which vehicle to remove?\n\n` +
    `⚠️  _This also cancels its auto-schedule._`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
});

bot.action(/^del_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  Store.deletePreset(userId, ctx.match[1]);
  cancelSchedule(userId, ctx.match[1]);
  await ctx.reply(`🗑️ Deleted.`);
  return showMenu(ctx);
});

// ============================================================
//  Passenger manager
// ============================================================
bot.action("passengers_menu", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const ps = Store.getPassengers(userId);

  if (!ps.length) {
    const emptyMsg =
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👥  *MY PEOPLE*\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `_No passengers saved yet._\n\n` +
      `*How to add:*\n\n` +
      `1️⃣  Tap  *👥 With others*  on any vehicle\n` +
      `2️⃣  Send a photo of their ID, OR\n` +
      `3️⃣  Type their ID number manually\n\n` +
      `They auto-save for next time ✨`;
    return ctx.reply(emptyMsg, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("◀  Back", "back_to_menu")]]),
    });
  }

  let txt = `━━━━━━━━━━━━━━━━━━━\n`;
  txt    += `👥  *MY PEOPLE*  (${ps.length})\n`;
  txt    += `━━━━━━━━━━━━━━━━━━━\n\n`;
  txt    += `_Most-used on top_\n\n`;
  ps.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    txt += `${medal}  *${p.name}*\n`;
    txt += `      ${p.docType} · ${p.docNumber}\n`;
    txt += `      Used ${p.useCount || 1}x\n\n`;
  });

  const btns = ps.map(p => [Markup.button.callback(`🗑  Remove ${p.name}`, `pdel_${p.id}`)]);
  btns.push([Markup.button.callback("◀  Back", "back_to_menu")]);
  await ctx.reply(txt, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
});

bot.action(/^pdel_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  Store.deletePassenger(userId, parseInt(ctx.match[1]));
  await ctx.reply("🗑️ Passenger deleted.");
});

// ============================================================
//  Schedule
// ============================================================
bot.action("schedule_menu", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const presets = Store.getAllPresets(userId);
  if (!Object.keys(presets).length) return ctx.reply("Add a vehicle first.");

  const btns = [];
  for (let i = 1; i <= 9; i++) {
    const p = presets[i]; if (!p) continue;
    const em = VEHICLE_EMOJI[p.type] || "🚗";
    const s = Store.getAllSchedules(userId)[i];
    btns.push([Markup.button.callback(s ? `${em}  ${p.vehicle}  ⏰ ${s}` : `${em}  ${p.vehicle}`, `sched_pick_${i}`)]);
  }
  btns.push([Markup.button.callback("◀  Back", "back_to_menu")]);

  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `⏰  *AUTO-DAILY QR*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Pick a vehicle to set its daily auto-send time.\n\n` +
    `_Active schedules show_ ⏰ _next to the name._`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
});

bot.action(/^sched_pick_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const lang = langOf(ctx);
  const num = ctx.match[1];
  const times = ["05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "10:00"];
  const btns = [];
  for (let i = 0; i < times.length; i += 3) {
    btns.push(times.slice(i, i + 3).map(tv => Markup.button.callback(`⏰  ${tv}`, `sched_set_${num}_${tv}`)));
  }
  btns.push([Markup.button.callback("⌨️  Custom time (type it)", `sched_custom_${num}`)]);
  btns.push([Markup.button.callback("🔕  Turn Off", `sched_off_${num}`)]);
  btns.push([Markup.button.callback("◀  Back", "back_to_menu")]);

  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `⏰  *VEHICLE ${num} — PICK TIME*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `Select from quick times below, or tap  *Custom time*  to type any time.`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
});

bot.action(/^sched_custom_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  Store.setWizard(userId, { slot: ctx.match[1], step: "sched_custom", data: {} });
  await ctx.reply(
    `⌨️ *Type the time for vehicle ${ctx.match[1]}*\n\nAny format works:\n• *9:36 am*\n• *7:30 PM*\n• *19:45*\n• *6* (= 6:00 AM)`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback(t(lang, "btn_cancel"), "cancel_wizard")]]),
    }
  );
});

bot.action(/^sched_set_(\d+)_(\d+:\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const [num, time] = [ctx.match[1], ctx.match[2]];
  Store.saveSchedule(userId, num, time);
  const [h, m] = time.split(":").map(Number);
  setScheduleForPreset(userId, num, h, m);
  await ctx.reply(t(lang, "schedule_set", num, time), { parse_mode: "Markdown" });
});

bot.action(/^sched_off_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  Store.removeSchedule(userId, ctx.match[1]);
  cancelSchedule(userId, ctx.match[1]);
  await ctx.reply(t(lang, "schedule_off", ctx.match[1]));
});

function parseFlexibleTime(s) {
  if (!s) return null;
  let x = s.trim().toLowerCase().replace(/\s+/g, "");
  let ampm = null;
  if (x.endsWith("am")) { ampm = "am"; x = x.slice(0, -2); }
  else if (x.endsWith("pm")) { ampm = "pm"; x = x.slice(0, -2); }
  else if (x.endsWith("a")) { ampm = "am"; x = x.slice(0, -1); }
  else if (x.endsWith("p")) { ampm = "pm"; x = x.slice(0, -1); }
  x = x.replace(/[.\s]/g, ":");
  let h, m;
  if (x.includes(":")) { const [a, b] = x.split(":"); h = parseInt(a); m = parseInt(b); }
  else { h = parseInt(x); m = 0; }
  if (isNaN(h) || isNaN(m) || m < 0 || m > 59) return null;
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

// ============================================================
//  Test mode menu
// ============================================================
bot.action("test_menu", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const presets = Store.getAllPresets(userId);
  if (!Object.keys(presets).length) return ctx.reply("Add a vehicle first.");
  const btns = [];
  for (let i = 1; i <= 9; i++) {
    const p = presets[i]; if (!p) continue;
    const em = VEHICLE_EMOJI[p.type] || "🚗";
    btns.push([Markup.button.callback(`🧪  Test  ${em}  ${p.vehicle}`, `tst_${i}`)]);
  }
  btns.push([Markup.button.callback("◀  Back", "back_to_menu")]);

  const msg =
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🧪  *TEST MODE*\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `See the bot fill the immigration form *step-by-step*.\n\n` +
    `You'll receive screenshots of:\n` +
    `1️⃣  Empty form\n` +
    `2️⃣  Vehicle filled\n` +
    `3️⃣  Driver details page\n` +
    `4️⃣  ID entered + searched\n` +
    `5️⃣  Passenger page\n` +
    `6️⃣  Declaration ticked\n` +
    `7️⃣  Final QR\n\n` +
    `✨  _No credit used — it's free_`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...Markup.inlineKeyboard(btns) });
});

bot.action(/^tst_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery("Running test...");
  return runPreset(ctx, parseInt(ctx.match[1]), [], true);
});

// ============================================================
//  Text handler — wizard input
// ============================================================
bot.on("text", async (ctx) => {
  const userId = String(ctx.from.id);
  const lang = langOf(ctx);
  const body = ctx.message.text.trim();
  const wiz = Store.getWizard(userId);

  if (body.startsWith("/")) return;

  if (wiz) {
    // Preset wizard
    if (wiz.step === "vehicle") {
      wiz.data.vehicle = body.toUpperCase();
      Store.setWizard(userId, { ...wiz, step: "driverid" });
      await ctx.reply(`✅  *Vehicle number:* ${wiz.data.vehicle}`, { parse_mode: "Markdown" });
      return askDriverId(ctx);
    }
    if (wiz.step === "driverid") {
      wiz.data.driverid = body;
      Store.savePreset(userId, wiz.slot, wiz.data);
      Store.clearWizard(userId);
      const em = VEHICLE_EMOJI[wiz.data.type] || "🚗";

      const successCard =
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🎉  *VEHICLE SAVED!*\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `*Slot ${wiz.slot}*\n\n` +
        `${em}  ${wiz.data.type}\n` +
        `🔢  ${wiz.data.vehicle}\n` +
        `🚪  ${wiz.data.port}\n` +
        `🆔  ${wiz.data.driverid}\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `👉  Tap the vehicle button anytime to generate QR\n` +
        `⏰  Tap  *Auto-Daily*  to schedule it`;

      await ctx.reply(successCard, { parse_mode: "Markdown" });
      return showMenu(ctx);
    }
    if (wiz.step === "port" || wiz.step === "type") return ctx.reply("👆  Please tap one of the buttons above.");

    // Manual passenger add — DON'T save yet, just generate QR and let the site
    // fetch the real name. We'll save after QR is made with the real name.
    if (wiz.step === "add_passenger_manual") {
      const docNumber = body;
      Store.clearWizard(userId);
      await ctx.reply(
        `⏳  *Looking up ID:*  \`${docNumber}\`\n\n` +
        `_I'll fetch the name from the immigration database and then generate the QR._\n` +
        `_If found, I'll save this passenger for next time._`,
        { parse_mode: "Markdown" }
      );

      // Pass as passenger WITHOUT saving to Store yet
      // Mark with _isManualEntry: true so runPreset knows to save after fetching real name
      return runPreset(ctx, wiz.slot, [{
        name: null,                    // no name yet — site will fetch it
        docType: "Passport",
        docNumber,
        nationality: "Indian",         // foreign tab = Indian (most common)
        _isManualEntry: true,          // flag: save this after fetching
      }], false);
    }

    // Custom schedule
    if (wiz.step === "sched_custom") {
      const num = wiz.slot;
      const parsed = parseFlexibleTime(body);
      if (!parsed) return ctx.reply(`⚠️ Couldn't understand. Try: *9:36 am*, *19:45*, or *6*`, { parse_mode: "Markdown" });
      Store.saveSchedule(userId, num, parsed);
      Store.clearWizard(userId);
      const [h, m] = parsed.split(":").map(Number);
      setScheduleForPreset(userId, num, h, m);
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      await ctx.reply(`${t(lang, "schedule_set", num, parsed)}\n\n⏰ = *${h12}:${String(m).padStart(2,"0")} ${ampm}*`, { parse_mode: "Markdown" });
      return showMenu(ctx);
    }
  }

  return showMenu(ctx);
});

// ============================================================
//  Scheduler
// ============================================================
const activeJobs = {};

function setScheduleForPreset(userId, num, h, m) {
  const key = `${userId}-${num}`;
  if (activeJobs[key]) activeJobs[key].cancel();
  activeJobs[key] = schedule.scheduleJob(`${m} ${h} * * *`, async () => {
    const preset = Store.getPreset(userId, num);
    if (!preset) return;
    const check = Store.canGenerateQR(userId);
    if (!check.allowed) {
      try { await bot.telegram.sendMessage(userId, `⏰ Auto-QR skipped — subscription expired. /menu → Subscription`); } catch {}
      return;
    }
    try {
      const result = await QRGenerator.generate({
        vehicleNumber: preset.vehicle, type: preset.type, port: preset.port,
        driverid: preset.driverid, passengers: [], date: new Date().toISOString().split("T")[0],
      });
      if (result.notRegistered) { await bot.telegram.sendMessage(userId, `❌ Auto-QR ${num}: ID not registered`); return; }
      Store.decrementTrial(userId);
      const em = VEHICLE_EMOJI[preset.type] || "🚗";
      await bot.telegram.sendPhoto(userId, { source: result.qrImagePath }, {
        caption: `🇧🇹 *Daily Auto-QR (${num})*\n📅 ${result.date}\n${em} ${preset.vehicle}\n🚪 ${preset.port}`,
        parse_mode: "Markdown",
      });
      try { require("fs").unlinkSync(result.qrImagePath); } catch {}
    } catch (e) {
      await bot.telegram.sendMessage(userId, `❌ Auto-QR ${num} failed: ${e.message}`);
    }
  });
}

function cancelSchedule(userId, num) {
  const key = `${userId}-${num}`;
  if (activeJobs[key]) { activeJobs[key].cancel(); delete activeJobs[key]; }
}

function initScheduler() {
  for (const { userId, num, time } of Store.getAllUserSchedules()) {
    const [h, m] = time.split(":").map(Number);
    setScheduleForPreset(userId, num, h, m);
    console.log(`📅 Restored: ${userId} preset ${num} @ ${time}`);
  }
}

// ============================================================
//  Launch
// ============================================================
bot.launch().then(() => {
  console.log("\n✅ Bhutan QR Bot (FINAL) is LIVE!");
  console.log(`💰 Price: ₹${PRICE_INR}/year | 👤 Admin: ${ADMIN_ID || "(unset)"} | 💳 UPI: ${UPI_ID || "(unset)"}\n`);
  initScheduler();
  // Warm up the headless browser in the background so first QR is fast too
  if (QRGenerator.warmupBrowser) {
    QRGenerator.warmupBrowser();
  }
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
