// ============================================================
//  OCR  –  extract passenger info from photos
//  Uses Tesseract.js (free, offline, no API key needed)
// ============================================================
const Tesseract = require("tesseract.js");
const fs        = require("fs");
const path      = require("path");
const os        = require("os");

/**
 * Given a WhatsApp MessageMedia object and expected count,
 * tries to extract passenger details from the image.
 *
 * Returns array of { name, docType, docNumber, nationality }
 */
async function parsePassengerPhoto(media, expectedCount) {
  // Save base64 image to temp file
  const ext      = media.mimetype.split("/")[1] || "jpg";
  const tmpPath  = path.join(os.tmpdir(), `passenger_${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, Buffer.from(media.data, "base64"));

  try {
    const { data: { text } } = await Tesseract.recognize(tmpPath, "eng", {
      logger: () => {},
    });

    fs.unlinkSync(tmpPath);
    return parseTextToPassengers(text, expectedCount);
  } catch (e) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error("OCR error:", e.message);
    return [];
  }
}

/**
 * Heuristic parser: tries to find name, passport/CID numbers,
 * nationality from raw OCR text.
 *
 * Works well with:
 *  - Indian passport photos
 *  - Bhutan CID cards
 *  - Generic ID cards with NAME / DOB / NATIONALITY fields
 */
function parseTextToPassengers(text, expectedCount) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const passengers = [];

  // Patterns
  const passportPattern  = /[A-Z]{1,2}[0-9]{7}/g;
  const cidPattern       = /\d{11}/g;
  const nationalityWords = ["indian", "bhutanese", "nepalese", "bangladeshi", "chinese", "american", "british"];
  const nameLinePattern  = /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/;

  let names        = [];
  let docNumbers   = [];
  let nationalities = [];

  for (const line of lines) {
    // Names: "Surname<<Firstname" (MRZ) or "John Doe"
    if (line.includes("<<")) {
      const parts  = line.split("<<").map(p => p.replace(/</g, " ").trim());
      const name   = [parts[1], parts[0]].filter(Boolean).join(" ");
      if (name.length > 3) names.push(toTitleCase(name));
    } else if (nameLinePattern.test(line)) {
      names.push(line);
    }

    // Passport numbers
    const passMatches = line.match(passportPattern);
    if (passMatches) docNumbers.push(...passMatches.map(n => ({ type: "Passport", number: n })));

    // CID numbers
    const cidMatches = line.match(cidPattern);
    if (cidMatches) docNumbers.push(...cidMatches.map(n => ({ type: "CID", number: n })));

    // Nationality
    const lower = line.toLowerCase();
    for (const nat of nationalityWords) {
      if (lower.includes(nat)) {
        nationalities.push(toTitleCase(nat));
      }
    }
  }

  // Remove duplicates
  names        = [...new Set(names)];
  nationalities = [...new Set(nationalities)];

  // Assemble passengers up to expectedCount
  for (let i = 0; i < Math.min(expectedCount, Math.max(names.length, docNumbers.length, 1)); i++) {
    passengers.push({
      name:        names[i]              || `Passenger ${i + 1}`,
      docType:     docNumbers[i]?.type   || "Passport",
      docNumber:   docNumbers[i]?.number || "—",
      nationality: nationalities[i]      || nationalities[0] || "—",
    });
  }

  return passengers;
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { parsePassengerPhoto };
