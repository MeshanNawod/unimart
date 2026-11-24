/* UniMart – runs first: theme before paint, and refuse to run inside another site's frame (clickjacking). */
(function () {
  try { var t = localStorage.getItem("unimart-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  if (window.top !== window.self) {
    try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.style.display = "none"; }
  }
})();
