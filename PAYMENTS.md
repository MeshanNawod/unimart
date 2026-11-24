# Payments in UniMart

Buyers choose how to pay at checkout:

| Method | How the money moves | Setup needed |
|---|---|---|
| **Cash when we meet** | Buyer pays the seller in person. Seller taps **Money received**. | None |
| **Bank transfer to the seller** | When the seller confirms, their bank details (from *My account → Bank details*) are shown to that buyer only. Buyer transfers, types the reference, seller checks the bank and taps **Money received**. | None |
| **Pay online** (Visa/Master/Amex, eZ Cash, mCash, Genie, internet banking) | Buyer pays **UniMart** through PayHere. UniMart holds the money and sends it to the seller after the order is completed (admin → Orders → *To pay sellers*). | PayHere account + Cloud Function (below) |

Online orders start as **Waiting for payment**. They only become real orders when PayHere's servers confirm the payment to our Cloud Function, which checks PayHere's signature and the amount. A buyer can't fake a payment from the browser, because the database rules don't let anyone except the function (or an admin) set `paymentStatus`.

## Important before taking online payments
- When you take online payments, **you** receive the buyer's money and must pay sellers and handle refunds. Write simple terms (refunds, delivery, when sellers get paid) and show them on the site.
- PayHere approves the merchant account (business or individual) and checks your website. Have your terms, refund policy and contact details on the site first.
- Keep sandbox mode on until you have tested a full payment.

## Set up online payments (one time)

### 1. PayHere
1. Sign up at <https://www.payhere.lk> (start with a **Sandbox** account at <https://sandbox.payhere.lk>).
2. **Settings → Domains & Credentials → Add domain/app**: add `meshannawod.github.io`. PayHere gives you a **Merchant Secret** for that domain.
3. Note your **Merchant ID** (top of the dashboard).

### 2. Firebase Cloud Functions
Cloud Functions need the **Blaze (pay as you go)** plan. A campus-sized shop normally stays inside the free monthly allowance, but add a budget alert in Google Cloud to be safe.

Install the tools once (needs [Node.js 20](https://nodejs.org)):
```
npm install -g firebase-tools
firebase login
```
Then, in this project folder:
```
cd functions
npm install
cd ..
firebase functions:secrets:set PAYHERE_MERCHANT_SECRET
```
(paste the Merchant Secret when asked; it is stored in Google Secret Manager, never in the code)

Create `functions/.env` with:
```
PAYHERE_MERCHANT_ID=1234567
PAYHERE_SANDBOX=true
SITE_URL=https://meshannawod.github.io/unimart/
```
Deploy the function and the database rules:
```
firebase deploy --only functions,firestore:rules
```

### 3. Switch it on in the shop
In `js/config.js` set `payments.online: true`, commit and push.

### 4. Test with the sandbox
Buy something with **Pay online** and use PayHere's sandbox test card (on PayHere's docs page). After paying you return to *Orders*; within a few seconds the order shows **Paid**.
Check logs with `firebase functions:log` if it does not.

### 5. Go live
Set `PAYHERE_SANDBOX=false` in `functions/.env`, use your **live** Merchant ID and Secret (`firebase functions:secrets:set PAYHERE_MERCHANT_SECRET` again), and run `firebase deploy --only functions`.

## Paying sellers
Admin → **Orders → To pay sellers** lists completed online orders whose money you still hold. **Seller bank details** shows where to send it. After you transfer, tap **Mark money sent** (it records the payout; the money itself goes through your bank).

## Refunds
Refund in the PayHere dashboard, then set the order to *Cancelled* in the admin panel.
