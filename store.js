// ============================================================
//  Store — clean final version
// ============================================================
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../data/store.json");

if (!fs.existsSync(path.dirname(DATA_PATH))) fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({}), "utf8");

const load = () => { try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")); } catch { return {}; } };
const save = d => fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2), "utf8");

function ensureUser(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      presets: {},        // 1-9 vehicle presets
      passengers: [],     // saved passengers: { id, name, docType, docNumber, nationality, useCount }
      schedules: {},
      wizard: null,
      photoStash: {},
      pendingPassenger: null,  // passenger awaiting confirmation (5-sec hold)
      lang: "en",
      subscription: { plan: "trial", trialCount: 3, paidUntil: null, totalQRs: 0 },
      payments: [],
      firstName: null,
    };
  }
  const u = data[userId];
  if (!u.presets) u.presets = {};
  if (!u.passengers) u.passengers = [];
  if (!u.schedules) u.schedules = {};
  if (!u.photoStash) u.photoStash = {};
  if (!u.lang) u.lang = "en";
  if (!u.subscription) u.subscription = { plan: "trial", trialCount: 3, paidUntil: null, totalQRs: 0 };
  if (!u.payments) u.payments = [];
  return data;
}

// Presets
function savePreset(uid, num, p) { const d = ensureUser(load(), uid); d[uid].presets[num] = p; save(d); }
function getPreset(uid, num) { return load()[uid]?.presets?.[num] || null; }
function getAllPresets(uid) { return load()[uid]?.presets || {}; }
function deletePreset(uid, num) {
  const d = ensureUser(load(), uid);
  delete d[uid].presets[num];
  if (d[uid].schedules) delete d[uid].schedules[num];
  save(d);
}

// Passengers — with auto-sort by useCount
function addOrGetPassenger(uid, { name, docType, docNumber, nationality }) {
  const d = ensureUser(load(), uid);
  let existing = d[uid].passengers.find(p => p.docNumber.replace(/\s/g, "") === docNumber.replace(/\s/g, ""));
  if (existing) {
    existing.useCount = (existing.useCount || 0) + 1;
    existing.lastUsed = new Date().toISOString();
  } else {
    existing = {
      id: Date.now(),
      name: name || "Unknown",
      docType: docType || "Passport",
      docNumber,
      nationality: nationality || "Indian",
      useCount: 1,
      lastUsed: new Date().toISOString(),
    };
    d[uid].passengers.push(existing);
  }
  save(d);
  return existing;
}

function incrementPassengerUse(uid, passengerId) {
  const d = ensureUser(load(), uid);
  const p = d[uid].passengers.find(x => x.id === passengerId);
  if (p) {
    p.useCount = (p.useCount || 0) + 1;
    p.lastUsed = new Date().toISOString();
    save(d);
  }
}

function getPassengers(uid) {
  const list = load()[uid]?.passengers || [];
  // Sort: most-used first, then most recent
  return [...list].sort((a, b) => {
    if ((b.useCount || 0) !== (a.useCount || 0)) return (b.useCount || 0) - (a.useCount || 0);
    return (b.lastUsed || "").localeCompare(a.lastUsed || "");
  });
}

function deletePassenger(uid, passengerId) {
  const d = ensureUser(load(), uid);
  d[uid].passengers = (d[uid].passengers || []).filter(p => p.id !== passengerId);
  save(d);
}

// Pending passenger (5-second confirm window)
function setPendingPassenger(uid, pending) {
  const d = ensureUser(load(), uid);
  d[uid].pendingPassenger = pending;
  save(d);
}
function getPendingPassenger(uid) { return load()[uid]?.pendingPassenger || null; }
function clearPendingPassenger(uid) {
  const d = ensureUser(load(), uid);
  d[uid].pendingPassenger = null;
  save(d);
}

// Wizard
function setWizard(uid, s) { const d = ensureUser(load(), uid); d[uid].wizard = s; save(d); }
function getWizard(uid) { return load()[uid]?.wizard || null; }
function clearWizard(uid) { const d = ensureUser(load(), uid); d[uid].wizard = null; save(d); }

