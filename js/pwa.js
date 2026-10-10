/* pwa.js: register the offline cache when the page is served over http(s) */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* optional feature */ });
}
