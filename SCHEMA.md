# UniMart database schema (Cloud Firestore)

All data lives in Firestore. Who may read or write each field is enforced by [`firestore.rules`](firestore.rules).
Times are stored as numbers (milliseconds since 1970, `Date.now()`). Prices are whole rupees.

```
admins/{uid}                 ← you create these by hand in the console
settings/site
users/{uid}
users/{uid}/private/payout
listings/{listingId}
orders/{orderId}
reviews/{reviewId}
reports/{reportId}
threads/{threadId}
threads/{threadId}/messages/{messageId}
```

## `admins/{uid}`
The document ID is the Firebase Auth **User UID** of an admin. Any fields (e.g. `email`). Nobody can write this collection from the website; add or remove admins only in the Firebase console.

## `settings/site`
| Field | Type | Meaning |
|---|---|---|
| `requireApproval` | bool | New listings start as `pending` and an admin must approve them |
| `announcement` | string | Text in the dark bar at the top of the shop (empty = hidden) |

## `users/{uid}` — profile (private: only the owner and admins can read it)
| Field | Type | Notes |
|---|---|---|
| `name` | string ≤ 40 | Shown to buyers/sellers |
| `uni` | string ≤ 80 | University |
| `favs` | array of listing IDs | Saved listings (≤ 300) |
| `createdAt` | number | |
| `banned` | bool | Only admins can set it. Banned users cannot post, buy, chat or review |

Email and phone are **not** stored here (email stays in Firebase Auth, phone goes only into orders). The name and university shown in the shop are copied onto each listing, and the rules check they match this profile.

## `users/{uid}/private/payout` — seller bank details
`bank`, `branch`, `accountName`, `accountNo`, `updatedAt`. Only the owner and admins can read it. When a seller confirms a bank-transfer order, the app copies these into that order's `sellerBank` so only that buyer sees them.

## `listings/{id}` — items and services
| Field | Type | Notes |
|---|---|---|
| `title` | string ≤ 90 | |
| `desc` | string ≤ 800 | |
| `cat` | string | Category ID from `js/data.js` (`electronics`, `books`, `tutoring`, …) |
| `service` | bool | `true` for services |
| `price` | number | Rupees |
| `was` | number? | Old price → shows a discount badge |
| `unit` | string? | Services: `per hour`, `per job`, … |
| `cond` | string? | Items: `New`, `Like new`, `Good`, `Fair` |
| `img` | string? | Cover photo as a small JPEG data URL (resized to 640 px in the browser) |
| `imgs` | array? | Up to 4 photos (same format); `img` is always `imgs[0]`. Whole document must stay under Firestore's 1 MB limit |
| `sellerId` | string | Owner's uid |
| `sellerName`, `sellerUni`, `sellerJoined` | string | Copied from the profile so lists load fast |
| `status` | string | `pending` → `active` / `paused` / `sold`; `hidden` = removed by admin |
| `featured` | bool | Admin only; shows in Flash deals |
| `sold` | number | Increased when the seller completes an order |
| `createdAt` | number | |
| `sample` | bool? | Example listings added from the admin page |
| `society` | string? | Society or club name when posted for one (≤ 80) |
| `societyVerified` | bool? | Admin only. Shows a blue tick. A verified society name can't be changed by the seller |
| `eventAt` | number? | Event date and time (tickets, stalls, notices). Past events leave the shop 6 hours after they start |
| `venue` | string? | Where the event or class happens (≤ 100) |
| `schedule` | string? | Class times, e.g. "Every Saturday 9 to 11 am" (≤ 120) |
| `stock` | int? | Tickets or stalls available (1–10,000). Buying stops at `sold == stock` |

Categories (`js/data.js`) include items, services, **Event tickets**, **Stalls & Fairs**, **Classes & Courses** and **Ads & Notices** (notices have no checkout; price 0 shows "Free").

Anyone can read `active` listings. Owners also see their own; admins see everything.

## `orders/{id}` — one order per seller
| Field | Type | Notes |
|---|---|---|
| `buyerId`, `buyerName`, `buyerUni` | string | |
| `sellerId`, `sellerName` | string | |
| `lines` | array of `{id, title, price, qty, unit}` | Snapshot at order time |
| `total` | number | |
| `name`, `phone`, `place`, `pay`, `note` | string | Checkout form. Phone is visible only to buyer, seller and admins |
| `method` | string | `cash`, `bank` or `online` |
| `status` | string | (`awaiting_payment` →) `placed` → `confirmed` → `ready` → `completed`, or `cancelled` |
| `paymentStatus` | string | `unpaid`, `paid`, `pending`, `failed`, `review`, `chargeback`. For online orders only the Cloud Function (or an admin) can change it; for cash/bank the seller marks `paid` |
| `payment` | map? | Set by the Cloud Function: PayHere payment id, method, amount |
| `sellerBank` | map? | Seller's bank details, added when the seller confirms a bank-transfer order |
| `paymentRef`, `buyerPaidAt` | string, number | Buyer's bank transfer reference |
| `payout`, `payoutAt` | string, number | Admin only: whether UniMart has sent an online payment on to the seller |
| `createdAt`, `updatedAt` | number | |

Seller moves the status forward or cancels. Buyer can cancel before it is paid. Card details are handled by PayHere and never touch UniMart. See [PAYMENTS.md](PAYMENTS.md).

## `reviews/{listingId_uid}` (one per person per listing)
`listingId`, `sellerId`, `byId`, `byName`, `stars` (int 1–5), `text` (≤ 300), `createdAt`. Public. You cannot review your own listing.

## `reports/{listingId_uid}` (one per person per listing)
`listingId`, `listingTitle`, `sellerId`, `byId`, `byName`, `reason` (≤ 300), `status` (`open`/`resolved`), `createdAt`. Only admins can read them.

## `threads/{id}` and `threads/{id}/messages/{id}`
Thread: `listingId`, `listingTitle`, `listingCat`, `buyerId`, `buyerName`, `sellerId`, `sellerName`, `members` [buyerId, sellerId], `lastText`, `updatedAt`, `unread` {uid: count}.
Message: `from` (uid), `text` (≤ 1000), `createdAt`.
Only the two members (and admins) can read a chat.

## Indexes
No composite indexes are needed: every query uses a single `where` and sorting happens in the browser.

## Free plan limits (Spark)
50k reads / 20k writes / 1 GiB stored per day is plenty for one campus. Photos are stored inside the listing document, so you do **not** need Firebase Storage (which now requires a paid plan).
