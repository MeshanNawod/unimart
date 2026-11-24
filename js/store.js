/* UniMart – one data API for every page.
   Reads are instant (from a cache kept fresh by the backend); writes return promises.
   Backend = Firebase when js/config.js has keys, otherwise demo mode (this browser only). */
(function () {
  const cfg = window.UM_CONFIG || {};
  const live = !!(cfg.firebase && cfg.firebase.apiKey);

  const cache = {
    authReady: false, user: null, isAdmin: false,
    listings: [], reviews: [], orders: [], sales: [], threads: [], messages: {},
    settings: { requireApproval: false, announcement: "" },
    admin: { users: [], orders: [], reports: [] }
  };
  const subs = [];
  let queued = false;
  function emit(patch) {
    Object.assign(cache, patch || {});
    if (queued) return; queued = true;
    setTimeout(() => { queued = false; subs.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); }, 30);
  }

  /* sample listings with seller fields filled in (used by demo mode and "Load samples") */
  UM.sampleListings = () => UM.seedListings.map((l, i) => {
    const s = UM.sellers[l.seller];
    const out = Object.assign({}, l, {
      sellerId: "sample-" + s.id, sellerName: s.name, sellerUni: s.uni, sellerRating: s.rating, sellerSales: s.sales,
      sellerJoined: s.joined, status: "active", featured: !!l.was, createdAt: Date.now() - (i + 1) * 3600e3, sample: true
    });
    delete out.seller;
    return out;
  });

  /* ---------- cart lives only in this browser (both modes) ---------- */
  const CART = "unimart-cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART)) || []; } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem(CART, JSON.stringify(cart)); } catch (e) {} emit(); };

  const backend = (live ? UM.firebaseBackend : UM.localBackend)(cfg, emit, cache);

  const S = UM.store = {
    live,
    onChange(fn) { subs.push(fn); },
    get ready() { return cache.authReady; },
    get user() { return cache.user; },
    get isAdmin() { return cache.isAdmin; },
    get settings() { return cache.settings; },
    get admin() { return cache.admin; },
    canWrite() { const u = cache.user; return !!(u && !u.needsProfile && !u.banned && u.verified !== false); },

    /* listings: public = active ones, plus every listing I own */
    allListings() {
      const me = cache.user && cache.user.id;
      return cache.listings.filter((l) => l.status === "active" || (me && l.sellerId === me));
    },
    everyListing() { return cache.listings; },
    listing(id) { return cache.listings.find((l) => l.id === id); },
    myListings() { const me = cache.user && cache.user.id; return me ? cache.listings.filter((l) => l.sellerId === me) : []; },

    /* seller card info: base numbers from the listing + live reviews */
    sellerOf(l) {
      const revs = cache.reviews.filter((r) => r.sellerId === l.sellerId);
      const base = l.sellerRating ? [{ stars: l.sellerRating, w: 5 }] : [];
      const sum = revs.reduce((s, r) => s + r.stars, 0) + base.reduce((s, b) => s + b.stars * b.w, 0);
      const n = revs.length + base.reduce((s, b) => s + b.w, 0);
      const sales = (l.sellerSales || 0) + cache.listings.filter((x) => x.sellerId === l.sellerId && !x.sample).reduce((s, x) => s + (x.sold || 0), 0);
      return { id: l.sellerId, name: l.sellerName, uni: l.sellerUni, rating: n ? Math.round((sum / n) * 10) / 10 : 0, reviews: revs.length, sales, joined: l.sellerJoined || "" };
    },

    addListing(data) {
      const u = cache.user;
      return backend.addListing(Object.assign({}, data, {
        sellerId: u.id, sellerName: u.name, sellerUni: u.uni, sellerJoined: String(new Date().getFullYear()),
        sold: 0, featured: false, status: cache.settings.requireApproval ? "pending" : "active", createdAt: Date.now()
      }));
    },
    updateListing: (id, patch) => backend.updateListing(id, patch),
    deleteListing: (id) => backend.deleteListing(id),

    /* cart */
    get cart() { return cart.filter((c) => S.listing(c.id)); },
    addToCart(id, qty = 1) { const line = cart.find((c) => c.id === id); if (line) line.qty += qty; else cart.push({ id, qty }); saveCart(); },
    setQty(id, qty) { cart = cart.map((c) => (c.id === id ? { id, qty } : c)).filter((c) => c.qty > 0); saveCart(); },
    cartCount() { return S.cart.reduce((n, c) => n + c.qty, 0); },

    /* orders: one order per seller */
    async placeOrder(details) {
      const u = cache.user, groups = {};
      S.cart.forEach((c) => {
        const l = S.listing(c.id);
        (groups[l.sellerId] = groups[l.sellerId] || { sellerId: l.sellerId, sellerName: l.sellerName, lines: [] })
          .lines.push({ id: l.id, title: l.title, price: l.price, qty: c.qty, unit: l.unit || "" });
      });
      const orders = Object.values(groups).map((g) => Object.assign({}, details, g, {
        buyerId: u.id, buyerName: u.name, buyerUni: u.uni, status: "placed", createdAt: Date.now(),
        total: g.lines.reduce((s, x) => s + x.price * x.qty, 0)
      }));
      const ids = await backend.placeOrders(orders);
      cart = []; saveCart();
      return ids;
    },
    get orders() { return cache.orders.slice().sort((a, b) => b.createdAt - a.createdAt); },
    get sales() { return cache.sales.slice().sort((a, b) => b.createdAt - a.createdAt); },
    setOrderStatus: (order, status) => backend.setOrderStatus(order, status),

    /* saved */
    get favs() { return (cache.user && cache.user.favs) || []; },
    isFav(id) { return S.favs.includes(id); },
    toggleFav(id) { const f = S.isFav(id) ? S.favs.filter((x) => x !== id) : S.favs.concat(id); return backend.setFavs(f); },

    /* reviews & reports */
    sellerReviews(sellerId) { return cache.reviews.filter((r) => r.sellerId === sellerId).sort((a, b) => b.createdAt - a.createdAt); },
    reviews(listingId) { return cache.reviews.filter((r) => r.listingId === listingId).sort((a, b) => b.createdAt - a.createdAt); },
    addReview(l, stars, text) {
      const u = cache.user;
      return backend.addReview({ listingId: l.id, sellerId: l.sellerId, byId: u.id, byName: u.name, stars, text, createdAt: Date.now() });
    },
    deleteReview: (id) => backend.deleteReview(id),
    report(l, reason) { return backend.report({ listingId: l.id, listingTitle: l.title, sellerId: l.sellerId, byId: cache.user.id, byName: cache.user.name, reason, status: "open", createdAt: Date.now() }); },

    /* chat */
    get threads() { return cache.threads.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    thread(id) { return cache.threads.find((t) => t.id === id); },
    messages(id) { return (cache.messages[id] || []).slice().sort((a, b) => a.createdAt - b.createdAt); },
    watchMessages: (id) => backend.watchMessages(id),
    openThread(l) {
      const me = cache.user.id;
      const t = cache.threads.find((x) => x.listingId === l.id && x.buyerId === me);
      if (t) return Promise.resolve(t.id);
      return backend.openThread({
        listingId: l.id, listingTitle: l.title, listingCat: l.cat, buyerId: me, buyerName: cache.user.name,
        sellerId: l.sellerId, sellerName: l.sellerName, members: [me, l.sellerId], lastText: "", updatedAt: Date.now(), unread: {}
      });
    },
    send(t, text) {
      const other = t.members.find((m) => m !== cache.user.id);
      return backend.sendMessage(t, { from: cache.user.id, text, createdAt: Date.now() }, other);
    },
    markRead(t) { if (t && t.unread && t.unread[cache.user.id]) backend.markRead(t, cache.user.id); },
    unreadCount() { const me = cache.user && cache.user.id; return cache.threads.reduce((n, t) => n + ((t.unread && t.unread[me]) || 0), 0); },

    /* account */
    signInDemo: (name, uni) => backend.signInDemo(name, uni),
    signInGoogle: () => backend.signInGoogle(),
    signInEmail: (e, p) => backend.signInEmail(e, p),
    signUpEmail: (e, p) => {
      const doms = cfg.allowedEmailDomains || [];
      if (doms.length && !doms.some((d) => e.toLowerCase().endsWith("@" + d) || e.toLowerCase().endsWith("." + d)))
        return Promise.reject(new Error("Please use your university email (" + doms.join(", ") + ")."));
      return backend.signUpEmail(e, p);
    },
    resetPassword: (e) => backend.resetPassword(e),
    resendVerify: () => backend.resendVerify(),
    reloadUser: () => backend.reloadUser(),
    saveProfile: (p) => backend.saveProfile(p),
    signOut: () => backend.signOut(),

    /* admin */
    adminLogin: (pw) => backend.adminLogin(pw),
    adminLogout: () => backend.adminLogout(),
    watchAdmin: () => backend.watchAdmin(),
    setUserBanned: (uid, b) => backend.setUserBanned(uid, b),
    setSettings: (p) => backend.setSettings(p),
    resolveReport: (id) => backend.resolveReport(id),
    loadSamples: () => backend.loadSamples(UM.sampleListings()),
    resetDemo: () => backend.resetDemo && backend.resetDemo()
  };
})();
