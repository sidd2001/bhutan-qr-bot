// ============================================================
//  QR Generator – Bhutan Immigration full automation
//  Flow: Step1 Vehicle  Step2 Driver+Search  Step3 skip
//        Step4 Declaration checkbox + Submit → capture QR
// ============================================================
const puppeteer = require("puppeteer");
const path      = require("path");
const fs        = require("fs");

const OUTPUT_DIR = path.join(__dirname, "../data/qr-images");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Ordered lists shown to user as numbered options ─────────
const PORT_LIST = [
  "Main Gate (Phuentsholing)",
  "Samdrup Jongkhar Main Gate",
  "Gelephu Main Gate",
  "Samtse Main Gate",
  "Gelephu International Airport",
  "Nganglam",
  "Jomotshangkha",
  "Lhamozingkha",
  "Ahlay LCS",
  "Bhimtar",
  "Gomtu",
  "Jiti",
  "Phuntsho Rabtenling",
  "Pugli",
  "Samrang",
];

const TYPE_LIST = [
  "Light Vehicle",
  "Heavy Vehicle",
  "Two Wheeler",
  "Taxi",
  "Medium Vehicle",
  "Medium Bus",
  "Heavy Bus",
  "Tractor",
  "Power Tiller",
  "Earth Moving Equipment",
];

const VEHICLE_EMOJI = {
  "Two Wheeler":            "🏍️",
  "Light Vehicle":          "🚗",
  "Heavy Vehicle":          "🚚",
  "Taxi":                   "🚖",
  "Medium Vehicle":         "🚐",
  "Medium Bus":             "🚌",
  "Heavy Bus":              "🚍",
  "Tractor":                "🚜",
  "Power Tiller":           "🚜",
  "Earth Moving Equipment": "🚧",
};

// ── Typo-tolerant normalizers ───────────────────────────────
function normalizePort(input) {
  if (!input) return input;
  const k = input.trim().toLowerCase();
  // exact match first
  const exact = PORT_LIST.find(p => p.toLowerCase() === k);
  if (exact) return exact;
  // partial match
  const partial = PORT_LIST.find(p => p.toLowerCase().includes(k) || k.includes(p.toLowerCase()));
  if (partial) return partial;
  // Known aliases
  const aliases = {
    "phuentsholing": "Main Gate (Phuentsholing)",
    "main gate":     "Main Gate (Phuentsholing)",
    "samdrup":       "Samdrup Jongkhar Main Gate",
    "gelephu":       "Gelephu Main Gate",
    "samtse":        "Samtse Main Gate",
  };
  return aliases[k] || input;
}

function normalizeVehicleType(input) {
  if (!input) return input;
  const k = input.trim().toLowerCase();
  const exact = TYPE_LIST.find(t => t.toLowerCase() === k);
  if (exact) return exact;
  const aliases = {
    "car":        "Light Vehicle",
    "suv":        "Light Vehicle",
    "light":      "Light Vehicle",
    "truck":      "Heavy Vehicle",
    "heavy":      "Heavy Vehicle",
    "bus":        "Heavy Bus",
    "bike":       "Two Wheeler",
    "motorcycle": "Two Wheeler",
    "2 wheeler":  "Two Wheeler",
  };
  if (aliases[k]) return aliases[k];
  const partial = TYPE_LIST.find(t => t.toLowerCase().includes(k));
  return partial || input;
}

