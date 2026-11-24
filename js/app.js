/* UniMart – shop pages (hash router, no build step) */
(function () {
  const S = UM.store;
  const { $, $$, esc, money, cat, isService, icon, stars, ago, toast, act, thumb, statusLabel } = UM.ui;
  const view = $("#view");

  function card(l) {
    const off = l.was ? Math.round((1 - l.price / l.was) * 100) : 0;
    const sel = S.sellerOf(l);
    return `<a class="pcard" href="#/item/${l.id}">
      ${thumb(l)}
      ${off > 0 ? `<span class="off">-${off}%</span>` : ""}
      ${isService(l) ? `<span class="kind">Service</span>` : ""}
      ${l.status && l.status !== "active" ? `<span class="kind st">${statusLabel[l.status]}</span>` : ""}
      <div class="pbody">
        <h3>${esc(l.title)}</h3>
        <div class="price">${money(l.price)}${l.unit ? `<small> ${esc(l.unit)}</small>` : ""}${l.was ? ` <s>${money(l.was)}</s>` : ""}</div>
        <div class="meta">${stars(sel.rating || 5)} <span>${l.sold || 0} ${isService(l) ? "booked" : "sold"}</span></div>
        <div class="uni">${esc(sel.uni || "")}</div>
      </div>
    </a>`;
  }
  const grid = (list, empty = "Nothing here yet.") =>
    list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty">${empty}</div>`;

  /* gatekeeper: signed in, profile done, email verified, not banned */
  function needUser(next) {
    if (S.canWrite()) return true;
    if (!S.ready) { view.innerHTML = `<p class="loading">Loading…</p>`; return false; }
    location.hash = "#/account?next=" + encodeURIComponent(next || location.hash.slice(1));
    if (!S.user) toast("Please sign in first");
    return false;
  }

  const pages = {};

  /* ---------- home ---------- */
  pages.home = () => {
    const all = S.allListings().filter((l) => l.status === "active");
    const deals = all.filter((l) => l.featured || l.was).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 10);
    const services = all.filter(isService).sort((a, b) => b.sold - a.sold).slice(0, 10);
    const items = all.filter((l) => !isService(l)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 12);
    const sellers = new Set(all.map((l) => l.sellerId)).size;
    const seen = recent().map((id) => all.find((l) => l.id === id)).filter(Boolean).slice(0, 10);
    return `
    <section class="hero">
      <div>
        <span class="tag">For students of every university in Sri Lanka</span>
        <h1>Buy, sell and hire <em>on campus</em>.</h1>
        <p>Textbooks, laptops, hostel gear, food, tutoring, printing, repairs and rides, from students you can meet at the gate.</p>
        <div class="hero-cta">
          <a class="btn primary" href="#/browse">Start shopping</a>
          <a class="btn ghost" href="#/sell">Sell something</a>
        </div>
      </div>
      <ul class="hero-stats">
        <li><b>${all.length}</b> listings</li>
        <li><b>${sellers}</b> sellers</li>
        <li><b>0%</b> fees</li>
      </ul>
    </section>
    <section class="cats">
      ${UM.categories.map((c) => `<a class="cat" href="#/browse?cat=${c.id}" style="--h:${c.hue}">${icon(c.icon, 26)}<span>${esc(c.name)}</span></a>`).join("")}
    </section>
    ${deals.length ? `<section class="band deals">
      <div class="band-head"><h2>Flash deals</h2><span class="timer" id="timer"></span><a href="#/browse?sort=deal">See all</a></div>
      <div class="row">${deals.map(card).join("")}</div>
    </section>` : ""}
    ${seen.length ? `<section class="band">
      <div class="band-head"><h2>Recently viewed</h2><button class="linkbtn" id="clear-recent">Clear</button></div>
      <div class="row">${seen.map(card).join("")}</div>
    </section>` : ""}
    ${services.length ? `<section class="band">
      <div class="band-head"><h2>Popular services</h2><a href="#/browse?type=service">See all</a></div>
      <div class="row">${services.map(card).join("")}</div>
    </section>` : ""}
    <section class="band">
      <div class="band-head"><h2>Just listed</h2><a href="#/browse?sort=new">See all</a></div>
      ${grid(items, `No listings yet. <a href="#/sell">Be the first to sell something</a>.`)}
    </section>
    <section class="how">
      <div><b>1</b><h3>Find it</h3><p>Search, or filter by your university so you can meet nearby.</p></div>
      <div><b>2</b><h3>Chat and order</h3><p>Ask the seller anything, then order the item or book the service.</p></div>
      <div><b>3</b><h3>Meet and pay</h3><p>Meet at a safe place on campus. Pay cash or bank transfer on delivery.</p></div>
    </section>`;
  };
  pages.home.after = () => {
    const cr = $("#clear-recent"); if (cr) cr.onclick = () => { try { localStorage.removeItem(RV); } catch (e) {} render(true); };
    const el = $("#timer"); if (!el) return;
    const end = new Date(); end.setHours(23, 59, 59, 0);
    const tick = () => {
      if (!document.body.contains(el)) return clearInterval(iv);
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      el.textContent = "Ends in " + [s / 3600, (s % 3600) / 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
    };
    const iv = setInterval(tick, 1000); tick();
  };

  /* ---------- browse / search ---------- */
  const PAGE = 20;
  pages.browse = (q) => {
    const f = { q: q.get("q") || "", cat: q.get("cat") || "", uni: q.get("uni") || "", type: q.get("type") || "", sort: q.get("sort") || "popular", max: q.get("max") || "" };
    let list = S.allListings().filter((l) => l.status === "active");
    if (f.q) { const w = f.q.toLowerCase().split(/\s+/); list = list.filter((l) => { const t = (l.title + " " + l.desc + " " + cat(l.cat).name + " " + l.sellerUni).toLowerCase(); return w.every((x) => t.includes(x)); }); }
    if (f.cat) list = list.filter((l) => l.cat === f.cat);
    if (f.type) list = list.filter((l) => (f.type === "service") === isService(l));
    if (f.uni) list = list.filter((l) => l.sellerUni === f.uni);
    if (f.max) list = list.filter((l) => l.price <= +f.max);
    const sorts = {
      popular: (a, b) => (b.sold || 0) - (a.sold || 0),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      new: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      deal: (a, b) => (b.was ? 1 - b.price / b.was : 0) - (a.was ? 1 - a.price / a.was : 0)
    };
    list.sort(sorts[f.sort] || sorts.popular);
    const shown = Math.max(PAGE, +q.get("n") || PAGE);
    const title = f.cat ? esc(cat(f.cat).name) : f.q ? `Results for “${esc(f.q)}”` : f.type === "service" ? "Services" : f.type === "item" ? "Items" : "Everything";
    return `
    <div class="crumbs"><a href="#/">Home</a> › ${title}</div>
    <h1 class="page-title">${title} <small>${list.length} found</small></h1>
    <form class="filters" id="filters">
      <input type="hidden" name="q" value="${esc(f.q)}">
      <label>Type<select name="type"><option value="">All</option><option value="item" ${f.type === "item" ? "selected" : ""}>Items</option><option value="service" ${f.type === "service" ? "selected" : ""}>Services</option></select></label>
      <label>Category<select name="cat"><option value="">All categories</option>${UM.categories.map((c) => `<option value="${c.id}" ${f.cat === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
      <label>University<select name="uni"><option value="">All universities</option>${UM.universities.map((u) => `<option ${f.uni === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></label>
      <label>Max price<input name="max" type="number" min="0" step="100" placeholder="Any" value="${esc(f.max)}"></label>
      <label>Sort<select name="sort">${[["popular", "Best selling"], ["low", "Price: low to high"], ["high", "Price: high to low"], ["deal", "Biggest discount"], ["new", "Newest"]].map(([v, t]) => `<option value="${v}" ${f.sort === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    </form>
    ${grid(list.slice(0, shown), `No listings match. <a href="#/sell">Be the first to sell one</a>.`)}
    ${list.length > shown ? `<div class="center more"><button class="btn outline" id="more">Show more (${list.length - shown} left)</button></div>` : ""}`;
  };
  pages.browse.after = (q) => {
    const more = $("#more"); if (more) more.onclick = () => { q.set("n", (+q.get("n") || PAGE) + PAGE); history.replaceState(null, "", "#/browse?" + q); render(true); };
    const form = $("#filters");
    form.addEventListener("change", () => {
      const p = new URLSearchParams();
      new FormData(form).forEach((v, k) => v && p.set(k, v));
      location.hash = "#/browse?" + p;
    });
  };

  /* ---------- one listing ---------- */
  pages.item = (q, id) => {
    const l = S.listing(id);
    if (!l) return S.ready ? `<div class="empty">This listing is not available. <a href="#/browse">Keep browsing</a></div>` : `<p class="loading">Loading…</p>`;
    const sel = S.sellerOf(l);
    const svc = isService(l);
    const revs = S.reviews(l.id);
    const similar = S.allListings().filter((x) => x.status === "active" && x.cat === l.cat && x.id !== l.id).slice(0, 8);
    const mine = S.user && l.sellerId === S.user.id;
    const buyable = l.status === "active" && !mine;
    return `
    <div class="crumbs"><a href="#/">Home</a> › <a href="#/browse?cat=${l.cat}">${esc(cat(l.cat).name)}</a></div>
    ${l.status !== "active" ? `<div class="notice">${statusLabel[l.status] || l.status}${l.status === "pending" ? ": an admin will check it soon." : ""}</div>` : ""}
    <div class="detail">
      <div class="gallery">
        ${thumb(l, "big")}
        ${l.imgs && l.imgs.length > 1 ? `<div class="gthumbs">${l.imgs.map((src, i) => `<button type="button" class="${i ? "" : "on"}" data-img="${i}" aria-label="Photo ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="info">
        <h1>${esc(l.title)}</h1>
        <div class="meta">${stars(sel.rating || 5)} <span>${sel.rating || "New"}</span> · <span>${l.sold || 0} ${svc ? "booked" : "sold"}</span>${l.cond ? ` · <span class="pill">${esc(l.cond)}</span>` : ""}</div>
        <div class="bigprice">${money(l.price)}${l.unit ? `<small> ${esc(l.unit)}</small>` : ""}
          ${l.was ? `<s>${money(l.was)}</s> <span class="off inline">-${Math.round((1 - l.price / l.was) * 100)}%</span>` : ""}</div>
        <ul class="perks">
          <li>${icon("M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z", 18)} Meet at <b>${esc(sel.uni || "campus")}</b></li>
          <li>${icon("M3 6h18v12H3zM3 10h18", 18)} Pay on delivery: cash or bank transfer</li>
          <li>${icon("M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z", 18)} Student seller · report anything wrong</li>
        </ul>
        ${mine ? `<div class="actions">
            <a class="btn outline" href="#/sell?edit=${l.id}">Edit</a>
            ${l.status === "active" ? `<button class="btn ghost" data-st="paused">Pause</button><button class="btn ghost" data-st="sold">Mark sold</button>` : ""}
            ${["paused", "sold"].includes(l.status) ? `<button class="btn ghost" data-st="active">Put back on sale</button>` : ""}
            <button class="btn ghost danger" id="del">Delete</button>
          </div>` : buyable ? `
        <div class="actions">
          ${svc ? "" : `<div class="qty"><button type="button" data-q="-1" aria-label="Less">−</button><input id="qty" type="number" min="1" value="1" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></div>`}
          <button class="btn primary" id="buy">${svc ? "Book now" : "Buy now"}</button>
          <button class="btn outline" id="add">Add to cart</button>
          <button class="btn icon ${S.isFav(l.id) ? "on" : ""}" id="fav" aria-label="Save">♥</button>
        </div>` : ""}
        <div class="seller">
          <a class="avatar" href="#/seller/${esc(l.sellerId)}">${esc((sel.name || "?")[0])}</a>
          <div><a href="#/seller/${esc(l.sellerId)}"><b>${esc(sel.name)}</b></a><small>${esc(sel.uni)} · ${sel.sales} sales${sel.joined ? " · since " + esc(sel.joined) : ""}</small></div>
          ${mine ? "" : `<button class="btn ghost" id="chat">Message</button>`}
        </div>
        <div class="share">
          <span class="muted small">Share:</span>
          <a class="chip" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(l.title + " · " + money(l.price) + " on UniMart " + location.href.split("#")[0] + "#/item/" + l.id)}">WhatsApp</a>
          <button class="chip" type="button" id="copy-link">Copy link</button>
          ${navigator.share ? `<button class="chip" type="button" id="native-share">More…</button>` : ""}
        </div>
      </div>
    </div>
    <section class="panel">
      <h2>About this ${svc ? "service" : "item"}</h2>
      <p class="desc">${esc(l.desc)}</p>
      ${mine ? "" : `<button class="linkbtn" id="report">Report this listing</button>`}
    </section>
    <section class="panel">
      <h2>Reviews ${revs.length ? `<small>(${revs.length})</small>` : ""}</h2>
      ${revs.map((r) => `<div class="review">${stars(r.stars)} <b>${esc(r.byName)}</b> <small>${ago(r.createdAt)}</small>
        ${S.user && (r.byId === S.user.id) ? `<button class="linkbtn" data-delrev="${r.id}">delete</button>` : ""}<p>${esc(r.text)}</p></div>`).join("") || `<p class="muted">No reviews yet.</p>`}
      ${mine ? "" : `<form id="review" class="review-form">
        <select name="stars" aria-label="Stars">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${"★".repeat(n)}</option>`).join("")}</select>
        <input name="text" required maxlength="300" placeholder="Write a short review">
        <button class="btn outline">Post</button></form>`}
    </section>
    ${similar.length ? `<section class="band"><div class="band-head"><h2>Similar listings</h2></div><div class="row">${similar.map(card).join("")}</div></section>` : ""}`;
  };
  pages.item.after = (q, id) => {
    const l = S.listing(id); if (!l) return;
    $$("[data-img]").forEach((b) => (b.onclick = () => {
      $(".gallery .thumb img").src = l.imgs[+b.dataset.img];
      $$("[data-img]").forEach((x) => x.classList.toggle("on", x === b));
    }));
    const link = location.href.split("#")[0] + "#/item/" + l.id;
    const cl = $("#copy-link"); if (cl) cl.onclick = () => navigator.clipboard.writeText(link).then(() => toast("Link copied"), () => prompt("Copy this link:", link));
    const ns = $("#native-share"); if (ns) ns.onclick = () => navigator.share({ title: l.title, text: l.title + " · " + money(l.price), url: link }).catch(() => {});
    rememberView(l.id);
    const qty = () => Math.max(1, parseInt(($("#qty") || {}).value, 10) || 1);
    $$("[data-q]").forEach((b) => (b.onclick = () => { $("#qty").value = Math.max(1, qty() + +b.dataset.q); }));
    const add = $("#add"); if (add) add.onclick = () => { S.addToCart(l.id, qty()); toast("Added to cart"); };
    const buy = $("#buy"); if (buy) buy.onclick = () => { S.addToCart(l.id, qty()); location.hash = "#/cart"; };
    const fav = $("#fav"); if (fav) fav.onclick = () => { if (!needUser()) return; act(fav, () => S.toggleFav(l.id)).then(() => toast(S.isFav(l.id) ? "Removed from saved" : "Saved")); };
    const chat = $("#chat"); if (chat) chat.onclick = () => { if (!needUser()) return; act(chat, () => S.openThread(l)).then((tid) => (location.hash = "#/messages/" + tid)); };
    const del = $("#del"); if (del) del.onclick = () => { if (confirm("Delete this listing for good?")) act(del, () => S.deleteListing(l.id), "Listing deleted").then(() => (location.hash = "#/account")); };
    $$("[data-st]").forEach((b) => (b.onclick = () => act(b, () => S.updateListing(l.id, { status: b.dataset.st }), "Updated")));
    $$("[data-delrev]").forEach((b) => (b.onclick = () => act(b, () => S.deleteReview(b.dataset.delrev), "Review deleted")));
    const rep = $("#report"); if (rep) rep.onclick = () => {
      if (!needUser()) return;
      const reason = prompt("What is wrong with this listing? (scam, illegal, exam answers, wrong category…)");
      if (reason && reason.trim()) act(rep, () => S.report(l, reason.trim().slice(0, 300)), "Thanks, an admin will check it");
    };
    const rf = $("#review"); if (rf) rf.onsubmit = (e) => {
      e.preventDefault(); if (!needUser()) return;
      act(rf.querySelector("button"), () => S.addReview(l, +rf.stars.value, rf.text.value.trim()), "Review posted").then(() => rf.reset());
    };
  };

  /* ---------- seller profile ---------- */
  pages.seller = (q, id) => {
    const theirs = S.allListings().filter((l) => l.sellerId === id && l.status === "active").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const any = theirs[0] || S.everyListing().find((l) => l.sellerId === id);
    if (!any) return S.ready ? `<div class="empty">This seller has no listings right now. <a href="#/browse">Keep browsing</a></div>` : `<p class="loading">Loading…</p>`;
    const sel = S.sellerOf(any);
    const revs = S.sellerReviews(id);
    const titles = {}; S.everyListing().forEach((l) => (titles[l.id] = l.title));
    const svc = theirs.filter(isService).length;
    return `
    <div class="crumbs"><a href="#/">Home</a> › Seller</div>
    <div class="profile panel">
      <div class="avatar big">${esc((sel.name || "?")[0])}</div>
      <div class="grow"><h1>${esc(sel.name)}</h1><small>${esc(sel.uni)}${sel.joined ? " · on UniMart since " + esc(sel.joined) : ""}</small>
        <div class="meta">${stars(sel.rating || 5)} <b>${sel.rating || "New"}</b> · ${sel.sales} sales · ${revs.length} reviews</div></div>
      <a class="btn outline" href="#/browse?uni=${encodeURIComponent(sel.uni || "")}">More from ${esc((sel.uni || "").replace(/^University of /, ""))}</a>
    </div>
    <section class="band"><div class="band-head"><h2>Listings <small class="muted">${theirs.length - svc} items · ${svc} services</small></h2></div>${grid(theirs, "Nothing for sale right now.")}</section>
    <section class="panel"><h2>Reviews</h2>
      ${revs.slice(0, 20).map((r) => `<div class="review">${stars(r.stars)} <b>${esc(r.byName)}</b> <small>${ago(r.createdAt)} · <a href="#/item/${r.listingId}">${esc(titles[r.listingId] || "listing")}</a></small><p>${esc(r.text)}</p></div>`).join("") || `<p class="muted">No reviews yet.</p>`}
    </section>`;
  };

  /* ---------- recently viewed (this browser only) ---------- */
  const RV = "unimart-recent";
  function recent() { try { return JSON.parse(localStorage.getItem(RV)) || []; } catch (e) { return []; } }
  function rememberView(id) {
    const list = [id].concat(recent().filter((x) => x !== id)).slice(0, 12);
    try { localStorage.setItem(RV, JSON.stringify(list)); } catch (e) {}
  }

  /* ---------- sell / edit ---------- */
  pages.sell = (q) => {
    if (!needUser("/sell" + (q.get("edit") ? "?edit=" + q.get("edit") : ""))) return null;
    const e = q.get("edit") ? S.listing(q.get("edit")) : null;
    if (q.get("edit") && (!e || e.sellerId !== S.user.id)) return `<div class="empty">You can only edit your own listings.</div>`;
    const svc = e ? isService(e) : false;
    const v = (k) => esc(e && e[k] != null ? e[k] : "");
    return `
    <h1 class="page-title">${e ? "Edit listing" : "Sell an item or offer a service"}</h1>
    <form class="panel form" id="sell">
      <div class="seg" role="radiogroup" ${e ? "hidden" : ""}>
        <label><input type="radio" name="kind" value="item" ${svc ? "" : "checked"}><span>An item</span></label>
        <label><input type="radio" name="kind" value="service" ${svc ? "checked" : ""}><span>A service</span></label>
      </div>
      <label>Title<input name="title" required maxlength="90" value="${v("title")}" placeholder="e.g. Casio calculator, or poster design"></label>
      <div class="two">
        <label>Category<select name="cat" required></select></label>
        <label>Price (Rs)<input name="price" type="number" min="0" step="10" required value="${v("price")}"></label>
      </div>
      <div class="two">
        <label id="cond-wrap">Condition<select name="cond">${["New", "Like new", "Good", "Fair"].map((c) => `<option ${(e ? e.cond === c : c === "Good") ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        <label id="unit-wrap" hidden>Charged<select name="unit">${["per hour", "per job", "per session", "per page", "per order", "per copy", "from"].map((c) => `<option ${e && e.unit === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        <label>Old price (optional, shows a deal)<input name="was" type="number" min="0" step="10" value="${v("was")}"></label>
      </div>
      <label>Description<textarea name="desc" rows="5" required maxlength="800" placeholder="What is it, what condition, where can buyers meet you?">${v("desc")}</textarea></label>
      <label>Photos (up to 4, the first one is the cover)<input name="photo" type="file" accept="image/*" multiple></label>
      <div class="shots" id="shots"></div>
      <p class="muted">Selling as <b>${esc(S.user.name)}</b> at <b>${esc(S.user.uni)}</b>. No fees.
        ${S.settings.requireApproval && !e ? "New listings are checked by an admin before they go live." : ""}
        Do not sell exam answers, assignments written for others, or anything illegal.</p>
      <button class="btn primary wide">${e ? "Save changes" : "Publish listing"}</button>
    </form>`;
  };
  pages.sell.after = (q) => {
    const f = $("#sell"); if (!f) return;
    const e = q.get("edit") ? S.listing(q.get("edit")) : null;
    let photos = e ? (e.imgs && e.imgs.length ? e.imgs.slice() : e.img ? [e.img] : []) : [];
    const drawShots = () => {
      $("#shots").innerHTML = photos.map((p, i) => `<div class="shot"><img src="${esc(p)}" alt="">${i === 0 ? `<span>Cover</span>` : `<button type="button" data-first="${i}" title="Make cover">★</button>`}<button type="button" class="x" data-rm="${i}" aria-label="Remove photo">×</button></div>`).join("");
      $$("[data-rm]", f).forEach((b) => (b.onclick = () => { photos.splice(+b.dataset.rm, 1); drawShots(); }));
      $$("[data-first]", f).forEach((b) => (b.onclick = () => { photos.unshift(photos.splice(+b.dataset.first, 1)[0]); drawShots(); }));
    };
    drawShots();
    const fillCats = () => {
      const kind = f.kind.value;
      f.cat.innerHTML = UM.categories.filter((c) => c.kind === kind).map((c) => `<option value="${c.id}" ${e && e.cat === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("");
      $("#cond-wrap").hidden = kind === "service"; $("#unit-wrap").hidden = kind !== "service";
    };
    $$("input[name=kind]", f).forEach((r) => (r.onchange = fillCats)); fillCats();
    // shrink each photo to a ~640px JPEG so 4 of them fit inside one Firestore document (1 MB)
    const shrink = (file) => new Promise((ok, bad) => {
      const img = new Image(), rd = new FileReader();
      rd.onload = () => { img.src = rd.result; };
      rd.onerror = bad; img.onerror = () => bad(new Error("That file is not a photo."));
      img.onload = () => {
        const c = document.createElement("canvas"), k = Math.min(1, 640 / Math.max(img.width, img.height));
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", 0.7));
      };
      rd.readAsDataURL(file);
    });
    f.photo.onchange = async () => {
      const files = Array.from(f.photo.files).slice(0, 4 - photos.length);
      if (f.photo.files.length > files.length) toast("Only 4 photos per listing");
      for (const file of files) { try { photos.push(await shrink(file)); } catch (err) { toast(err.message, true); } }
      f.photo.value = ""; drawShots();
    };
    f.onsubmit = (ev) => {
      ev.preventDefault();
      const svc = f.kind.value === "service";
      const was = +f.was.value, price = +f.price.value;
      const data = {
        title: f.title.value.trim(), cat: f.cat.value, price, was: was > price ? was : null,
        desc: f.desc.value.trim(), unit: svc ? f.unit.value : null, cond: svc ? null : f.cond.value,
        img: photos[0] || null, imgs: photos.length ? photos.slice(0, 4) : null
      };
      const btn = f.querySelector("button.primary");
      if (e) return act(btn, () => S.updateListing(e.id, data), "Saved").then(() => (location.hash = "#/item/" + e.id));
      data.service = svc;
      Object.keys(data).forEach((k) => data[k] === null && delete data[k]);
      act(btn, () => S.addListing(data), S.settings.requireApproval ? "Sent for approval" : "Your listing is live")
        .then((id) => (location.hash = "#/item/" + id));
    };
  };

  /* ---------- cart & checkout ---------- */
  pages.cart = () => {
    const lines = S.cart.map((c) => ({ c, l: S.listing(c.id) })).filter((x) => x.l);
    if (!lines.length) return `<h1 class="page-title">Cart</h1><div class="empty">Your cart is empty. <a href="#/browse">Find something</a></div>`;
    const total = lines.reduce((s, x) => s + x.l.price * x.c.qty, 0);
    const sellers = new Set(lines.map((x) => x.l.sellerId)).size;
    return `
    <h1 class="page-title">Cart <small>${S.cartCount()} items</small></h1>
    <div class="cart-layout">
      <div class="panel lines">
        ${lines.map(({ c, l }) => `
        <div class="line">
          <a href="#/item/${l.id}">${thumb(l, "sm")}</a>
          <div class="grow"><a href="#/item/${l.id}">${esc(l.title)}</a><small>${esc(l.sellerName)} · ${esc(l.sellerUni)}</small>
            <div class="price">${money(l.price)}${l.unit ? `<small> ${esc(l.unit)}</small>` : ""}</div>
            ${l.status !== "active" ? `<small class="warn">No longer available</small>` : ""}</div>
          <div class="qty"><button data-id="${l.id}" data-d="-1" aria-label="Less">−</button><span>${c.qty}</span><button data-id="${l.id}" data-d="1" aria-label="More">+</button></div>
        </div>`).join("")}
      </div>
      <aside class="panel summary">
        <h2>Summary</h2>
        <div class="sumrow"><span>Subtotal</span><span>${money(total)}</span></div>
        <div class="sumrow"><span>Platform fee</span><span>Rs 0</span></div>
        <div class="sumrow total"><span>Total</span><span>${money(total)}</span></div>
        <a class="btn primary wide" href="#/checkout">Checkout</a>
        <p class="muted small">${sellers > 1 ? `This makes ${sellers} orders, one per seller. ` : ""}You pay the seller when you meet. Nothing is charged online.</p>
      </aside>
    </div>`;
  };
  pages.cart.after = () => {
    $$("[data-d]").forEach((b) => (b.onclick = () => {
      const line = S.cart.find((c) => c.id === b.dataset.id);
      S.setQty(b.dataset.id, line.qty + +b.dataset.d);
    }));
  };

  pages.checkout = () => {
    if (!S.cart.length) { location.hash = "#/cart"; return null; }
    if (!needUser("/checkout")) return null;
    const own = S.cart.filter((c) => S.listing(c.id).sellerId === S.user.id);
    const gone = S.cart.filter((c) => S.listing(c.id).status !== "active");
    if (own.length || gone.length) return `<div class="empty">Remove ${own.length ? "your own listings" : "items that are no longer available"} from the cart first. <a href="#/cart">Back to cart</a></div>`;
    const total = S.cart.reduce((s, c) => s + S.listing(c.id).price * c.qty, 0);
    return `
    <h1 class="page-title">Checkout</h1>
    <form class="panel form narrow" id="co">
      <label>Your name<input name="name" required value="${esc(S.user.name)}"></label>
      <label>Phone (shared only with the seller)<input name="phone" required inputmode="tel" pattern="[0-9 +]{9,15}" placeholder="07X XXX XXXX"></label>
      <label>Where to meet<select name="place"><option>Main gate</option><option>Library entrance</option><option>Main canteen</option><option>My hostel</option><option>Online (services)</option></select></label>
      <label>Pay with<select name="pay"><option>Cash when we meet</option><option>Bank transfer when we meet</option></select></label>
      <label>Note to seller (optional)<textarea name="note" rows="2" maxlength="300"></textarea></label>
      <div class="sumrow total"><span>Total</span><span>${money(total)}</span></div>
      <button class="btn primary wide">Place order</button>
    </form>`;
  };
  pages.checkout.after = () => {
    const f = $("#co"); if (!f) return;
    f.onsubmit = (e) => {
      e.preventDefault();
      act(f.querySelector("button"), () => S.placeOrder({ name: f.name.value.trim(), phone: f.phone.value.trim(), place: f.place.value, pay: f.pay.value, note: f.note.value.trim() }))
        .then((ids) => { toast(ids.length > 1 ? ids.length + " orders placed" : "Order placed"); location.hash = "#/orders"; });
    };
  };

  /* ---------- orders (buying) & sales (selling) ---------- */
  const steps = ["placed", "confirmed", "ready", "completed"];
  function orderCard(o, asSeller) {
    const next = { placed: "confirmed", confirmed: "ready", ready: "completed" }[o.status];
    const nextLabel = { confirmed: "Confirm order", ready: "Ready to meet", completed: "Mark completed" }[next];
    return `
      <div class="panel order">
        <div class="order-head"><b>#${esc(o.id.slice(-6).toUpperCase())}</b>
          <small>${ago(o.createdAt)} · ${asSeller ? "buyer " + esc(o.buyerName) : "seller " + esc(o.sellerName)}</small>
          <span class="pill ${o.status === "completed" ? "green" : o.status === "cancelled" ? "red" : ""}">${statusLabel[o.status]}</span></div>
        ${o.status !== "cancelled" ? `<ol class="steps">${steps.map((s, i) => `<li class="${i <= steps.indexOf(o.status) ? "on" : ""}">${statusLabel[s]}</li>`).join("")}</ol>` : ""}
        ${o.lines.map((x) => `<div class="sumrow"><a href="#/item/${x.id}">${esc(x.title)} × ${x.qty}</a><span>${money(x.price * x.qty)}</span></div>`).join("")}
        <div class="sumrow total"><span>Total</span><span>${money(o.total)}</span></div>
        <p class="muted small">Meet: ${esc(o.place)} · ${esc(o.pay)}${asSeller ? ` · Phone: <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>` : ""}${o.note ? `<br>Note: ${esc(o.note)}` : ""}</p>
        <div class="actions">
          ${asSeller && next ? `<button class="btn primary small" data-o="${o.id}" data-to="${next}" data-as="sale">${nextLabel}</button>` : ""}
          ${(asSeller && next) || (!asSeller && ["placed", "confirmed"].includes(o.status)) ? `<button class="btn ghost small" data-o="${o.id}" data-to="cancelled" data-as="${asSeller ? "sale" : "buy"}">Cancel</button>` : ""}
        </div>
      </div>`;
  }
  pages.orders = (q) => {
    if (!needUser("/orders")) return null;
    const tab = q.get("tab") === "sales" ? "sales" : "buying";
    const list = tab === "sales" ? S.sales : S.orders;
    const open = S.sales.filter((o) => ["placed", "confirmed", "ready"].includes(o.status)).length;
    return `
    <div class="crumbs"><a href="#/account">My account</a> › Orders</div>
    <h1 class="page-title">Orders</h1>
    <div class="tabs"><a href="#/orders" class="${tab === "buying" ? "on" : ""}">I bought (${S.orders.length})</a><a href="#/orders?tab=sales" class="${tab === "sales" ? "on" : ""}">I sold (${S.sales.length})${open ? ` <span class="badge">${open}</span>` : ""}</a></div>
    ${list.map((o) => orderCard(o, tab === "sales")).join("") || `<div class="empty">${tab === "sales" ? "No sales yet. <a href=\"#/sell\">List something</a>" : "No orders yet. <a href=\"#/browse\">Start shopping</a>"}</div>`}`;
  };
  pages.orders.after = () => $$("[data-o]").forEach((b) => (b.onclick = () => {
    const o = (b.dataset.as === "sale" ? S.sales : S.orders).find((x) => x.id === b.dataset.o);
    if (b.dataset.to === "cancelled" && !confirm("Cancel this order?")) return;
    act(b, () => S.setOrderStatus(o, b.dataset.to), "Order updated");
  }));

  /* ---------- account: sign in, profile, my stuff ---------- */
  pages.account = (q) => {
    if (!S.ready) return `<p class="loading">Loading…</p>`;
    const nx = q.get("next");
    if (S.canWrite() && nx && nx.startsWith("/") && !nx.startsWith("/account")) { location.hash = "#" + nx; return null; }
    const u = S.user;
    if (!u) {
      if (!S.live) return `
      <h1 class="page-title">Sign in</h1>
      <form class="panel form narrow" id="demo-in">
        <p class="notice">Demo mode: no password needed. Add Firebase keys (see SETUP.md) for real accounts.</p>
        <label>Your name<input name="name" required maxlength="40" autocomplete="name"></label>
        <label>University<select name="uni">${UM.universities.map((x) => `<option>${esc(x)}</option>`).join("")}</select></label>
        <button class="btn primary wide">Continue</button>
      </form>`;
      const mode = q.get("mode") || "in";
      return `
      <h1 class="page-title">${mode === "up" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}</h1>
      <div class="panel form narrow">
        ${mode !== "reset" ? `<button class="btn outline wide google" id="google">
          <svg viewBox="0 0 48 48" width="20" height="20"><path fill="#4285F4" d="M45 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8a10 10 0 0 1-4.4 6.6v5.5h7.1C42.7 36.7 45 31.1 45 24.5Z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7A22 22 0 0 0 24 46Z"/><path fill="#FBBC05" d="M11.8 28.2a13 13 0 0 1 0-8.4v-5.7H4.5a22 22 0 0 0 0 19.8z"/><path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3A22 22 0 0 0 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9Z"/></svg>
          Continue with Google</button><div class="or">or with email</div>` : ""}
        <form id="email-form" class="form">
          <label>Email<input name="email" type="email" required autocomplete="email"></label>
          ${mode !== "reset" ? `<label>Password<input name="password" type="password" required minlength="6" autocomplete="${mode === "up" ? "new-password" : "current-password"}"></label>` : ""}
          <button class="btn primary wide">${mode === "up" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
        </form>
        <p class="center small">
          ${mode === "in" ? `New here? <a href="#/account?mode=up">Create an account</a> · <a href="#/account?mode=reset">Forgot password?</a>` : `<a href="#/account">Back to sign in</a>`}
        </p>
      </div>`;
    }
    if (u.banned) return `<div class="empty">This account has been suspended by an admin. Contact the site admin if you think this is a mistake.<br><br><button class="btn ghost" id="signout">Sign out</button></div>`;
    if (u.verified === false) return `
      <h1 class="page-title">Confirm your email</h1>
      <div class="panel form narrow">
        <p>We sent a link to <b>${esc(u.email)}</b>. Open it, then come back and tap “I confirmed”.</p>
        <button class="btn primary wide" id="reload">I confirmed</button>
        <button class="btn ghost wide" id="resend">Send the email again</button>
        <button class="linkbtn" id="signout">Use another account</button>
      </div>`;
    if (u.needsProfile || q.get("edit") === "profile") return `
      <h1 class="page-title">${u.needsProfile ? "One last step" : "Edit profile"}</h1>
      <form class="panel form narrow" id="profile">
        <p class="muted">Buyers and sellers see your name and university.</p>
        <label>Your name<input name="name" required maxlength="40" value="${esc(u.name)}"></label>
        <label>University<select name="uni">${UM.universities.map((x) => `<option ${u.uni === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
        <button class="btn primary wide">Save</button>
      </form>`;

    const mine = S.myListings().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const favs = S.favs.map((id) => S.listing(id)).filter(Boolean);
    const openSales = S.sales.filter((o) => ["placed", "confirmed", "ready"].includes(o.status)).length;
    return `
    <div class="profile panel">
      <div class="avatar big">${u.photo ? `<img src="${esc(u.photo)}" alt="">` : esc((u.name || "?")[0])}</div>
      <div class="grow"><h1>${esc(u.name)}</h1><small>${esc(u.uni)}${u.email ? " · " + esc(u.email) : ""}</small>
        <div><a href="#/account?edit=profile">Edit profile</a>${S.isAdmin ? ` · <a href="admin.html">Admin panel</a>` : ""}</div></div>
      <button class="btn ghost" id="signout">Sign out</button>
    </div>
    <div class="tiles">
      <a href="#/orders"><b>${S.orders.length}</b>Bought</a>
      <a href="#/orders?tab=sales"><b>${S.sales.length}</b>Sold${openSales ? ` <span class="badge">${openSales}</span>` : ""}</a>
      <a href="#/messages"><b>${S.threads.length}</b>Chats</a>
      <a href="#/account" id="to-favs"><b>${favs.length}</b>Saved</a>
    </div>
    <section class="band"><div class="band-head"><h2>My listings</h2><a href="#/sell">+ New</a></div>${grid(mine, `You have not listed anything. <a href="#/sell">Sell your first item</a>.`)}</section>
    <section class="band" id="favs"><div class="band-head"><h2>Saved</h2></div>${grid(favs, "Tap ♥ on a listing to save it here.")}</section>`;
  };
  pages.account.after = (q) => {
    const go = () => { const n = q.get("next"); location.hash = "#" + (n && n.startsWith("/") ? n : "/account"); };
    const d = $("#demo-in"); if (d) d.onsubmit = (e) => { e.preventDefault(); act(d.querySelector("button"), () => S.signInDemo(d.name.value.trim(), d.uni.value)).then(go); };
    const g = $("#google"); if (g) g.onclick = () => act(g, () => S.signInGoogle());
    const ef = $("#email-form"); if (ef) ef.onsubmit = (e) => {
      e.preventDefault();
      const mode = q.get("mode") || "in", btn = ef.querySelector("button");
      if (mode === "reset") return act(btn, () => S.resetPassword(ef.email.value.trim()), "Reset link sent. Check your inbox.");
      act(btn, () => (mode === "up" ? S.signUpEmail(ef.email.value.trim(), ef.password.value) : S.signInEmail(ef.email.value.trim(), ef.password.value)));
    };
    const r = $("#reload"); if (r) r.onclick = () => act(r, () => S.reloadUser());
    const rs = $("#resend"); if (rs) rs.onclick = () => act(rs, () => S.resendVerify(), "Email sent");
    const p = $("#profile"); if (p) p.onsubmit = (e) => { e.preventDefault(); act(p.querySelector("button"), () => S.saveProfile({ name: p.name.value.trim(), uni: p.uni.value }), "Saved").then(go); };
    const so = $("#signout"); if (so) so.onclick = () => act(so, () => S.signOut()).then(() => (location.hash = "#/"));
    const tf = $("#to-favs"); if (tf) tf.onclick = (e) => { e.preventDefault(); $("#favs").scrollIntoView({ behavior: "smooth" }); };
  };

  /* ---------- messages ---------- */
  let stopMsgs = null;
  pages.messages = (q, id) => {
    if (!needUser("/messages" + (id ? "/" + id : ""))) return null;
    const me = S.user.id;
    if (id) {
      const t = S.thread(id); if (!t) return S.ready ? `<div class="empty">Chat not found. <a href="#/messages">All chats</a></div>` : `<p class="loading">Loading…</p>`;
      const iAmSeller = t.sellerId === me;
      const other = iAmSeller ? t.buyerName : t.sellerName;
      const l = S.listing(t.listingId) || { title: t.listingTitle, cat: t.listingCat };
      const msgs = S.messages(id);
      return `
      <div class="crumbs"><a href="#/messages">Messages</a> › ${esc(other)}</div>
      <div class="chat panel">
        <a class="chat-head" href="#/item/${t.listingId}">${thumb(l, "sm")}<div><b>${esc(other)}</b><small>${iAmSeller ? "Buyer · " : ""}${esc(t.listingTitle)}</small></div></a>
        <div class="msgs" id="msgs">
          ${msgs.map((m) => `<div class="msg ${m.from === me ? "me" : ""}">${esc(m.text)}<small>${ago(m.createdAt)}</small></div>`).join("") || `<p class="muted center">Say hi and ask about the listing. Never share passwords or pay before you meet.</p>`}
        </div>
        ${iAmSeller ? "" : `<div class="quick">${["Is this still available?", "Can we meet today?", "What's the last price?"].map((s) => `<button type="button">${s}</button>`).join("")}</div>`}
        <form id="send" class="send"><input name="text" required maxlength="1000" autocomplete="off" placeholder="Write a message"><button class="btn primary">Send</button></form>
      </div>`;
    }
    return `
    <h1 class="page-title">Messages</h1>
    <div class="panel list">
      ${S.threads.map((t) => {
        const l = S.listing(t.listingId) || { title: t.listingTitle, cat: t.listingCat };
        const other = t.sellerId === me ? t.buyerName : t.sellerName;
        const n = (t.unread && t.unread[me]) || 0;
        return `<a class="thread" href="#/messages/${t.id}">${thumb(l, "sm")}<div class="grow"><b>${esc(other)}</b> <small>${ago(t.updatedAt)}</small><small>${esc(t.lastText || t.listingTitle)}</small></div>${n ? `<span class="badge">${n}</span>` : ""}</a>`;
      }).join("") || `<div class="empty">No chats yet. Tap “Message” on any listing.</div>`}
    </div>`;
  };
  pages.messages.after = (q, id) => {
    if (!id) return;
    const t = S.thread(id); if (!t) return;
    if (!stopMsgs || stopMsgs.id !== id) { if (stopMsgs) stopMsgs(); stopMsgs = S.watchMessages(id); stopMsgs.id = id; }
    S.markRead(t);
    const box = $("#msgs"); box.scrollTop = box.scrollHeight;
    const f = $("#send");
    const send = (text) => S.send(S.thread(id), text).catch((e) => toast(e.message, true));
    f.onsubmit = (e) => { e.preventDefault(); const v = f.text.value.trim(); if (v) { f.text.value = ""; send(v); } };
    $$(".quick button").forEach((b) => (b.onclick = () => send(b.textContent)));
  };

  /* ---------- router ---------- */
  function refreshChrome() {
    const n = S.cartCount();
    $("#cart-count").textContent = n;
    const m = $("#cart-count-m"); m.textContent = n; m.hidden = !n;
    $("#msg-dot").hidden = !(S.user && S.unreadCount());
    $("#account-link").textContent = S.user && S.user.name ? S.user.name.split(" ")[0] : "Sign in";
    const ann = S.settings.announcement, a = $("#announce");
    a.hidden = !ann || sessionStorage.getItem("um-ann-x") === ann; $("#announce-text").textContent = ann || "";
  }

  let current = "";
  function render(keep) {
    const raw = location.hash.replace(/^#/, "") || "/";
    if (!raw.startsWith("/")) return;
    const [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    const name = parts[0] || "home";
    const page = pages[name] || pages.home;
    const q = new URLSearchParams(qs || "");
    if (name !== "messages" || !parts[1]) { if (stopMsgs) { stopMsgs(); stopMsgs = null; } }

    // keep what the user typed when live data re-draws the page
    const saved = keep ? $$("input[name], textarea[name], select[name]", view).filter((el) => el.type !== "file" && el.type !== "radio").map((el) => [el.closest("form") && el.closest("form").id, el.name, el.value]) : [];
    const focus = keep && document.activeElement && view.contains(document.activeElement) ? document.activeElement.name : null;

    const html = page(q, parts[1]);
    if (html === null) return; // page redirected
    view.innerHTML = html;
    saved.forEach(([fid, n, v]) => { const el = $((fid ? "#" + fid + " " : "") + `[name="${n}"]`, view); if (el && el.type !== "hidden") el.value = v; });
    if (focus) { const el = $(`[name="${focus}"]`, view); if (el) el.focus(); }
    if (page.after) page.after(q, parts[1]);
    $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === name || (name === "item" && a.dataset.nav === "browse")));
    if (!keep) $("#search-input").value = q.get("q") || "";
    document.title = name === "home" ? "UniMart · Campus marketplace" : "UniMart · " + (name[0].toUpperCase() + name.slice(1));
    refreshChrome();
    current = raw;
  }

  window.addEventListener("hashchange", () => {
    const before = current.split("?")[0];
    render(false);
    if (location.hash.replace(/^#/, "").split("?")[0] !== before) window.scrollTo(0, 0);
  });
  // Forms with unsaved work (sell, checkout) only re-draw when sign-in state changes,
  // so other people's live updates never wipe a half-filled form or picked photos.
  pages.sell.live = false; pages.checkout.live = false;
  const authKey = () => [S.ready, S.user && S.user.id, S.user && S.user.needsProfile, S.user && S.user.verified, S.user && S.user.banned].join("|");
  let lastAuth = authKey();
  S.onChange(() => {
    const k = authKey(), changed = k !== lastAuth; lastAuth = k;
    const name = (location.hash.replace(/^#\/?/, "").split(/[/?]/)[0]) || "home";
    if (!changed && pages[name] && pages[name].live === false && view.querySelector("form")) return refreshChrome();
    render(true);
  });

  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#search-input").value.trim();
    location.hash = "#/browse" + (v ? "?q=" + encodeURIComponent(v) : "");
  });
  $("#announce-x").addEventListener("click", () => { try { sessionStorage.setItem("um-ann-x", S.settings.announcement); } catch (e) {} $("#announce").hidden = true; });
  const reset = $("#reset-demo");
  if (S.live) reset.hidden = true;
  else reset.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Clear all demo listings, orders and chats in this browser?")) { S.resetDemo(); S.setQty && S.cart.forEach((c) => S.setQty(c.id, 0)); location.hash = "#/"; toast("Demo reset"); }
  });
  /* installable app: offline support + "Install app" button where the browser allows it */
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("#install").hidden = false; });
  $("#install").onclick = async (e) => { e.preventDefault(); if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $("#install").hidden = true; };

  const tp = $("#theme-pick");
  tp.value = document.documentElement.dataset.theme || "";
  tp.onchange = () => {
    if (tp.value) document.documentElement.dataset.theme = tp.value; else delete document.documentElement.dataset.theme;
    try { if (tp.value) localStorage.setItem("unimart-theme", tp.value); else localStorage.removeItem("unimart-theme"); } catch (e) {}
  };
  $("#mode-note").textContent = S.live ? "" : " Demo mode: data is stored only in this browser.";

  render(false);
})();