// Schedule
function saveSchedule(uid, num, time) { const d = ensureUser(load(), uid); d[uid].schedules[num] = time; save(d); }
function removeSchedule(uid, num) { const d = ensureUser(load(), uid); delete d[uid].schedules[num]; save(d); }
function getAllSchedules(uid) { return load()[uid]?.schedules || {}; }
function getAllUserSchedules() {
  const d = load(); const out = [];
  for (const [uid, v] of Object.entries(d)) for (const [num, time] of Object.entries(v.schedules || {})) out.push({ userId: uid, num, time });
  return out;
}

// Photo stash
function stashPhoto(uid, msgId, fileId) {
  const d = ensureUser(load(), uid);
  d[uid].photoStash[msgId] = fileId;
  const keys = Object.keys(d[uid].photoStash);
  if (keys.length > 5) { keys.sort((a,b) => parseInt(a) - parseInt(b)); for (let i = 0; i < keys.length - 5; i++) delete d[uid].photoStash[keys[i]]; }
  save(d);
}
function getStashedPhoto(uid, msgId) { return load()[uid]?.photoStash?.[msgId] || null; }

// Language
function setLanguage(uid, lang) { const d = ensureUser(load(), uid); d[uid].lang = lang; save(d); }
function getLanguage(uid) { return load()[uid]?.lang || "en"; }

// Name
function setFirstName(uid, n) { const d = ensureUser(load(), uid); d[uid].firstName = n; save(d); }

// Subscription
function getSubscription(uid) {
  const d = ensureUser(load(), uid);
  const s = d[uid].subscription;
  if (s.plan === "paid" && s.paidUntil && new Date(s.paidUntil) < new Date()) {
    s.plan = "expired"; save(d);
  }
  return s;
}
function canGenerateQR(uid) {
  const s = getSubscription(uid);
  if (s.plan === "paid") return { allowed: true };
  if (s.plan === "trial" && s.trialCount > 0) return { allowed: true };
  return { allowed: false, reason: s.plan };
}
function decrementTrial(uid) {
  const d = ensureUser(load(), uid);
  if (d[uid].subscription.plan === "trial") d[uid].subscription.trialCount = Math.max(0, d[uid].subscription.trialCount - 1);
  d[uid].subscription.totalQRs = (d[uid].subscription.totalQRs || 0) + 1;
  save(d);
}
function activateSubscription(uid, days = 365) {
  const d = ensureUser(load(), uid);
  const until = new Date(Date.now() + days * 86400000);
  d[uid].subscription.plan = "paid";
  d[uid].subscription.paidUntil = until.toISOString();
  save(d);
  return until;
}
function recordPayment(uid, p) {
  const d = ensureUser(load(), uid);
  d[uid].payments.push({ ...p, timestamp: new Date().toISOString() });
  save(d);
}

// Stats
function getAllUsers() { const d = load(); return Object.keys(d).map(uid => ({ userId: uid, ...d[uid] })); }
function getStats() {
  const us = getAllUsers();
  return {
    total: us.length,
    paid: us.filter(u => u.subscription?.plan === "paid").length,
    trial: us.filter(u => u.subscription?.plan === "trial").length,
    expired: us.filter(u => u.subscription?.plan === "expired").length,
    totalQRs: us.reduce((s,u) => s + (u.subscription?.totalQRs || 0), 0),
    revenue: us.reduce((s,u) => s + (u.payments || []).filter(p => p.status === "paid").reduce((a,p) => a + (p.amount||0), 0), 0),
  };
}

module.exports = {
  savePreset, getPreset, getAllPresets, deletePreset,
  addOrGetPassenger, incrementPassengerUse, getPassengers, deletePassenger,
  setPendingPassenger, getPendingPassenger, clearPendingPassenger,
  setWizard, getWizard, clearWizard,
  saveSchedule, removeSchedule, getAllSchedules, getAllUserSchedules,
  stashPhoto, getStashedPhoto,
  setLanguage, getLanguage, setFirstName,
  getSubscription, canGenerateQR, decrementTrial, activateSubscription, recordPayment,
  getAllUsers, getStats,
};