function formatDateDDMMYYYY(d) {
  const dt = typeof d === "string" ? new Date(d) : (d || new Date());
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// ============================================================
//  Main generate function
//  Pass { debug: true } to get step-by-step screenshots
// ============================================================
async function generate({ vehicleNumber, type, port, driverid, passengers = [], date, debug = false }) {
  const launchOpts = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  };
  // For Railway/Render/production — use system Chromium if provided
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOpts);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Collect step screenshots for debug mode
  const stepScreenshots = [];
  const runId = Date.now();
  async function shot(label) {
    if (!debug) return;
    const filename = `step_${runId}_${stepScreenshots.length + 1}_${label.replace(/[^a-z0-9]/gi, "_")}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);
    try {
      await page.screenshot({ path: filePath, fullPage: true });
      stepScreenshots.push({ label, path: filePath });
      console.log(`  📸 ${label}`);
    } catch (e) {
      console.log(`  (screenshot failed for ${label})`);
    }
  }

  try {
    console.log("→ Opening Bhutan Immigration site...");
    await page.goto("https://bms.immi.gov.bt/registration/foreigner", {
      waitUntil: "networkidle2",
      timeout: 45000,
    });
    await wait(2500);

    const portName = normalizePort(port);
    const typeName = normalizeVehicleType(type);
    const todayStr = formatDateDDMMYYYY(date);

    await shot("1_opened");

    // ── STEP 1: Port ──────────────────────────────────────
    console.log(`→ Port: ${portName}`);
    const portOk = await selectFromDropdown(page, "port of entry", portName);
    await wait(700);
    await shot("1a_port_selected");
    if (!portOk) console.log("⚠️ Port selection may have failed");

    // ── STEP 1: Date ──────────────────────────────────────
    // The Bhutan site pre-fills today's date by default. We only touch it
    // if the user requested a different date (future reservation).
    // NOTE: Do NOT touch the date field in the default case — previous
    // attempts accidentally opened the date picker and broke subsequent clicks.
    const requestedDate = typeof date === "string" ? new Date(date) : (date || new Date());
    const todayActual = new Date();
    const isToday = requestedDate.toDateString() === todayActual.toDateString();

    if (!isToday) {
      console.log(`→ Setting custom date: ${todayStr}`);
      try {
        // Use a very specific selector for the date field (not any input with '/')
        const dateInput = await page.$(
          "input[placeholder*='date' i]:not([placeholder*='vehicle' i]):not([placeholder*='port' i])"
        );
        if (dateInput) {
          await dateInput.click({ clickCount: 3 });
          await page.keyboard.press("Delete");
          await dateInput.type(todayStr, { delay: 40 });
          // Close any date picker that opened
          await page.keyboard.press("Escape");
          await wait(600);
        }
      } catch (e) {
        console.log(`  (date step skipped: ${e.message})`);
      }
    } else {
      console.log(`→ Date: using pre-filled today (${todayStr})`);
    }
    await wait(500);

    // Click somewhere neutral to close any lingering picker before dropdown click
    try {
      await page.evaluate(() => {
        // Find a safe spot — the page title or heading
        const safe = document.querySelector("h1, h2, .page-title, [class*='title']");
        if (safe) safe.click();
      });
      await wait(300);
    } catch {}

    // ── STEP 1: Vehicle Type ──────────────────────────────
    console.log(`→ Vehicle type: ${typeName}`);
    const typeOk = await selectFromDropdown(page, "vehicle type", typeName);
    await wait(700);
    await shot("1b_type_selected");
    if (!typeOk) console.log("⚠️ Vehicle type selection may have failed");

    // ── STEP 1: Vehicle Number ────────────────────────────
    console.log(`→ Vehicle number: ${vehicleNumber}`);
    const vInput = await page.$("input[placeholder*='vehicle number' i], input[placeholder*='Enter vehicle' i]");
    if (vInput) {
      await vInput.click({ clickCount: 3 });
      await vInput.type(vehicleNumber, { delay: 50 });
    } else {
      // fallback: any text input near the vehicle label
      const inputs = await page.$$("input[type='text']");
      if (inputs.length) {
        await inputs[inputs.length - 1].click({ clickCount: 3 });
        await inputs[inputs.length - 1].type(vehicleNumber, { delay: 50 });
      } else {
        throw new Error("Could not find Vehicle Number input on Step 1");
      }
    }
    await wait(400);
    await shot("2_vehicle_filled");

    await clickButtonText(page, ["Next"]);
    await wait(2500);

    await clickButtonText(page, ["Next"]);
    await wait(2500);
    await shot("3_step2_opened");

    // ── STEP 2: Driver ID + Search ────────────────────────
    console.log(`→ Driver ID: ${driverid}`);
    // Select Bhutanese nationality if dropdown exists
    await selectFromDropdown(page, "nationality", "Bhutanese").catch(() => {});
    await wait(500);

    const idInputs = await page.$$("input[type='text'], input[type='search']");
    const idInput = idInputs[idInputs.length - 1];
    if (!idInput) throw new Error("Could not find ID input on Step 2");
    await idInput.click({ clickCount: 3 });
    await idInput.type(driverid, { delay: 50 });
    await wait(500);
    await shot("4_id_entered");

    console.log("→ Clicking Search...");
    const searched = await clickButtonText(page, ["Search", "search"]);
    if (!searched) await page.keyboard.press("Tab");
    await wait(4000);
    await shot("5_after_search");

    // Detect "not registered"
    const pageText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    if (/not\s*registered|not\s*found|please\s*register|no\s*record|invalid/.test(pageText)) {
      console.log("✗ ID not registered");
      await browser.close();
      return { notRegistered: true, stepScreenshots };
    }

    // Try to get driver name for caption
    let driverName = null;
    try {
      const vals = await page.$$eval("input", els =>
        els.map(e => e.value).filter(v => v && v.length > 2 && /^[A-Za-z\s]+$/.test(v))
      );
      if (vals.length) driverName = vals[0];
    } catch {}
    console.log(`→ Driver name: ${driverName || '(not extracted)'}`);

    await clickButtonText(page, ["Next"]);
    await wait(2500);
    await shot("6_step3_passengers");

    // After Step 2 Next → we're on STEP 3 (Passengers + Declaration)
    // Screenshot 6 above already captured this screen

    // Track the real names fetched from the government database
    const fetchedPassengerNames = [];

    // ── STEP 3: Add passengers (optional) ─────────────────
    if (passengers && passengers.length) {
      for (const p of passengers) {
        console.log(`→ Adding passenger: ${p.docNumber}`);

        // Click "Search & Add Passenger" first to open the add-passenger modal/form
        await clickButtonText(page, ["Search & Add Passenger", "Add Passenger"]);
        await wait(1500);

        // Click "Foreign" tab/button — passenger IDs from our users are foreign (Indian usually)
        // The Bhutan site has Bhutanese/Foreign tabs for the passenger lookup
        const foreignClicked = await page.evaluate(() => {
          // Look for a "Foreign" tab, button, or radio
          const all = Array.from(document.querySelectorAll("button, [role='tab'], [role='radio'], label, a, div"));
          for (const el of all) {
            const txt = (el.textContent || "").trim();
            if (txt === "Foreign" || txt.toLowerCase() === "foreign") {
              const rect = el.getBoundingClientRect();
              if (rect.width > 10 && rect.height > 10 && rect.top > 0) {
                el.click();
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
              }
            }
          }
          return null;
        });
        if (foreignClicked) {
          console.log(`  → Clicked "Foreign" tab at (${foreignClicked.x}, ${foreignClicked.y})`);
          // Also do real mouse click for React
          await page.mouse.click(foreignClicked.x, foreignClicked.y);
          await wait(800);
        } else {
          console.log(`  ⚠️ "Foreign" tab not found — continuing with default`);
        }

        // Now find the ID input and type the passenger number
        const pInputs = await page.$$("input[type='text'], input[type='search'], input[placeholder*='number' i], input[placeholder*='id' i]");
        const lastInput = pInputs[pInputs.length - 1];
        if (lastInput) {
          await lastInput.click({ clickCount: 3 });
          await lastInput.type(p.docNumber, { delay: 50 });
          await wait(400);
        }

        // Click Search button to trigger the government database lookup
        await clickButtonText(page, ["Search", "Search & Add Passenger", "Add Passenger"]);
        await wait(3000); // site takes time to fetch from database

        // Capture the auto-fetched name BEFORE confirming/adding
        // The name appears in an input field or readonly text after search succeeds
        const fetchedName = await page.evaluate(() => {
          // Look for a filled-in name field (readonly input or display div)
          const inputs = Array.from(document.querySelectorAll("input"));
          for (const inp of inputs) {
            const val = (inp.value || "").trim();
            // Name values: only letters + spaces, 3+ chars, not the ID we just typed
            if (val && val.length >= 3 && /^[A-Za-z\s.]+$/.test(val) && !val.match(/\d/)) {
              return val;
            }
          }
          // Also check for display text (readonly name shown in a div/span)
          const nameLabels = Array.from(document.querySelectorAll("span, div, p, label"));
          for (const el of nameLabels) {
            const txt = (el.textContent || "").trim();
            // Look for "Name: XYZ" pattern
            const m = txt.match(/^name\s*[:\-]\s*([A-Za-z\s.]{3,})$/i);
            if (m) return m[1].trim();
          }
          return null;
        });

        console.log(`  → Auto-fetched name: ${fetchedName || '(not found)'}`);
        fetchedPassengerNames.push({
          docNumber: p.docNumber,
          fetchedName: fetchedName || p.name || null,
        });

        // Now click final "Add" / "Confirm" button if one exists
        await clickButtonText(page, ["Add", "Confirm", "OK", "Save"]);
        await wait(1500);
      }
      await shot("7_passengers_added");
    }

    // ── STEP 3: Tick Declaration checkbox (MUST do before Next) ──
    console.log("→ Ticking Declaration checkbox...");
    const tickedOk = await page.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
      for (const box of boxes) {
        const context = box.closest("div, label, section");
        const txt = (context?.innerText || "").toLowerCase();
        if (txt.includes("declar") || txt.includes("affirm") || txt.includes("hereby")) {
          if (!box.checked) box.click();
          return true;
        }
      }
      // Fallback: tick the first unchecked checkbox
      if (boxes.length && !boxes[0].checked) { boxes[0].click(); return true; }
      return false;
    });
    console.log(`→ Declaration ticked: ${tickedOk}`);
    await wait(800);
    await shot("8_declaration_ticked");

    // ── Click Next → this submits and moves to STEP 4 (QR) ──
    console.log("→ Clicking Next (submits form)...");
    const clickedNext = await clickButtonText(page, ["Next", "NEXT", "Submit", "Submit Form"]);
    if (!clickedNext) {
      const allButtons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, [role='button'], input[type='submit']"));
        return btns.map(b => (b.textContent || b.value || "").trim()).filter(t => t);
      });
      throw new Error(`Could not find Next/Submit button. Buttons on page: ${allButtons.join(", ")}`);
    }
    await wait(5000); // wait for server to generate QR
    await shot("9_step4_after_submit");

    // ── Capture QR ────────────────────────────────────────
    console.log("→ Waiting for QR code to appear...");
    await page.waitForSelector(
      "img[alt*='qr' i], img[src*='data:image'], img[src*='qr'], canvas",
      { timeout: 25000 }
    );
    await wait(1500); // let it fully render
    await shot("11_qr_visible");

    const qrFilename = `qr_${todayStr.replace(/\//g, "-")}_${vehicleNumber.replace(/\s+/g, "_")}_${Date.now()}.png`;
    const qrFilePath = path.join(OUTPUT_DIR, qrFilename);

    // Try to screenshot ONLY the QR area for cleaner image
    const qrEl = await page.$("img[alt*='qr' i], img[src*='data:image'], img[src*='qr'], canvas");
    if (qrEl) {
      // Get the QR container so caption+details are included
      const qrContainer = await page.evaluateHandle((el) => {
        let parent = el.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
          if (parent.offsetWidth > 300) return parent;
          parent = parent.parentElement;
        }
        return el;
      }, qrEl);
      try {
        await qrContainer.asElement().screenshot({ path: qrFilePath });
      } catch {
        await qrEl.screenshot({ path: qrFilePath });
      }
    } else {
      await page.screenshot({ path: qrFilePath, fullPage: false });
    }

    await browser.close();
    console.log(`✓ QR saved: ${qrFilePath}`);

    return {
      qrImagePath: qrFilePath,
      date: todayStr,
      driverName,
      passengerCount: passengers.length,
      fetchedPassengerNames, // [{ docNumber, fetchedName }]
      stepScreenshots, // array of { label, path } for debug mode
    };

  } catch (err) {
    console.error("✗ Error:", err.message);
    // Take a final "error" screenshot and attach to stepScreenshots
    try {
      const errPath = path.join(OUTPUT_DIR, `step_${runId}_error_${Date.now()}.png`);
      await page.screenshot({ path: errPath, fullPage: true });
      if (debug) stepScreenshots.push({ label: "ERROR_AT_FAILURE", path: errPath });
      console.log(`  Error screenshot: ${errPath}`);
    } catch {}
    await browser.close();
    // Throw an error that carries the screenshots with it
    const e = new Error(err.message);
    e.stepScreenshots = stepScreenshots;
    throw e;
  }
}

