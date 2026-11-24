/* UniMart – small helpers shared by the shop and the admin page */
window.UM = window.UM || {};
(function () {
  const cfg = window.UM_CONFIG || {};
  const U = UM.ui = {};
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  U.money = (n) => (cfg.currency || "Rs") + " " + Number(n || 0).toLocaleString("en-LK");
  U.cat = (id) => UM.categories.find((c) => c.id === id) || UM.categories[UM.categories.length - 1];
  U.isService = (l) => !!l.service || U.cat(l.cat).kind === "service";
  U.icon = (path, size = 24) => `<svg class="ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${path}"/></svg>`;
  U.stars = (r) => { const n = Math.round(r || 0); return `<span class="stars" aria-label="${r} out of 5">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`; };
  U.ago = (t) => {
    if (!t) return "";
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return "just now"; if (m < 60) return m + " min ago";
    const h = Math.round(m / 60); if (h < 24) return h + " h ago";
    const d = Math.round(h / 24); if (d < 7) return d + " d ago";
    return new Date(t).toLocaleDateString();
  };
  U.toast = (msg, bad) => {
    const t = U.$("#toast"); if (!t) return alert(msg);
    t.textContent = msg; t.classList.toggle("bad", !!bad); t.classList.add("show");
    clearTimeout(U.toast.t); U.toast.t = setTimeout(() => t.classList.remove("show"), bad ? 4000 : 2400);
  };
  /* run an async action from a button: disables it and shows errors */
  U.act = async (btn, fn, okMsg) => {
    if (btn) btn.disabled = true;
    try { const r = await fn(); if (okMsg) U.toast(okMsg); return r; }
    catch (e) { console.error(e); U.toast(e.message || "Something went wrong", true); throw e; }
    finally { if (btn) btn.disabled = false; }
  };
  U.thumb = (l, cls = "") => {
    if (l.img) return `<div class="thumb ${cls}"><img src="${U.esc(l.img)}" alt="" loading="lazy"></div>`;
    const c = U.cat(l.cat);
    return `<div class="thumb ${cls}" style="--h:${c.hue}">${U.icon(c.icon, cls === "sm" ? 26 : 56)}${cls === "sm" ? "" : `<span>${U.esc(c.name)}</span>`}</div>`;
  };
  U.statusLabel = {
    placed: "Waiting for seller", confirmed: "Confirmed", ready: "Ready to meet", completed: "Completed", cancelled: "Cancelled",
    active: "Live", pending: "Waiting for approval", paused: "Paused", sold: "Sold", hidden: "Hidden by admin"
  };
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
})();
