/* UniMart – DEMO backend. Same collections as Firestore, kept in localStorage.
   Used automatically when js/config.js has no Firebase keys. */
window.UM = window.UM || {};
UM.localBackend = function (cfg, emit) {
  const KEY = "unimart-demo-db";
  const ADMIN = "unimart-demo-admin";
  const fresh = () => ({
    me: null,
    users: {}, listings: UM.sampleListings().reduce((o, l) => (o[l.id] = l, o), {}),
    orders: {}, reviews: {}, reports: {}, threads: {}, messages: {},
    settings: { requireApproval: false, announcement: "Welcome to UniMart! This is demo mode: data stays in this browser." }
  });
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { db = fresh(); }
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const arr = (o) => Object.keys(o).map((id) => Object.assign({ id }, o[id]));
  let adminOn = false;
  try { adminOn = sessionStorage.getItem(ADMIN) === "1"; } catch (e) {}

  function publish() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn("Storage full", e); }
    const me = db.me && db.users[db.me] ? Object.assign({ id: db.me, verified: true }, db.users[db.me]) : null;
    const mine = (o) => me && (o.buyerId === me.id);
    const msgs = {};
    Object.keys(db.messages).forEach((t) => (msgs[t] = arr(db.messages[t])));
    emit({
      authReady: true, user: me, isAdmin: adminOn,
      listings: arr(db.listings), reviews: arr(db.reviews),
      orders: arr(db.orders).filter(mine),
      sales: me ? arr(db.orders).filter((o) => o.sellerId === me.id) : [],
      threads: me ? arr(db.threads).filter((t) => t.members.includes(me.id)) : [],
      messages: msgs, settings: db.settings,
      admin: adminOn ? { users: arr(db.users), orders: arr(db.orders), reports: arr(db.reports) } : { users: [], orders: [], reports: [] }
    });
  }
  setTimeout(publish, 0);
  window.addEventListener("storage", (e) => { if (e.key === KEY) { try { db = JSON.parse(e.newValue) || fresh(); } catch (x) {} publish(); } });

  const done = (v) => { publish(); return Promise.resolve(v); };
  const fail = (m) => Promise.reject(new Error(m));

  /* demo: sample sellers answer chats automatically */
  function autoReply(t) {
    if (!t.sellerId.startsWith("sample-")) return;
    const replies = ["Yes, it's still available!", "Sure, I'm free after 3 pm near the library.", "I can give a small discount if you pick it up today.", "Thanks! Place the order and I'll confirm it."];
    setTimeout(() => {
      const m = { from: t.sellerId, text: replies[Math.floor(Math.random() * replies.length)], createdAt: Date.now() };
      (db.messages[t.id] = db.messages[t.id] || {})[uid("m")] = m;
      const th = db.threads[t.id]; th.lastText = m.text; th.updatedAt = m.createdAt;
      th.unread = th.unread || {}; th.unread[t.buyerId] = (th.unread[t.buyerId] || 0) + 1;
      publish();
    }, 1500);
  }

  return {
    signInDemo(name, uni) {
      const id = "demo-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      db.users[id] = Object.assign({ favs: [], createdAt: Date.now(), banned: false }, db.users[id], { name, uni });
      if (db.users[id].banned) return fail("This account has been suspended by an admin.");
      db.me = id; return done();
    },
    signInGoogle: () => fail("Google sign-in needs Firebase. Add your keys in js/config.js."),
    signInEmail: () => fail("Email sign-in needs Firebase. Add your keys in js/config.js."),
    signUpEmail: () => fail("Email sign-up needs Firebase. Add your keys in js/config.js."),
    resetPassword: () => fail("Needs Firebase."),
    resendVerify: () => done(), reloadUser: () => done(),
    saveProfile(p) { Object.assign(db.users[db.me], p); return done(); },
    signOut() { db.me = null; return done(); },

    addListing(l) { const id = uid("l"); db.listings[id] = l; return done(id); },
    updateListing(id, p) { Object.assign(db.listings[id], p); return done(); },
    deleteListing(id) { delete db.listings[id]; return done(); },

    placeOrders(list) { const ids = list.map((o) => { const id = "UM" + Math.floor(100000 + Math.random() * 900000); db.orders[id] = o; return id; }); return done(ids); },
    setOrderStatus(o, status) {
      db.orders[o.id].status = status; db.orders[o.id].updatedAt = Date.now();
      if (status === "completed") o.lines.forEach((x) => { if (db.listings[x.id]) db.listings[x.id].sold = (db.listings[x.id].sold || 0) + x.qty; });
      return done();
    },
    setFavs(f) { db.users[db.me].favs = f; return done(f.length); },
    addReview(r) { db.reviews[uid("r")] = r; return done(); },
    deleteReview(id) { delete db.reviews[id]; return done(); },
    report(r) { db.reports[uid("p")] = r; return done(); },

    openThread(t) { const id = uid("t"); db.threads[id] = t; db.messages[id] = {}; return done(id); },
    watchMessages() { return () => {}; },
    sendMessage(t, m, other) {
      (db.messages[t.id] = db.messages[t.id] || {})[uid("m")] = m;
      const th = db.threads[t.id]; th.lastText = m.text; th.updatedAt = m.createdAt;
      th.unread = th.unread || {}; th.unread[other] = (th.unread[other] || 0) + 1;
      autoReply(Object.assign({ id: t.id }, th));
      return done();
    },
    markRead(t, me) { db.threads[t.id].unread[me] = 0; return done(); },

    adminLogin(pw) {
      if (pw !== (cfg.demoAdminPassword || "demo")) return fail("Wrong password.");
      adminOn = true; try { sessionStorage.setItem(ADMIN, "1"); } catch (e) {} return done();
    },
    adminLogout() { adminOn = false; try { sessionStorage.removeItem(ADMIN); } catch (e) {} return done(); },
    watchAdmin() { return () => {}; },
    setUserBanned(id, b) { db.users[id].banned = b; if (b) Object.values(db.listings).forEach((l) => { if (l.sellerId === id) l.status = "hidden"; }); return done(); },
    setSettings(p) { Object.assign(db.settings, p); return done(); },
    resolveReport(id) { db.reports[id].status = "resolved"; return done(); },
    loadSamples(list) { list.forEach((l) => (db.listings[l.id] = l)); return done(); },
    resetDemo() { db = fresh(); adminOn = false; try { sessionStorage.removeItem(ADMIN); } catch (e) {} return done(); }
  };
};