// ============================================================
//  Helpers
// ============================================================
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// Click a button by visible text (case-insensitive, partial match)
async function clickButtonText(page, textArray) {
  const list = Array.isArray(textArray) ? textArray : [textArray];
  const clicked = await page.evaluate((names) => {
    const btns = Array.from(document.querySelectorAll("button, [role='button'], input[type='submit']"));
    for (const b of btns) {
      const txt = (b.textContent || b.value || "").trim().toLowerCase();
      for (const n of names) {
        if (txt === n.toLowerCase() || txt.includes(n.toLowerCase())) {
          if (!b.disabled) { b.click(); return true; }
        }
      }
    }
    return false;
  }, list);
  return clicked;
}

// Select a dropdown option by nearby-label hint + option text
// Uses real mouse clicks (not JS .click()) for React/Next.js compatibility
async function selectFromDropdown(page, labelHint, optionText) {
  console.log(`    [dropdown] looking for "${labelHint}" → "${optionText}"`);

  // STEP 0: Blur any focused input and close any open overlays (date picker etc.)
  // This prevents the "date input still has focus" issue that made vehicle type click fail.
  try {
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });
    await page.keyboard.press("Escape");
    await wait(200);
    // Click on body/header to dismiss any popover
    await page.evaluate(() => {
      const header = document.querySelector("header, h1, h2, [class*='header']");
      if (header) {
        const rect = header.getBoundingClientRect();
        // Just clear focus — don't actually dispatch a click that might trigger nav
      }
      document.body.focus();
    });
    await wait(200);
  } catch {}

  // Try native <select> first
  const nativeOk = await page.evaluate((hint, txt) => {
    const selects = Array.from(document.querySelectorAll("select"));
    for (const s of selects) {
      const ctx = s.closest("div, label, section");
      const labelTxt = (ctx?.innerText || "").toLowerCase();
      if (labelTxt.includes(hint.toLowerCase())) {
        const opt = Array.from(s.options).find(o =>
          o.text.trim().toLowerCase() === txt.toLowerCase()
        );
        if (opt) {
          s.value = opt.value;
          s.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }, labelHint, optionText);

  if (nativeOk) {
    console.log(`    [dropdown] used native <select>`);
    return true;
  }

  // Find the dropdown TRIGGER element (contains "Select the <hint>" text)
  // IMPORTANT: exclude calendar/date elements to prevent accidental clicks
  const triggerBox = await page.evaluate((hint) => {
    const isDateElement = (el) => {
      if (!el || !el.getAttribute) return false;
      const cls = (el.className || "").toString().toLowerCase();
      const role = (el.getAttribute("role") || "").toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      const ph = (el.getAttribute("placeholder") || "").toLowerCase();
      return cls.includes("date") || cls.includes("calendar") || cls.includes("picker") ||
             role.includes("grid") || aria.includes("calendar") || aria.includes("date") ||
             ph.includes("date");
    };

    const all = Array.from(document.querySelectorAll("*"));
    for (const el of all) {
      if (isDateElement(el)) continue;
      // Skip if any parent is a date picker
      let p = el.parentElement;
      let skip = false;
      let depth = 0;
      while (p && p !== document.body && depth < 10) {
        if (isDateElement(p)) { skip = true; break; }
        p = p.parentElement;
        depth++;
      }
      if (skip) continue;

      const txt = (el.textContent || "").trim().toLowerCase();
      const placeholder = `select the ${hint.toLowerCase()}`;
      if (txt === placeholder && el.children.length < 3) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 20 && rect.top > 0) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
    }
    // Fallback: find by placeholder attribute
    const input = Array.from(document.querySelectorAll("input, [role='combobox'], [role='button']")).find(el => {
      if (isDateElement(el)) return false;
      const p = (el.getAttribute("placeholder") || el.textContent || "").toLowerCase();
      return p.includes(`select the ${hint.toLowerCase()}`);
    });
    if (input) {
      const rect = input.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    return null;
  }, labelHint);

  if (!triggerBox) {
    console.log(`    [dropdown] ❌ trigger not found`);
    return false;
  }

  // Real mouse click on the trigger (so React sees a user event)
  console.log(`    [dropdown] clicking trigger at (${triggerBox.x}, ${triggerBox.y})`);
  await page.mouse.click(triggerBox.x, triggerBox.y);
  await wait(1200); // let dropdown open (React may animate)

  // Now find the option by its EXACT text and click it
  // Exclude options inside date/calendar widgets
  const optionBox = await page.evaluate((txt) => {
    const isDateElement = (el) => {
      if (!el || !el.className) return false;
      const cls = (el.className || "").toString().toLowerCase();
      return cls.includes("date") || cls.includes("calendar") || cls.includes("picker");
    };

    const all = Array.from(document.querySelectorAll("li, [role='option'], div, span, a"));
    for (const el of all) {
      let p = el;
      let skip = false;
      let depth = 0;
      while (p && p !== document.body && depth < 10) {
        if (isDateElement(p)) { skip = true; break; }
        p = p.parentElement;
        depth++;
      }
      if (skip) continue;

      const t = (el.textContent || "").trim();
      if (t === txt || t.toLowerCase() === txt.toLowerCase()) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top > 0) {
          const hasText = el.children.length === 0 || Array.from(el.children).every(c => !c.textContent?.trim());
          if (hasText || el.children.length < 2) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: t };
          }
        }
      }
    }
    return null;
  }, optionText);

  if (!optionBox) {
    console.log(`    [dropdown] ❌ option "${optionText}" not visible`);
    return false;
  }

  console.log(`    [dropdown] clicking option at (${optionBox.x}, ${optionBox.y})`);
  await page.mouse.click(optionBox.x, optionBox.y);
  await wait(700);
  console.log(`    [dropdown] ✓ selected "${optionText}"`);
  return true;
}

module.exports = {
  generate,
  normalizePort,
  normalizeVehicleType,
  PORT_LIST,
  TYPE_LIST,
  VEHICLE_EMOJI,
};
