/* UniMart – LIVE backend: Firebase Authentication + Cloud Firestore (free Spark plan is enough).
   Collections are described in SCHEMA.md and protected by firestore.rules. */
window.UM = window.UM || {};
UM.firebaseBackend = function (cfg, emit) {
  const V = "10.12.2";
  const load = (src) => new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => bad(new Error("Could not load " + src)); document.head.appendChild(s); });
  const sdk = load(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`)
    .then(() => Promise.all([load(`https://www.gstatic.com/firebasejs/${V}/firebase-auth-compat.js`), load(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore-compat.js`)]))
    .then(() => { firebase.initializeApp(cfg.firebase); return { auth: firebase.auth(), fs: firebase.firestore() }; });

  const friendly = (e) => {
    const map = {
      "auth/invalid-credential": "Wrong email or password.", "auth/wrong-password": "Wrong email or password.",
      "auth/user-not-found": "No account with that email.", "auth/email-already-in-use": "That email already has an account. Sign in instead.",
      "auth/weak-password": "Use at least 6 characters for the password.", "auth/invalid-email": "That email address is not valid.",
      "auth/popup-closed-by-user": "The Google window was closed.", "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
      "permission-denied": "You don't have permission to do that (are you signed in and verified?)."
    };
    return new Error(map[e.code] || e.message || String(e));
  };
  const wrap = (fn) => (...a) => sdk.then((f) => fn(f, ...a)).catch((e) => { throw friendly(e); });
  const docs = (snap) => snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));

  /* ---------- live subscriptions ---------- */
  let userUnsubs = [], adminUnsubs = [], msgUnsubs = {};
  const msgs = {};
  const parts = { active: [], mine: [], all: null };
  const pushListings = () => {
    if (parts.all) return emit({ listings: parts.all });
    const m = new Map(); parts.active.concat(parts.mine).forEach((l) => m.set(l.id, l));
    emit({ listings: Array.from(m.values()) });
  };
  const stopAll = (list) => { list.forEach((u) => u()); list.length = 0; };

  sdk.then(({ auth, fs }) => {
    fs.collection("listings").where("status", "==", "active").onSnapshot((s) => { parts.active = docs(s); pushListings(); }, console.error);
    fs.collection("reviews").onSnapshot((s) => emit({ reviews: docs(s) }), console.error);
    fs.doc("settings/site").onSnapshot((d) => emit({ settings: Object.assign({ requireApproval: false, announcement: "" }, d.data() || {}) }), console.error);

    auth.onAuthStateChanged(async (u) => {
      stopAll(userUnsubs); stopAll(adminUnsubs); parts.mine = []; parts.all = null;
      if (!u) { emit({ authReady: true, user: null, isAdmin: false, orders: [], sales: [], threads: [], admin: { users: [], orders: [], reports: [] } }); pushListings(); return; }
      const verified = u.emailVerified || u.providerData.some((p) => p.providerId === "google.com");
      let isAdmin = false;
      try { isAdmin = (await fs.doc("admins/" + u.uid).get()).exists; } catch (e) { isAdmin = false; }
      userUnsubs.push(fs.doc("users/" + u.uid).onSnapshot((d) => {
        const base = { id: u.uid, email: u.email, verified, photo: u.photoURL || "" };
        emit({ authReady: true, isAdmin, user: d.exists ? Object.assign(base, d.data()) : Object.assign(base, { needsProfile: true, name: u.displayName || "", uni: "", favs: [] }) });
      }, console.error));
      userUnsubs.push(fs.collection("listings").where("sellerId", "==", u.uid).onSnapshot((s) => { parts.mine = docs(s); pushListings(); }, console.error));
      userUnsubs.push(fs.collection("orders").where("buyerId", "==", u.uid).onSnapshot((s) => emit({ orders: docs(s) }), console.error));
      userUnsubs.push(fs.collection("orders").where("sellerId", "==", u.uid).onSnapshot((s) => emit({ sales: docs(s) }), console.error));
      userUnsubs.push(fs.collection("threads").where("members", "array-contains", u.uid).onSnapshot((s) => emit({ threads: docs(s) }), console.error));
    });
  });

  const admin = { users: [], orders: [], reports: [] };

  return {
    signInDemo: () => Promise.reject(new Error("Demo sign-in is off: this site uses real accounts.")),
    signInGoogle: wrap(({ auth }) => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())),
    signInEmail: wrap(({ auth }, e, p) => auth.signInWithEmailAndPassword(e, p)),
    signUpEmail: wrap(async ({ auth }, e, p) => { const c = await auth.createUserWithEmailAndPassword(e, p); await c.user.sendEmailVerification(); }),
    resetPassword: wrap(({ auth }, e) => auth.sendPasswordResetEmail(e)),
    resendVerify: wrap(({ auth }) => auth.currentUser && auth.currentUser.sendEmailVerification()),
    reloadUser: wrap(async ({ auth }) => { if (!auth.currentUser) return; await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); location.reload(); }),
    saveProfile: wrap(({ auth, fs }, p) => {
      const ref = fs.doc("users/" + auth.currentUser.uid);
      return ref.get().then((d) => d.exists ? ref.update({ name: p.name, uni: p.uni }) : ref.set({ name: p.name, uni: p.uni, favs: [], createdAt: Date.now() }));
    }),
    signOut: wrap(({ auth }) => auth.signOut()),

    addListing: wrap(({ fs }, l) => { Object.keys(l).forEach((k) => l[k] === undefined && delete l[k]); return fs.collection("listings").add(l).then((r) => r.id); }),
    updateListing: wrap(({ fs }, id, p) => { Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]); return fs.doc("listings/" + id).update(p); }),
    deleteListing: wrap(({ fs }, id) => fs.doc("listings/" + id).delete()),

    placeOrders: wrap(async ({ fs }, list) => {
      const b = fs.batch(), ids = [];
      list.forEach((o) => { const r = fs.collection("orders").doc(); ids.push(r.id); b.set(r, o); });
      await b.commit(); return ids;
    }),
    setOrderStatus: wrap(async ({ fs }, o, status) => {
      const b = fs.batch();
      b.update(fs.doc("orders/" + o.id), { status, updatedAt: Date.now() });
      if (status === "completed") o.lines.forEach((x) => b.update(fs.doc("listings/" + x.id), { sold: firebase.firestore.FieldValue.increment(x.qty) }));
      return b.commit();
    }),
    setFavs: wrap(({ auth, fs }, f) => fs.doc("users/" + auth.currentUser.uid).update({ favs: f })),
    addReview: wrap(({ fs }, r) => fs.collection("reviews").add(r)),
    deleteReview: wrap(({ fs }, id) => fs.doc("reviews/" + id).delete()),
    report: wrap(({ fs }, r) => fs.collection("reports").add(r)),

    openThread: wrap(({ fs }, t) => fs.collection("threads").add(t).then((r) => r.id)),
    watchMessages(id) {
      if (msgUnsubs[id]) return msgUnsubs[id];
      let un = () => {};
      sdk.then(({ fs }) => {
        un = fs.collection("threads/" + id + "/messages").onSnapshot((s) => {
          msgs[id] = docs(s);
          emit({ messages: Object.assign({}, msgs) });
        }, console.error);
      });
      return (msgUnsubs[id] = () => { un(); delete msgUnsubs[id]; });
    },
    sendMessage: wrap(({ fs }, t, m, other) => {
      const b = fs.batch();
      b.set(fs.collection("threads/" + t.id + "/messages").doc(), m);
      b.update(fs.doc("threads/" + t.id), { lastText: m.text.slice(0, 120), updatedAt: m.createdAt, ["unread." + other]: firebase.firestore.FieldValue.increment(1) });
      return b.commit();
    }),
    markRead: wrap(({ fs }, t, me) => fs.doc("threads/" + t.id).update({ ["unread." + me]: 0 })),

    /* ---------- admin (rules allow these only for users listed in /admins) ---------- */
    adminLogin: () => Promise.reject(new Error("Sign in with your admin Google or email account.")),
    adminLogout: wrap(({ auth }) => auth.signOut()),
    watchAdmin() {
      sdk.then(({ fs }) => {
        if (adminUnsubs.length) return;
        adminUnsubs.push(fs.collection("listings").onSnapshot((s) => { parts.all = docs(s); pushListings(); }, console.error));
        adminUnsubs.push(fs.collection("users").onSnapshot((s) => { admin.users = docs(s); emit({ admin: Object.assign({}, admin) }); }, console.error));
        adminUnsubs.push(fs.collection("orders").onSnapshot((s) => { admin.orders = docs(s); emit({ admin: Object.assign({}, admin) }); }, console.error));
        adminUnsubs.push(fs.collection("reports").onSnapshot((s) => { admin.reports = docs(s); emit({ admin: Object.assign({}, admin) }); }, console.error));
      });
      return () => stopAll(adminUnsubs);
    },
    setUserBanned: wrap(async ({ fs }, id, banned) => {
      const b = fs.batch();
      b.update(fs.doc("users/" + id), { banned });
      if (banned) (await fs.collection("listings").where("sellerId", "==", id).get()).docs.forEach((d) => b.update(d.ref, { status: "hidden" }));
      return b.commit();
    }),
    setSettings: wrap(({ fs }, p) => fs.doc("settings/site").set(p, { merge: true })),
    resolveReport: wrap(({ fs }, id) => fs.doc("reports/" + id).update({ status: "resolved" })),
    loadSamples: wrap(({ fs }, list) => {
      const b = fs.batch();
      list.forEach((l) => { const d = Object.assign({}, l); delete d.id; Object.keys(d).forEach((k) => d[k] === undefined && delete d[k]); b.set(fs.doc("listings/sample-" + l.id), d); });
      return b.commit();
    })
  };
};
