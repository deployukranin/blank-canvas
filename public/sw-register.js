// Service worker registration (external so we can drop 'unsafe-inline' from script-src).
(function () {
  if (!('serviceWorker' in navigator)) return;

  var host = window.location.hostname;
  // Preview / dev environments must never use the SW: it caches assets and
  // prevents live updates (HMR) from showing up inside the Lovable editor.
  var isPreview =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'beta.lovable.dev' ||
    host.endsWith('.beta.lovable.dev') ||
    host === 'lovableproject.com' ||
    host.endsWith('.lovableproject.com') ||
    host === 'lovableproject-dev.com' ||
    host.endsWith('.lovableproject-dev.com') ||
    host.indexOf('preview--') === 0 ||
    host.indexOf('-preview--') !== -1 ||
    host.indexOf('id-preview--') === 0 ||
    window.self !== window.top ||
    new URLSearchParams(window.location.search).get('sw') === 'off';

  if (isPreview) {
    Promise.all([
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }).catch(function () { return []; }),
      window.caches && caches.keys
        ? caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          }).catch(function () { return []; })
        : Promise.resolve([]),
    ]).then(function () {
      // An unregistered worker can still control the current document until
      // navigation. Reload once so preview immediately returns to Vite/HMR.
      if (navigator.serviceWorker.controller && !sessionStorage.getItem('preview-sw-cleaned')) {
        sessionStorage.setItem('preview-sw-cleaned', '1');
        window.location.reload();
      } else {
        sessionStorage.removeItem('preview-sw-cleaned');
      }
    }).catch(function () {});
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
})();
