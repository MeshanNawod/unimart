/* UniMart – admin panel */
(function () {
  const S = UM.store;
  const { $, $$, esc, money, cat, ago, act, thumb, statusLabel, toast } = UM.ui;
  const root = $("#admin");
  let tab = "dash", lfilter = "pending", ofilter = "open", search = "", watching = null, lastGate = "";

  function gate() {
    if (!S.ready) return `<p class="loading">Loading…</p>`;
    if (!S.live && !S.isAdmin) return `
      <form class="panel form narrow" id="pw">
        <h1>Admin sign in</h1>
        <p class="notice">Demo mode. The password is set in <code>js/config.js</code> (default: <b>demo</b>).</p>
        <label>Password<input name="pw" type="password" required autocomplete="current-password"></label>
        <button class="btn primary wide">Sign in</button>
      </form>`;
    if (S.live && !S.user) return `
      <div class="panel form narrow">
        <h1>Admin sign in</h1>
        <button class="btn outline wide" id="google">Continue with Google</button>
        <div class="or">or</div>
        <form id="email" class="form">
          <label>Email<input name="email" type="email" required autocomplete="email"></label>
          <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
          <button class="btn primary wide">Sign in</button>
        </form>
      </div>`;
    if (S.live && !S.isAdmin) return `
      <div class="panel form narrow">
        <h1>Not an admin yet</h1>
        <p>You are signed in as <b>${esc(S.user.email)}</b>, but this account is not an admin.</p>
        <p>To make it an admin, open Firebase console → Firestore Database → start collection <code>admins</code> → Document ID:</p>
        <p><code class="copy" id="uid">${esc(S.user.id)}</code> <button class="btn ghost small" id="copy">Copy</button></p>
        <p class="muted small">Add any field (for example <code>email</code> = your email), save, then reload this page. See SETUP.md.</p>
        <button class="btn ghost" id="out">Sign out</button>
      </div>`;
    return null;
  }

  const count = (arr, f) => arr.filter(f).length;

  /* CSV export (opens in Excel / Google Sheets) */
  const day = (t) => (t ? new Date(t).toISOString().slice(0, 16).replace("T", " ") : "");
  const exporters = {
    listings: () => [["id", "title", "category", "type", "price", "old price", "status", "featured", "sold", "seller", "university", "created"]]
      .concat(S.everyListing().map((l) => [l.id, l.title, cat(l.cat).name, l.service ? "service" : "item", l.price, l.was || "", l.status, l.featured ? "yes" : "", l.sold || 0, l.sellerName, l.sellerUni, day(l.createdAt)])),
    orders: () => [["id", "status", "total", "buyer", "buyer university", "seller", "items", "meet", "method", "payment", "payment id", "payout", "phone", "created"]]
      .concat(S.admin.orders.map((o) => [o.id, o.status, o.total, o.buyerName, o.buyerUni || "", o.sellerName, o.lines.map((x) => x.title + " x" + x.qty).join("; "), o.place, o.method || "", o.paymentStatus || "", (o.payment && o.payment.id) || "", o.payout || "", o.phone, day(o.createdAt)])),
    users: () => [["id", "name", "university", "suspended", "listings", "orders", "joined"]]
      .concat(S.admin.users.map((u) => [u.id, u.name, u.uni, u.banned ? "yes" : "", count(S.everyListing(), (l) => l.sellerId === u.id), count(S.admin.orders, (o) => o.buyerId === u.id), day(u.createdAt)]))
  };
  function download(kind) {
    const cell = (v) => { const s = String(v == null ? "" : v); return /[",\n]/.test(s) || /^[=+\-@]/.test(s) ? '"' + s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"' : s; };
    const csv = "﻿" + exporters[kind]().map((r) => r.map(cell).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `unimart-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const exportBtn = (kind) => `<button class="btn ghost small" data-csv="${kind}">⬇ Export CSV</button>`;

  function dash() {
    const L = S.everyListing(), A = S.admin;
    const gmv = A.orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
    const cats = UM.categories.map((c) => [c.name, count(L, (l) => l.cat === c.id && l.status === "active")]).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...cats.map((c) => c[1]));
    const recent = A.orders.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    return `
      <div class="kpis">
        <div><b>${count(L, (l) => l.status === "active")}</b>Live listings</div>
        <div class="${count(L, (l) => l.status === "pending") ? "hot" : ""}"><b>${count(L, (l) => l.status === "pending")}</b>Waiting approval</div>
        <div><b>${A.users.length}</b>Users</div>
        <div><b>${A.orders.length}</b>Orders</div>
        <div><b>${money(gmv)}</b>Completed sales</div>
        <div class="${A.orders.some((o) => o.method === "online" && o.paymentStatus === "paid" && o.payout !== "done") ? "hot" : ""}"><b>${money(A.orders.filter((o) => o.method === "online" && o.paymentStatus === "paid" && o.payout !== "done").reduce((s, o) => s + o.total, 0))}</b>Held for sellers</div>
        <div class="${count(A.reports, (r) => r.status === "open") ? "hot" : ""}"><b>${count(A.reports, (r) => r.status === "open")}</b>Open reports</div>
      </div>
      <div class="two-col">
        <section class="panel"><h2>Live listings by category</h2>
          ${cats.map(([n, v]) => `<div class="bar"><span>${esc(n)}</span><i style="width:${(v / max) * 100}%"></i><b>${v}</b></div>`).join("")}
        </section>
        <section class="panel"><h2>Latest orders</h2>
          ${recent.map((o) => `<div class="sumrow"><span>${esc(o.buyerName)} → ${esc(o.sellerName)}<small class="muted"> · ${ago(o.createdAt)}</small></span><span>${money(o.total)} <span class="pill">${statusLabel[o.status]}</span></span></div>`).join("") || `<p class="muted">No orders yet.</p>`}
        </section>
      </div>`;
  }

  function listings() {
    let L = S.everyListing().slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (lfilter !== "all") L = L.filter((l) => l.status === lfilter);
    if (search) L = L.filter((l) => (l.title + l.sellerName + l.sellerUni).toLowerCase().includes(search));
    const n = (s) => count(S.everyListing(), (l) => l.status === s);
    return `
      <div class="toolbar">
        <div class="chips">${[["pending", "Waiting"], ["active", "Live"], ["hidden", "Hidden"], ["paused", "Paused"], ["sold", "Sold"], ["all", "All"]].map(([v, t]) => `<button class="chip ${lfilter === v ? "on" : ""}" data-lf="${v}">${t}${v !== "all" ? ` ${n(v)}` : ""}</button>`).join("")}</div>
        <input id="q" type="search" placeholder="Search title, seller, university" value="${esc(search)}">
        ${exportBtn("listings")}
      </div>
      <div class="panel table">
        ${L.map((l) => `
          <div class="trow">
            <a href="index.html#/item/${l.id}" target="_blank" rel="noopener">${thumb(l, "sm")}</a>
            <div class="grow"><b>${esc(l.title)}</b>
              <small>${money(l.price)} · ${esc(cat(l.cat).name)} · ${esc(l.sellerName)} (${esc(l.sellerUni)}) · ${ago(l.createdAt)}${l.sample ? " · sample" : ""}</small>
              ${l.society ? `<small>Society: <b>${esc(l.society)}</b> ${l.societyVerified ? "✔ verified" : "(not verified)"}</small>` : ""}
              ${l.eventAt ? `<small>Event: ${esc(new Date(l.eventAt).toLocaleString())}${l.venue ? " · " + esc(l.venue) : ""}${l.stock ? " · " + (l.sold || 0) + "/" + l.stock + " sold" : ""}</small>` : ""}
              <small class="clip">${esc(l.desc)}</small></div>
            <span class="pill ${l.status === "active" ? "green" : l.status === "hidden" ? "red" : ""}">${statusLabel[l.status] || l.status}</span>
            <div class="acts">
              ${l.status !== "active" ? `<button class="btn primary small" data-l="${l.id}" data-set="active">${l.status === "pending" ? "Approve" : "Make live"}</button>` : ""}
              ${l.status !== "hidden" ? `<button class="btn ghost small" data-l="${l.id}" data-set="hidden">${l.status === "pending" ? "Reject" : "Hide"}</button>` : ""}
              ${l.society ? `<button class="btn ghost small ${l.societyVerified ? "on" : ""}" data-l="${l.id}" data-ver="${l.societyVerified ? "0" : "1"}">${l.societyVerified ? "✔ Verified" : "Verify society"}</button>` : ""}
              <button class="btn ghost small ${l.featured ? "on" : ""}" data-l="${l.id}" data-feat="${l.featured ? "0" : "1"}">${l.featured ? "★ Featured" : "☆ Feature"}</button>
              <button class="btn ghost small danger" data-l="${l.id}" data-del="1">Delete</button>
            </div>
          </div>`).join("") || `<div class="empty">Nothing here.</div>`}
      </div>`;
  }

  function orders() {
    let O = S.admin.orders.slice().sort((a, b) => b.createdAt - a.createdAt);
    const owed = (o) => o.method === "online" && o.paymentStatus === "paid" && o.payout !== "done";
    if (ofilter === "open") O = O.filter((o) => ["awaiting_payment", "placed", "confirmed", "ready"].includes(o.status));
    else if (ofilter === "payout") O = O.filter((o) => owed(o) && o.status === "completed");
    else if (ofilter !== "all") O = O.filter((o) => o.status === ofilter);
    return `
      <div class="toolbar"><div class="chips">${[["open", "Open"], ["payout", "To pay sellers " + count(S.admin.orders, (o) => owed(o) && o.status === "completed")], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All"]].map(([v, t]) => `<button class="chip ${ofilter === v ? "on" : ""}" data-of="${v}">${t}</button>`).join("")}</div>${exportBtn("orders")}</div>
      <div class="panel table">
        ${O.map((o) => `
          <div class="trow">
            <div class="grow"><b>#${esc(o.id.slice(-6).toUpperCase())} · ${money(o.total)}</b>
              <small>${esc(o.buyerName)} (${esc(o.buyerUni || "")}) bought from ${esc(o.sellerName)} · ${ago(o.createdAt)}</small>
              <small>${o.lines.map((x) => esc(x.title) + " × " + x.qty).join(", ")}</small>
              <small>Meet ${esc(o.place)} · ${esc(o.pay)} · ${esc(o.phone)}</small>
              <small>Payment: <b>${esc(o.paymentStatus || "unpaid")}</b>${o.payment ? ` · ${esc(o.payment.provider)} ${esc(o.payment.id)} ${esc(o.payment.method || "")}` : ""}${o.paymentRef ? ` · buyer ref ${esc(o.paymentRef)}` : ""}${o.method === "online" && o.paymentStatus === "paid" ? ` · payout: <b>${o.payout === "done" ? "sent" : "not sent"}</b>` : ""}</small>
              <div class="bank-slot" id="bank-${o.id}"></div></div>
            ${owed(o) ? `<div class="acts"><button class="btn ghost small" data-bank="${o.id}" data-seller="${esc(o.sellerId)}">Seller bank details</button><button class="btn primary small" data-payout="${o.id}">Mark money sent</button></div>` : ""}
            <select data-os="${o.id}" aria-label="Status">${["awaiting_payment", "placed", "confirmed", "ready", "completed", "cancelled"].map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${statusLabel[s]}</option>`).join("")}</select>
          </div>`).join("") || `<div class="empty">No orders.</div>`}
      </div>`;
  }

  function users() {
    let U = S.admin.users.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (search) U = U.filter((u) => (u.name + u.uni).toLowerCase().includes(search));
    const L = S.everyListing();
    return `
      <div class="toolbar"><span class="muted">${U.length} users</span><input id="q" type="search" placeholder="Search name or university" value="${esc(search)}">${exportBtn("users")}</div>
      <div class="panel table">
        ${U.map((u) => `
          <div class="trow">
            <div class="avatar">${esc((u.name || "?")[0])}</div>
            <div class="grow"><b>${esc(u.name)}</b><small>${esc(u.uni)} · joined ${ago(u.createdAt)} · ${count(L, (l) => l.sellerId === u.id)} listings · ${count(S.admin.orders, (o) => o.buyerId === u.id)} orders</small><small class="muted">${esc(u.id)}</small></div>
            ${u.banned ? `<span class="pill red">Suspended</span>` : ""}
            <button class="btn ${u.banned ? "primary" : "ghost danger"} small" data-u="${u.id}" data-ban="${u.banned ? "0" : "1"}">${u.banned ? "Restore" : "Suspend"}</button>
          </div>`).join("") || `<div class="empty">No users yet.</div>`}
      </div>`;
  }

  function reports() {
    const R = S.admin.reports.slice().sort((a, b) => (a.status === "open" ? -1 : 1) - (b.status === "open" ? -1 : 1) || b.createdAt - a.createdAt);
    return `
      <div class="panel table">
        ${R.map((r) => {
          const l = S.listing(r.listingId);
          return `<div class="trow">
            <div class="grow"><b><a href="index.html#/item/${r.listingId}" target="_blank" rel="noopener">${esc(r.listingTitle)}</a></b>
              <small>Reported by ${esc(r.byName)} · ${ago(r.createdAt)}</small><p>“${esc(r.reason)}”</p></div>
            <span class="pill ${r.status === "open" ? "red" : "green"}">${r.status}</span>
            <div class="acts">
              ${l && l.status !== "hidden" ? `<button class="btn ghost small" data-l="${l.id}" data-set="hidden">Hide listing</button>` : ""}
              ${r.status === "open" ? `<button class="btn primary small" data-r="${r.id}">Mark resolved</button>` : ""}
            </div></div>`;
        }).join("") || `<div class="empty">No reports. 🎉</div>`}
      </div>`;
  }

  function settings() {
    const st = S.settings;
    return `
      <form class="panel form narrow" id="settings">
        <h2>Site settings</h2>
        <label class="check"><input type="checkbox" name="requireApproval" ${st.requireApproval ? "checked" : ""}> New listings need admin approval before going live</label>
        <label>Announcement bar (empty = hidden)<input name="announcement" maxlength="200" value="${esc(st.announcement || "")}"></label>
        <button class="btn primary">Save settings</button>
      </form>
      <section class="panel form narrow">
        <h2>Sample data</h2>
        <p class="muted">Add ${UM.seedListings.length} example listings so a new site does not look empty. You can delete them later (they are marked “sample”).</p>
        <button class="btn outline" id="samples">Load sample listings</button>
        ${S.live ? "" : `<button class="btn ghost danger" id="reset">Reset all demo data</button>`}
      </section>`;
  }

  const tabs = { dash: ["Dashboard", dash], listings: ["Listings", listings], orders: ["Orders", orders], users: ["Users", users], reports: ["Reports", reports], settings: ["Settings", settings] };

  function render() {
    const g = gate();
    $("#admin-out").hidden = !(S.isAdmin || (S.live && S.user));
    if (g !== null) { if (lastGate !== g) { root.innerHTML = g; lastGate = g; bindGate(); } root.dataset.v = "gate"; return; }
    lastGate = "";
    if (!watching) watching = S.watchAdmin();
    const pend = count(S.everyListing(), (l) => l.status === "pending"), rep = count(S.admin.reports, (r) => r.status === "open");
    const focusQ = document.activeElement && document.activeElement.id === "q";
    const pos = focusQ ? document.activeElement.selectionStart : 0;
    root.dataset.v = "panel";
    root.innerHTML = `
      <div class="admin-tabs">${Object.keys(tabs).map((k) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${tabs[k][0]}${k === "listings" && pend ? ` <span class="badge">${pend}</span>` : ""}${k === "reports" && rep ? ` <span class="badge">${rep}</span>` : ""}</button>`).join("")}</div>
      <div id="tab">${tabs[tab][1]()}</div>`;
    if (focusQ) { const q = $("#q"); q.focus(); q.setSelectionRange(pos, pos); }
    bind();
  }

  function bindGate() {
    const pw = $("#pw"); if (pw) pw.onsubmit = (e) => { e.preventDefault(); act(pw.querySelector("button"), () => S.adminLogin(pw.pw.value)); };
    const g = $("#google"); if (g) g.onclick = () => act(g, () => S.signInGoogle());
    const em = $("#email"); if (em) em.onsubmit = (e) => { e.preventDefault(); act(em.querySelector("button"), () => S.signInEmail(em.email.value.trim(), em.password.value)); };
    const cp = $("#copy"); if (cp) cp.onclick = () => { navigator.clipboard.writeText($("#uid").textContent).then(() => toast("Copied")); };
    const out = $("#out"); if (out) out.onclick = () => S.signOut();
  }

  function bind() {
    $$("[data-bank]").forEach((b) => (b.onclick = () => act(b, () => S.getPayout(b.dataset.seller)).then((p) => {
      $("#bank-" + b.dataset.bank).innerHTML = p ? `<div class="bankbox"><span>${esc(p.accountName)}</span><span>${esc(p.bank)}${p.branch ? " · " + esc(p.branch) : ""}</span><span class="mono">${esc(p.accountNo)}</span></div>` : `<small class="warn">This seller has not added bank details yet. Message them.</small>`;
    })));
    $$("[data-payout]").forEach((b) => (b.onclick = () => {
      const o = S.admin.orders.find((x) => x.id === b.dataset.payout);
      if (confirm("Did you send " + money(o.total) + " to " + o.sellerName + "? This only records it.")) act(b, () => S.updateOrder(o, { payout: "done", payoutAt: Date.now() }), "Recorded as paid out");
    }));
    $$("[data-csv]").forEach((b) => (b.onclick = () => download(b.dataset.csv)));
    $$("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; search = ""; render(); }));
    $$("[data-lf]").forEach((b) => (b.onclick = () => { lfilter = b.dataset.lf; render(); }));
    $$("[data-of]").forEach((b) => (b.onclick = () => { ofilter = b.dataset.of; render(); }));
    const q = $("#q"); if (q) q.oninput = UM.ui.debounce(() => { search = q.value.trim().toLowerCase(); render(); }, 200);
    $$("[data-set]").forEach((b) => (b.onclick = () => act(b, () => S.updateListing(b.dataset.l, { status: b.dataset.set }), "Listing updated")));
    $$("[data-ver]").forEach((b) => (b.onclick = () => act(b, () => S.updateListing(b.dataset.l, { societyVerified: b.dataset.ver === "1" }), "Updated")));
    $$("[data-feat]").forEach((b) => (b.onclick = () => act(b, () => S.updateListing(b.dataset.l, { featured: b.dataset.feat === "1" }), "Updated")));
    $$("[data-del]").forEach((b) => (b.onclick = () => { if (confirm("Delete this listing for good?")) act(b, () => S.deleteListing(b.dataset.l), "Deleted"); }));
    $$("[data-os]").forEach((s) => (s.onchange = () => { const o = S.admin.orders.find((x) => x.id === s.dataset.os); act(s, () => S.setOrderStatus(o, s.value), "Order updated"); }));
    $$("[data-ban]").forEach((b) => (b.onclick = () => {
      const on = b.dataset.ban === "1";
      if (on && !confirm("Suspend this user? Their listings will be hidden and they cannot post, buy or chat.")) return;
      act(b, () => S.setUserBanned(b.dataset.u, on), on ? "User suspended" : "User restored");
    }));
    $$("[data-r]").forEach((b) => (b.onclick = () => act(b, () => S.resolveReport(b.dataset.r), "Resolved")));
    const st = $("#settings"); if (st) st.onsubmit = (e) => { e.preventDefault(); act(st.querySelector("button"), () => S.setSettings({ requireApproval: st.requireApproval.checked, announcement: st.announcement.value.trim() }), "Settings saved"); };
    const sm = $("#samples"); if (sm) sm.onclick = () => act(sm, () => S.loadSamples(), "Sample listings added");
    const rs = $("#reset"); if (rs) rs.onclick = () => { if (confirm("Delete ALL demo data in this browser?")) { S.resetDemo(); toast("Demo reset"); } };
  }

  $("#admin-out").onclick = (e) => { e.preventDefault(); act(null, () => S.adminLogout()).then(() => { if (watching) { watching(); watching = null; } }); };
  S.onChange(() => { if (root.dataset.v === "panel" && document.activeElement && ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName) && document.activeElement.id !== "q" && tab === "settings") return; render(); });
  render();
})();
