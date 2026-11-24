# Put UniMart live (free) — step by step

You need: a GitHub account and a Google account. Everything below is free.

The site already works without any setup in **demo mode** (data stays in each visitor's browser).
Follow these steps to make it a **real marketplace** where everyone sees the same listings.

---

## 1. Publish on GitHub Pages
1. Open the repository on GitHub → **Settings → Pages**.
2. **Source:** *Deploy from a branch* · **Branch:** `main` · folder `/ (root)` → **Save**.
3. After about a minute the site is at `https://<your-username>.github.io/unimart/`.

## 2. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** → name it `unimart` → you can turn Google Analytics off → **Create**.
2. On the project home click the **web** icon `</>` → nickname `unimart-web` → **Register app**.
3. Firebase shows a `firebaseConfig` block. Copy `apiKey`, `authDomain`, `projectId` and `appId` into **`js/config.js`**:
   ```js
   firebase: {
     apiKey: "AIza...",
     authDomain: "unimart-xxxx.firebaseapp.com",
     projectId: "unimart-xxxx",
     appId: "1:123:web:abc"
   },
   ```
   These keys are not secret. Security comes from the rules in step 4.

## 3. Turn on sign-in
1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable **Google** (pick a support email) and **Email/Password**.
3. **Settings** tab → **Authorized domains** → **Add domain** → `<your-username>.github.io`.

Email sign-ups must click the link Firebase emails them before they can post, buy or chat.
To allow only university emails, set `allowedEmailDomains: ["ac.lk"]` in `js/config.js`, and for hard enforcement uncomment the `.matches(...)` line in `firestore.rules`.

## 4. Create the database and paste the rules
1. **Build → Firestore Database → Create database** → choose a location close to Sri Lanka (e.g. `asia-south1` Mumbai) → **Start in production mode**.
2. Open the **Rules** tab, delete everything, paste the whole of [`firestore.rules`](firestore.rules) → **Publish**.

No indexes are needed. The full list of collections and fields is in [SCHEMA.md](SCHEMA.md).

## 5. Make yourself an admin
1. Open your site, tap **Sign in**, and sign in with the account that should be admin.
2. Open `admin.html` on your site. It shows **“Not an admin yet”** with your **UID** and a Copy button.
3. In Firebase console → **Firestore Database → Data → Start collection**:
   - Collection ID: `admins`
   - Document ID: *paste your UID*
   - Add a field: `email` (string) = your email → **Save**.
4. Reload `admin.html`. You now see the admin panel.

**Remove an admin:** delete their document in `admins`. **Add another:** repeat step 5 with their UID.
Admins are never listed in the code, so nobody can make themselves admin from the website.

## 6. First time in the admin panel
- **Settings → Load sample listings** if you want the shop to look full on day one (delete them later from *Listings*; they are marked “sample”).
- **Settings → New listings need admin approval** if you want to check every listing before it goes live.
- **Settings → Announcement bar** to show a message at the top of the shop.

## 7. Push changes and commit
```
git add -A
git commit -m "Add Firebase keys"
git push
```
GitHub Pages updates within a minute.

---

## Test on your computer
```
py -m http.server 8000
```
Open <http://localhost:8000>. With empty keys it runs in demo mode: any name signs you in and the admin password is `demo`.
If you add Firebase keys, also add `localhost` to Authorized domains (it is there by default).

## What the admin can do
| Tab | Actions |
|---|---|
| Dashboard | Live listings, pending approvals, users, orders, completed sales, open reports, listings per category, latest orders |
| Listings | Approve / reject pending, hide, make live, feature in Flash deals, delete, search |
| Orders | See every order and change its status |
| Users | Search, suspend (hides all their listings and blocks posting, buying and chat) or restore |
| Reports | Listings flagged by students: hide the listing, mark resolved |
| Settings | Require approval, announcement bar, load sample listings |

## Safety notes for running a real marketplace
- No money goes through the site. Buyers pay the seller in person. This keeps you out of payment licensing and refunds.
- Security rules check who writes what, not what a listing means, so they cannot stop someone selling exam answers. Use **Require approval** and **Reports** to moderate, and keep the “do not sell” text on the Sell page.
- Phone numbers are shown only to the seller of that order and to admins.
