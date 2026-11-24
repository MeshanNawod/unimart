<p align="center"><img src="img/logo.svg" alt="UniMart" width="96"></p>

# UniMart

A campus marketplace for Sri Lankan university students. Students buy and sell **items** (books, laptops, hostel gear, food, clothes, bikes) and **services** (tutoring, printing, design, repairs, photography, rides) with other students they can meet on campus. Mobile first, works on any phone.

**Live site:** <https://meshannawod.github.io/unimart/> · **Demo (no sign-up):** <https://meshannawod.github.io/unimart/?demo=1>

It runs as a plain static site on GitHub Pages, with **Firebase** (free plan) for accounts and the database. Without Firebase keys it runs in **demo mode** so you can try everything right away.

## Features
- Home with search, 12 categories, Flash deals with countdown, recently viewed, popular services, newest listings
- Browse with filters: items/services, category, university, max price, sort, and “Show more”
- Listing page: up to 4 photos, price and discount, condition, seller rating and sales, reviews, similar listings, share to WhatsApp / copy link, report button
- Seller profile page: all their listings and reviews
- Sell and edit: items or services, up to 4 photos (auto-resized, pick the cover), pause, mark sold, delete
- **Societies & clubs** can sell too: society badge, admin-verified blue tick, "From societies & clubs" section
- **Event tickets** (musical shows, carnivals), **Stalls & Fairs**, **Classes & Courses** with date, venue, class times and limited tickets/stalls ("12 left", "Sold out")
- **Ads & Notices** board for free notices and advertisements
- Cart → checkout → one order per seller
- **Payments:** cash on meeting, bank transfer to the seller (bank details shared privately), or online card / eZ Cash / mCash / Genie via **PayHere** ([PAYMENTS.md](PAYMENTS.md))
- **English, සිංහල and தமிழ்** (language switch in the top bar)
- Orders: “I bought” and “I sold”, with status steps (placed → confirmed → ready → completed / cancelled)
- Chat between buyer and seller with unread badges
- Saved listings, profile, Google and email sign-in with email verification
- Dark mode (follows the phone, or pick in the footer)
- Installs like an app on phones and opens without internet; rich link previews on WhatsApp/Facebook
- **Admin panel** (`admin.html`): dashboard, approve/hide/feature/delete listings, all orders, suspend users, reports, site settings, sample data, CSV export of listings / orders / users

## Guides
| Guide | What it covers |
|---|---|
| [SETUP.md](SETUP.md) | Go live for free: GitHub Pages, Firebase project, sign-in, database rules, making yourself admin |
| [SCHEMA.md](SCHEMA.md) | Every Firestore collection and field, and who can read or write it |
| [firestore.rules](firestore.rules) | Security rules to paste into Firebase |
| [PAYMENTS.md](PAYMENTS.md) | Cash, bank transfer and online payments with PayHere |
| [SECURITY.md](SECURITY.md) | How the data is protected and the Firebase settings to turn on |

## Files
| File | What is inside |
|---|---|
| `index.html` | The shop (all shop pages are inside it, using `#/` links) |
| `admin.html` | Admin panel |
| `js/config.js` | **Your Firebase keys go here**, plus allowed email domains and the demo admin password |
| `js/data.js` | Universities, categories and the sample listings |
| `js/store.js` | One data API used by every page |
| `js/db-firebase.js` | Live backend: Firebase Auth + Firestore |
| `js/db-local.js` | Demo backend: same data, kept in the browser |
| `js/ui.js` | Shared helpers (price format, icons, toasts) |
| `js/i18n.js` | Sinhala and Tamil translations |
| `js/boot.js` | Theme and frame protection (runs first) |
| `functions/` | Cloud Function for PayHere online payments |
| `js/app.js` | Shop pages |
| `js/admin.js` | Admin pages |
| `css/style.css` | All styles (light and dark) |
| `sw.js` | Offline support and app install. Change `VERSION` after editing files |
| `img/` | Logo, app icons, link-preview image |

## Try it on your computer
```
py -m http.server 8000
```
Open <http://localhost:8000/?demo=1>. In demo mode any name signs you in, and the admin password is `demo`.

## License
[MIT](LICENSE) © 2026 Meshan Navod
