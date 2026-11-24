# Security in UniMart

## What protects the data
The website runs in the visitor's browser, so **anything in the browser can be changed by a determined user**. All real protection lives on Google's servers:

| Layer | What it does |
|---|---|
| **Firestore rules** (`firestore.rules`) | Checked by Google on every read and write. Only the owner can edit their listing; only buyer, seller and admins see an order (and the buyer's phone); only the two people in a chat can read it; only admins can approve, hide, feature, verify societies or suspend users. Field types and lengths are checked, unknown fields are rejected, seller names must match the real profile, times must be the real time, one review and one report per person per listing. |
| **Admins** | Listed only in the `admins` collection, which nobody can write from the website. |
| **Email verification** | Posting, buying, chatting and reviewing need a confirmed email (Google accounts are already confirmed). Suspended users are blocked. |
| **Payments** (`functions/`) | Online payments are created and confirmed only by the Cloud Function. Prices are re-read from the database, PayHere's signature and amount are verified, and the merchant secret lives in Secret Manager. No card details ever touch UniMart. |
| **Private data** | User profiles and saved items are private. Seller bank details are in `users/{uid}/private/payout` (owner and admins only) and are copied to a buyer only when the seller confirms that buyer's bank-transfer order. |
| **Browser protections** | Content-Security-Policy (only our own scripts plus Google/Firebase), no inline scripts, all text is HTML-escaped, photos must be real image data, the site refuses to run inside another site's frame, strict referrer policy. |

## Things you should do in the Firebase console
1. **Publish the rules** (`firebase deploy --only firestore:rules`, or paste `firestore.rules`). Never leave the database in *test mode*.
2. **Authentication → Settings → Authorized domains**: keep only `localhost`, your `*.firebaseapp.com` domain and `meshannawod.github.io`.
3. **Authentication → Settings → User actions**: keep *Email enumeration protection* on.
4. **App Check** (recommended): turn on App Check with reCAPTCHA Enterprise for Firestore and Functions, so only your website can use your Firebase project.
5. **Google Cloud → APIs & Services → Credentials**: restrict the browser API key to HTTP referrers `https://meshannawod.github.io/*` and `http://localhost:*/*`.
6. Set a **budget alert** in Google Cloud Billing if you use the Blaze plan.
7. Optional: only allow university emails, by setting `allowedEmailDomains` in `js/config.js` and uncommenting the `.matches(...)` line in `firestore.rules`.

## Is the Firebase API key a secret?
No. Firebase web keys identify the project and are meant to be public. They do not give access to data; the rules do. Keep the **PayHere merchant secret** and any **service account keys** out of the code and out of GitHub.

## Reporting a problem
If you find a security issue, please contact the maintainer privately through GitHub instead of opening a public issue.
