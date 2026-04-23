// ============================================================
//  UPI payment link builder
//  Generates upi:// links that open any UPI app (GPay, PhonePe, Paytm)
// ============================================================

function buildUpiLink({ pa, pn, am, tn, tr }) {
  // pa = payee address (your UPI ID)
  // pn = payee name
  // am = amount
  // tn = transaction note
  // tr = transaction reference (our order ID)
  const params = new URLSearchParams({
    pa, pn,
    am: String(am),
    cu: "INR",
    tn: tn || "Payment",
    tr: tr || "",
  });
  return `upi://pay?${params.toString()}`;
}

module.exports = { buildUpiLink };
