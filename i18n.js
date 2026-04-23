// ============================================================
//  Language strings — English, Hindi, Bengali
// ============================================================

const L = {
  en: {
    welcome: (name) => `👋 Namaste ${name}!\n\n🇧🇹 Welcome to *Bhutan QR Bot*\n\nI'll make your Bhutan entry QR code automatically — no more filling forms daily!\n\nLet's set up your first vehicle 👇`,
    menu_title: "🇧🇹 *Bhutan QR Bot*",
    your_vehicles: "*Your vehicles:*\n_Tap to generate today's QR_",
    no_vehicles: "No vehicles saved yet. Tap *➕ Add* to start.",

    btn_add_vehicle: "➕ Add My Vehicle",
    btn_add: "➕ Add",
    btn_delete: "🗑️ Delete",
    btn_schedule: "⏰ Schedule",
    btn_details: "📋 Details",
    btn_test: "🧪 Test Mode",
    btn_family: "👨‍👩‍👧 Family",
    btn_help: "❓ Help",
    btn_language: "🌐 Language",
    btn_subscription: "💳 Subscription",
    btn_back: "◀ Back",
    btn_cancel: "❌ Cancel",
    btn_how_it_works: "❓ How it works",

    step_port: "*Step 1 of 4 — 🚪 Port of Entry*\n\nTap your border crossing:",
    step_type: "*Step 2 of 4 — 🚗 Vehicle Type*\n\nTap your vehicle type:",
    step_vehicle: "*Step 3 of 4 — 🔢 Vehicle Number*\n\nType your vehicle number exactly as on the plate.\n\nExample: *WB 70K 0494*",
    step_driverid: "*Step 4 of 4 — 🆔 Your ID Number*\n\nType your CID/Passport *exactly* — including spaces.\n\nExample: *4996 2759 5134*\n\n_The immigration site will auto-fetch your name._",

    saved_port: (p) => `✅ Port: *${p}*`,
    saved_type: (e, t) => `✅ Type: *${e} ${t}*`,
    saved_vehicle: (v) => `✅ Vehicle: *${v}*`,
    saved_preset: (slot, e, type, v, port, id) => `🎉 *Vehicle ${slot} saved!*\n\n${e} ${type}\n🚗 ${v}\n🚪 ${port}\n🆔 ${id}`,

    generating: (num, e, v, type, port, pax) => `⏳ *Generating QR for Vehicle ${num}*\n\n${e} ${v} · ${type}\n🚪 ${port}\n👥 ${pax} passenger(s)\n\n_Please wait 30-60 seconds..._`,
    qr_ready: (e, v, type, port, name, pax) => `🇧🇹 *Bhutan Entry QR*\n📅 ${new Date().toLocaleDateString("en-IN")}\n${e} ${v} (${type})\n🚪 ${port}\n${name ? `👤 ${name}\n` : ""}👥 Passengers: ${pax}\n\n✅ Show this at the gate`,
    not_registered: (id) => `❌ *ID not found in system*\n\nYour ID *${id}* is not registered at immigration.\n\n➡️ Please visit the *pedestrian terminal* and register in person first.`,
    failed: (msg) => `❌ Failed: ${msg}\n\nTry again or recreate vehicle.`,

    trial_remaining: (n) => `🎁 *Free trial:* ${n} QR(s) remaining`,
    trial_over: `🔒 *Free trial over*\n\nYou've used all 3 free QR codes.\n\nSubscribe to get unlimited QRs for 1 year!`,
    subscription_active: (d) => `✅ *Premium active* — valid until ${d}`,
    subscription_expired: `⚠️ Your subscription has expired. Renew to continue.`,

    upgrade_now: "💎 Upgrade Now",
    how_to_pay: (amount, id) => `💳 *Premium — ₹${amount}/year*\n\nUnlimited QRs for 1 year\nOrder ID: ${id}\n\n👇 Tap below to pay via UPI`,

    schedule_set: (num, t) => `⏰ *Schedule set!*\n\nVehicle ${num} will auto-send every day at *${t}* 🎉`,
    schedule_off: (num) => `🔕 Auto-schedule for vehicle ${num} turned off.`,
    pick_time: (num) => `Pick a time for vehicle ${num}:`,

    pick_language: "🌐 *Choose your language / भाषा चुनें / ভাষা বেছে নিন*",
    language_set: "✅ Language set to English",

    family_title: "*👨‍👩‍👧 Family Members*\n\n_Add family once, add to any trip with one tap_",
    no_family: "No family members saved yet.",
    add_family: "➕ Add Family Member",
    family_added: (name) => `✅ Added: *${name}*`,
    family_name: "Type the family member's full name:",
    family_nationality: "Select nationality:",
    family_doctype: "Select ID type:",
    family_docnum: "Type their ID number (with spaces if any):",

    pick_who: "Which vehicle for this QR?",
    pick_passengers: "Who's travelling with you today?",
    solo: "🧍 Solo (just me)",
    with_family: "👨‍👩‍👧 With family",

    help_text: `📖 *How Bhutan QR Bot works*\n\n*Setup (2 min):*\nTap ➕ Add Vehicle → answer 4 questions\n\n*Daily use:*\nTap your vehicle button → QR arrives in 60 seconds ⚡\n\n*Auto-daily:*\nTap ⏰ Schedule — QR comes every morning 🌅\n\n*Family:*\nTap 👨‍👩‍👧 Family to save members, then add to any trip\n\n*Test mode:*\nTap 🧪 Test on any vehicle to see step-by-step screenshots of what the bot does\n\n_Questions? Type them and I'll help._`,
  },

  hi: {
    welcome: (name) => `👋 नमस्ते ${name}!\n\n🇧🇹 *भूटान QR बॉट में स्वागत*\n\nमैं आपका भूटान एंट्री QR कोड अपने आप बनाऊंगा — रोज़ फॉर्म भरने की ज़रूरत नहीं!\n\nचलिए पहली गाड़ी सेट करें 👇`,
    menu_title: "🇧🇹 *भूटान QR बॉट*",
    your_vehicles: "*आपकी गाड़ियाँ:*\n_आज का QR पाने के लिए दबाएं_",
    no_vehicles: "अभी कोई गाड़ी सेव नहीं है। *➕ जोड़ें* दबाएं।",

    btn_add_vehicle: "➕ मेरी गाड़ी जोड़ें",
    btn_add: "➕ जोड़ें",
    btn_delete: "🗑️ हटाएं",
    btn_schedule: "⏰ शेड्यूल",
    btn_details: "📋 विवरण",
    btn_test: "🧪 टेस्ट मोड",
    btn_family: "👨‍👩‍👧 परिवार",
    btn_help: "❓ सहायता",
    btn_language: "🌐 भाषा",
    btn_subscription: "💳 सब्सक्रिप्शन",
    btn_back: "◀ वापस",
    btn_cancel: "❌ रद्द",
    btn_how_it_works: "❓ कैसे काम करता है",

    step_port: "*चरण 1/4 — 🚪 प्रवेश द्वार*\n\nअपना बॉर्डर चुनें:",
    step_type: "*चरण 2/4 — 🚗 गाड़ी का प्रकार*\n\nअपनी गाड़ी चुनें:",
    step_vehicle: "*चरण 3/4 — 🔢 गाड़ी नंबर*\n\nनंबर प्लेट पर जो लिखा है वही टाइप करें।\n\nउदाहरण: *WB 70K 0494*",
    step_driverid: "*चरण 4/4 — 🆔 आपका ID नंबर*\n\nअपना CID/पासपोर्ट *ठीक वैसे ही* टाइप करें — स्पेस सहित।\n\nउदाहरण: *4996 2759 5134*\n\n_आपका नाम अपने आप भर जाएगा।_",

    saved_port: (p) => `✅ पोर्ट: *${p}*`,
    saved_type: (e, t) => `✅ प्रकार: *${e} ${t}*`,
    saved_vehicle: (v) => `✅ गाड़ी: *${v}*`,
    saved_preset: (slot, e, type, v, port, id) => `🎉 *गाड़ी ${slot} सेव हो गई!*\n\n${e} ${type}\n🚗 ${v}\n🚪 ${port}\n🆔 ${id}`,

    generating: (num, e, v, type, port, pax) => `⏳ *गाड़ी ${num} का QR बन रहा है*\n\n${e} ${v} · ${type}\n🚪 ${port}\n👥 ${pax} यात्री\n\n_30-60 सेकंड रुकें..._`,
    qr_ready: (e, v, type, port, name, pax) => `🇧🇹 *भूटान एंट्री QR*\n📅 ${new Date().toLocaleDateString("hi-IN")}\n${e} ${v} (${type})\n🚪 ${port}\n${name ? `👤 ${name}\n` : ""}👥 यात्री: ${pax}\n\n✅ गेट पर दिखाएं`,
    not_registered: (id) => `❌ *ID सिस्टम में नहीं मिली*\n\nआपकी ID *${id}* इमिग्रेशन डेटाबेस में रजिस्टर नहीं है।\n\n➡️ कृपया *पैदल टर्मिनल* पर जाकर पहले रजिस्टर करें।`,
    failed: (msg) => `❌ असफल: ${msg}\n\nदोबारा कोशिश करें।`,

    trial_remaining: (n) => `🎁 *फ्री ट्रायल:* ${n} QR बाकी`,
    trial_over: `🔒 *फ्री ट्रायल खत्म*\n\nआपने 3 फ्री QR उपयोग कर लिए।\n\n1 साल के लिए अनलिमिटेड QR पाने के लिए सब्सक्राइब करें!`,
    subscription_active: (d) => `✅ *प्रीमियम सक्रिय* — ${d} तक वैध`,
    subscription_expired: `⚠️ आपकी सब्सक्रिप्शन खत्म हो गई। रिन्यू करें।`,

    upgrade_now: "💎 अभी अपग्रेड करें",
    how_to_pay: (amount, id) => `💳 *प्रीमियम — ₹${amount}/साल*\n\n1 साल के लिए अनलिमिटेड QR\nऑर्डर ID: ${id}\n\n👇 UPI से भुगतान करने के लिए नीचे दबाएं`,

    schedule_set: (num, t) => `⏰ *शेड्यूल सेट!*\n\nगाड़ी ${num} हर दिन *${t}* बजे अपने आप आएगी 🎉`,
    schedule_off: (num) => `🔕 गाड़ी ${num} का शेड्यूल बंद।`,
    pick_time: (num) => `गाड़ी ${num} के लिए समय चुनें:`,

    pick_language: "🌐 *भाषा चुनें*",
    language_set: "✅ भाषा हिंदी में सेट",

    family_title: "*👨‍👩‍👧 परिवार के सदस्य*\n\n_एक बार जोड़ें, किसी भी यात्रा में तुरंत जोड़ें_",
    no_family: "अभी कोई परिवार सेव नहीं है।",
    add_family: "➕ सदस्य जोड़ें",
    family_added: (name) => `✅ जोड़ा गया: *${name}*`,
    family_name: "सदस्य का पूरा नाम टाइप करें:",
    family_nationality: "राष्ट्रीयता चुनें:",
    family_doctype: "ID का प्रकार चुनें:",
    family_docnum: "उनका ID नंबर टाइप करें (स्पेस सहित):",

    pick_who: "इस QR के लिए कौन सी गाड़ी?",
    pick_passengers: "आज किसके साथ यात्रा?",
    solo: "🧍 अकेले",
    with_family: "👨‍👩‍👧 परिवार के साथ",

    help_text: `📖 *भूटान QR बॉट कैसे काम करता है*\n\n*सेटअप (2 मिनट):*\n➕ गाड़ी जोड़ें → 4 सवालों के जवाब दें\n\n*रोज़ का उपयोग:*\nअपनी गाड़ी दबाएं → 60 सेकंड में QR ⚡\n\n*ऑटो-डेली:*\n⏰ शेड्यूल दबाएं — रोज़ सुबह खुद आएगा 🌅\n\n*परिवार:*\n👨‍👩‍👧 परिवार → सदस्य सेव करें, फिर किसी भी यात्रा में जोड़ें\n\n*टेस्ट मोड:*\n🧪 टेस्ट दबाएं → हर चरण का स्क्रीनशॉट मिलेगा`,
  },

  bn: {
    welcome: (name) => `👋 নমস্কার ${name}!\n\n🇧🇹 *ভুটান QR বটে স্বাগতম*\n\nআমি স্বয়ংক্রিয়ভাবে আপনার ভুটান এন্ট্রি QR কোড তৈরি করব — প্রতিদিন ফর্ম পূরণের দরকার নেই!\n\nচলুন প্রথম গাড়ি সেট আপ করি 👇`,
    menu_title: "🇧🇹 *ভুটান QR বট*",
    your_vehicles: "*আপনার গাড়ি:*\n_আজকের QR পেতে ট্যাপ করুন_",
    no_vehicles: "এখনো কোনো গাড়ি সেভ নেই। *➕ যোগ করুন* ট্যাপ করুন।",

    btn_add_vehicle: "➕ আমার গাড়ি যোগ করুন",
    btn_add: "➕ যোগ",
    btn_delete: "🗑️ মুছুন",
    btn_schedule: "⏰ সময়সূচী",
    btn_details: "📋 বিস্তারিত",
    btn_test: "🧪 টেস্ট মোড",
    btn_family: "👨‍👩‍👧 পরিবার",
    btn_help: "❓ সাহায্য",
    btn_language: "🌐 ভাষা",
    btn_subscription: "💳 সাবস্ক্রিপশন",
    btn_back: "◀ ফিরে যান",
    btn_cancel: "❌ বাতিল",
    btn_how_it_works: "❓ কীভাবে কাজ করে",

    step_port: "*ধাপ ১/৪ — 🚪 প্রবেশ বন্দর*\n\nআপনার সীমান্ত বেছে নিন:",
    step_type: "*ধাপ ২/৪ — 🚗 গাড়ির ধরন*\n\nআপনার গাড়ি বেছে নিন:",
    step_vehicle: "*ধাপ ৩/৪ — 🔢 গাড়ির নম্বর*\n\nনম্বর প্লেটে যা লেখা আছে সেটাই টাইপ করুন।\n\nউদাহরণ: *WB 70K 0494*",
    step_driverid: "*ধাপ ৪/৪ — 🆔 আপনার ID নম্বর*\n\nআপনার CID/পাসপোর্ট *ঠিক একই* টাইপ করুন — স্পেস সহ।\n\nউদাহরণ: *4996 2759 5134*\n\n_নাম স্বয়ংক্রিয়ভাবে আসবে।_",

    saved_port: (p) => `✅ বন্দর: *${p}*`,
    saved_type: (e, t) => `✅ ধরন: *${e} ${t}*`,
    saved_vehicle: (v) => `✅ গাড়ি: *${v}*`,
    saved_preset: (slot, e, type, v, port, id) => `🎉 *গাড়ি ${slot} সেভ হয়েছে!*\n\n${e} ${type}\n🚗 ${v}\n🚪 ${port}\n🆔 ${id}`,

    generating: (num, e, v, type, port, pax) => `⏳ *গাড়ি ${num} এর QR তৈরি হচ্ছে*\n\n${e} ${v} · ${type}\n🚪 ${port}\n👥 ${pax} যাত্রী\n\n_৩০-৬০ সেকেন্ড অপেক্ষা করুন..._`,
    qr_ready: (e, v, type, port, name, pax) => `🇧🇹 *ভুটান এন্ট্রি QR*\n📅 ${new Date().toLocaleDateString("bn-IN")}\n${e} ${v} (${type})\n🚪 ${port}\n${name ? `👤 ${name}\n` : ""}👥 যাত্রী: ${pax}\n\n✅ গেটে দেখান`,
    not_registered: (id) => `❌ *ID সিস্টেমে নেই*\n\nআপনার ID *${id}* ইমিগ্রেশন ডেটাবেসে নিবন্ধিত নয়।\n\n➡️ অনুগ্রহ করে *পথচারী টার্মিনাল*-এ গিয়ে প্রথমে নিবন্ধন করুন।`,
    failed: (msg) => `❌ ব্যর্থ: ${msg}\n\nআবার চেষ্টা করুন।`,

    trial_remaining: (n) => `🎁 *ফ্রি ট্রায়াল:* ${n} টি QR বাকি`,
    trial_over: `🔒 *ফ্রি ট্রায়াল শেষ*\n\nআপনি ৩টি ফ্রি QR ব্যবহার করেছেন।\n\n১ বছরের জন্য আনলিমিটেড QR পেতে সাবস্ক্রাইব করুন!`,
    subscription_active: (d) => `✅ *প্রিমিয়াম সক্রিয়* — ${d} পর্যন্ত বৈধ`,
    subscription_expired: `⚠️ আপনার সাবস্ক্রিপশন শেষ। নবায়ন করুন।`,

    upgrade_now: "💎 এখনই আপগ্রেড",
    how_to_pay: (amount, id) => `💳 *প্রিমিয়াম — ₹${amount}/বছর*\n\n১ বছরের জন্য আনলিমিটেড QR\nঅর্ডার ID: ${id}\n\n👇 UPI দিয়ে পেমেন্ট করতে নিচে ট্যাপ করুন`,

    schedule_set: (num, t) => `⏰ *সময়সূচী সেট!*\n\nগাড়ি ${num} প্রতিদিন *${t}* এ স্বয়ংক্রিয়ভাবে আসবে 🎉`,
    schedule_off: (num) => `🔕 গাড়ি ${num} এর সময়সূচী বন্ধ।`,
    pick_time: (num) => `গাড়ি ${num} এর জন্য সময় বেছে নিন:`,

    pick_language: "🌐 *ভাষা বেছে নিন*",
    language_set: "✅ ভাষা বাংলায় সেট",

    family_title: "*👨‍👩‍👧 পরিবারের সদস্য*\n\n_একবার যোগ করুন, যেকোনো ভ্রমণে তাৎক্ষণিক যোগ করুন_",
    no_family: "এখনো পরিবারের কোনো সদস্য সেভ নেই।",
    add_family: "➕ সদস্য যোগ করুন",
    family_added: (name) => `✅ যোগ হয়েছে: *${name}*`,
    family_name: "সদস্যের পূর্ণ নাম টাইপ করুন:",
    family_nationality: "জাতীয়তা বেছে নিন:",
    family_doctype: "ID এর ধরন বেছে নিন:",
    family_docnum: "তাদের ID নম্বর টাইপ করুন (স্পেস সহ):",

    pick_who: "এই QR এর জন্য কোন গাড়ি?",
    pick_passengers: "আজ কার সাথে ভ্রমণ?",
    solo: "🧍 একা",
    with_family: "👨‍👩‍👧 পরিবারের সাথে",

    help_text: `📖 *ভুটান QR বট কীভাবে কাজ করে*\n\n*সেটআপ (২ মিনিট):*\n➕ গাড়ি যোগ করুন → ৪টি প্রশ্নের উত্তর দিন\n\n*প্রতিদিনের ব্যবহার:*\nআপনার গাড়ি ট্যাপ করুন → ৬০ সেকেন্ডে QR ⚡\n\n*অটো-দৈনিক:*\n⏰ সময়সূচী → প্রতিদিন সকালে নিজে থেকে 🌅\n\n*পরিবার:*\n👨‍👩‍👧 পরিবার → সদস্য সেভ করুন, যেকোনো ট্রিপে যোগ করুন\n\n*টেস্ট মোড:*\n🧪 টেস্ট → প্রতিটি ধাপের স্ক্রিনশট পাবেন`,
  },
};

function t(lang, key, ...args) {
  const dict = L[lang] || L.en;
  const val = dict[key] ?? L.en[key];
  if (typeof val === "function") return val(...args);
  return val;
}

module.exports = { t, L };
