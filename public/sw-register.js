// Service worker registration (external so we can drop 'unsafe-inline' from script-src).
(function () {
  if (!('serviceWorker' in navigator)) return;

  var host = window.location.hostname;
  // Preview / dev environments must never use the SW: it caches assets and
  // prevents live updates (HMR) from showing up inside the Lovable editor.
  var isPreview =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.lovableproject.com') ||
    host.indexOf('-preview--') !== -1 ||
    host.indexOf('id-preview') === 0;

  if (isPreview) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    }).catch(function () {});
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) { caches.delete(k); });
      }).catch(function () {});
    }
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
})();
