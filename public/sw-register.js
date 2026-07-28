// Service worker registration (external so we can drop 'unsafe-inline' from script-src).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
