/* UniMart – server code for online payments (PayHere, Sri Lanka).
 *
 * createPayHerePayment  (called from the shop) checks the order, re-prices it from the real
 *                       listings, and returns the signed PayHere checkout form.
 * payhereNotify         (called by PayHere's servers) verifies PayHere's signature and the amount,
 *                       then marks the order paid. This is the ONLY place an online order becomes paid.
 *
 * Secrets never reach the browser: the merchant secret is stored with
 *   firebase functions:secrets:set PAYHERE_MERCHANT_SECRET
 * See PAYMENTS.md for the full setup.
 */
const crypto = require("crypto");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const REGION = "asia-south1";
const MERCHANT_SECRET = defineSecret("PAYHERE_MERCHANT_SECRET");
const MERCHANT_ID = defineString("PAYHERE_MERCHANT_ID");
const SANDBOX = defineString("PAYHERE_SANDBOX", { default: "true" });
const SITE_URL = defineString("SITE_URL", { default: "https://meshannawod.github.io/unimart/" });

const md5 = (s) => crypto.createHash("md5").update(s, "utf8").digest("hex").toUpperCase();
const money = (n) => Number(n).toFixed(2); // PayHere wants "1500.00" with no thousands separators
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* ---------- 1. the shop asks for a signed checkout form ---------- */
exports.createPayHerePayment = onCall({ region: REGION, secrets: [MERCHANT_SECRET], enforceAppCheck: false }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Please sign in.");
  if (!req.auth.token.email_verified) throw new HttpsError("permission-denied", "Please confirm your email first.");
  const orderId = String((req.data && req.data.orderId) || "");
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(orderId)) throw new HttpsError("invalid-argument", "Bad order id.");

  const ref = db.doc(`orders/${orderId}`);
  const order = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Order not found.");
    const o = snap.data();
    if (o.buyerId !== req.auth.uid) throw new HttpsError("permission-denied", "This is not your order.");
    if (o.method !== "online" || o.status !== "awaiting_payment" || o.paymentStatus === "paid")
      throw new HttpsError("failed-precondition", "This order does not need an online payment.");

    // Never trust prices from the browser: rebuild the total from the live listings.
    let total = 0;
    const lines = [];
    for (const line of o.lines || []) {
      const qty = Math.floor(Number(line.qty));
      if (!(qty >= 1 && qty <= 99)) throw new HttpsError("invalid-argument", "Bad quantity.");
      const l = await tx.get(db.doc(`listings/${line.id}`));
      if (!l.exists || l.data().status !== "active" || l.data().sellerId !== o.sellerId)
        throw new HttpsError("failed-precondition", `"${line.title}" is no longer available.`);
      const stock = Number(l.data().stock || 0), sold = Number(l.data().sold || 0);
      if (stock && sold + qty > stock) throw new HttpsError("failed-precondition", `Only ${Math.max(0, stock - sold)} left for "${line.title}".`);
      if (l.data().eventAt && l.data().eventAt < Date.now()) throw new HttpsError("failed-precondition", `"${line.title}" has already happened.`);
      const price = Number(l.data().price);
      total += price * qty;
      lines.push({ id: line.id, title: l.data().title, price, qty, unit: l.data().unit || "" });
    }
    if (!(total > 0)) throw new HttpsError("failed-precondition", "Nothing to pay.");
    tx.update(ref, { lines, total, paymentStartedAt: Date.now() });
    return Object.assign({}, o, { lines, total });
  });

  const user = await admin.auth().getUser(req.auth.uid);
  const merchantId = MERCHANT_ID.value();
  const amount = money(order.total);
  const site = SITE_URL.value().replace(/\/?$/, "/");
  const [first, ...rest] = String(order.name || order.buyerName || "Student").trim().split(/\s+/);
  const fields = {
    merchant_id: merchantId,
    return_url: `${site}#/orders?paid=${orderId}`,
    cancel_url: `${site}#/orders`,
    notify_url: `https://${REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/payhereNotify`,
    order_id: orderId,
    items: order.lines.map((x) => `${x.title} x${x.qty}`).join(", ").slice(0, 250),
    currency: "LKR",
    amount,
    first_name: first.slice(0, 40),
    last_name: (rest.join(" ") || "-").slice(0, 40),
    email: user.email || "",
    phone: String(order.phone || "").slice(0, 20),
    address: String(order.place || "Campus").slice(0, 60),
    city: String(order.buyerUni || "Sri Lanka").slice(0, 60),
    country: "Sri Lanka",
    hash: md5(merchantId + orderId + amount + "LKR" + md5(MERCHANT_SECRET.value()))
  };
  const action = SANDBOX.value() === "true" ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";
  return { action, fields };
});

/* ---------- 2. PayHere tells us the result (server to server) ---------- */
exports.payhereNotify = onRequest({ region: REGION, secrets: [MERCHANT_SECRET], cors: false }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("POST only"); return; }
  const b = req.body || {};
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id, method } = b;
  const expected = md5(String(merchant_id) + order_id + payhere_amount + payhere_currency + status_code + md5(MERCHANT_SECRET.value()));
  if (!md5sig || !safeEqual(expected, String(md5sig).toUpperCase()) || String(merchant_id) !== MERCHANT_ID.value()) {
    logger.warn("PayHere notify with a bad signature", { order_id });
    res.status(400).send("bad signature");
    return;
  }
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(String(order_id))) { res.status(400).send("bad order"); return; }

  const ref = db.doc(`orders/${order_id}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) { logger.warn("Notify for missing order", { order_id }); return; }
    const o = snap.data();
    if (o.paymentStatus === "paid") return; // PayHere can notify more than once
    const code = String(status_code);
    const payment = { provider: "payhere", id: String(payment_id || ""), method: String(method || ""), amount: String(payhere_amount), currency: String(payhere_currency), code, at: Date.now() };
    if (code === "2") {
      if (payhere_currency !== "LKR" || money(o.total) !== String(payhere_amount)) {
        logger.error("Amount mismatch", { order_id, expected: money(o.total), got: payhere_amount });
        tx.update(ref, { paymentStatus: "review", payment, updatedAt: Date.now() });
        return;
      }
      tx.update(ref, { paymentStatus: "paid", status: "placed", payout: "pending", payment, paidAt: Date.now(), updatedAt: Date.now() });
    } else if (code === "0") {
      tx.update(ref, { paymentStatus: "pending", payment, updatedAt: Date.now() });
    } else {
      // -1 cancelled, -2 failed, -3 charged back
      tx.update(ref, { paymentStatus: code === "-3" ? "chargeback" : "failed", payment, updatedAt: Date.now() });
    }
  });
  res.status(200).send("ok");
});
