<p align="center"><img src="img/logo.svg" alt="UniMart" width="96"></p>

# UniMart

A campus marketplace for Sri Lankan university students. Students buy and sell **items** (books, laptops, hostel gear, food, clothes, bikes) and **services** (tutoring, printing, design, repairs, photography, rides) with other students they can meet on campus. Mobile first, works on any phone.

**Live site:** <https://meshannawod.github.io/unimart/>

It runs as a plain static site on GitHub Pages, with **Firebase** (free plan) for accounts and the database. Without Firebase keys it runs in **demo mode** so you can try everything right away.

## Features
- Home with search, 12 categories, Flash deals with countdown, popular services, newest listings
- Browse with filters: items/services, category, university, max price, sort
- Listing page: photo, price and discount, condition, seller rating and sales, reviews, similar listings, report button
- Sell and edit: items or services, photo upload (auto-resized), pause, mark sold, delete
- Cart → checkout → one order per seller; pay in person (cash or bank transfer)
- Orders: “I bought” and “I sold”, with status steps (placed → confirmed → ready → completed / cancelled)
- Chat between buyer and seller with unread badges
- Saved listings, profile, Google and email sign-in with email verification
- **Admin panel** (`admin.html`): dashboard, approve/hide/feature/delete listings, all orders, suspend users, reports, site settings, sample data

## Guides
| Guide | What it covers |
|---|---|
| [SETUP.md](SETUP.md) | Go live for free: GitHub Pages, Firebase project, sign-in, database rules, making yourself admin |
| [SCHEMA.md](SCHEMA.md) | Every Firestore collection and field, and who can read or write it |
| [firestore.rules](firestore.rules) | Security rules to paste into Firebase |

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
| `js/app.js` | Shop pages |
| `js/admin.js` | Admin pages |
| `css/style.css` | All styles |

## Try it on your computer
```
py -m http.server 8000
```
Open <http://localhost:8000>. In demo mode any name signs you in, and the admin password is `demo`.
