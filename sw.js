// Service worker Dompetku — cache tampilan aplikasi agar bisa dibuka offline.
// Data keuangan TIDAK lewat sini: permintaan ke Google (Apps Script) selalu langsung ke jaringan.
const V = 'dompetku-v1'; // naikkan angka ini (v2, v3, ...) bila index.html diganti agar cache ikut diperbarui
const SHELL = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; // Google Apps Script dll: langsung ke jaringan
  const key = r.mode === 'navigate' ? 'index.html' : r;
  e.respondWith(
    caches.open(V).then(async c => {
      const hit = await c.match(key, { ignoreSearch: true });
      const net = fetch(r).then(res => { if (res && res.ok) c.put(key, res.clone()); return res; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }       // tampil cepat dari cache, perbarui di belakang layar
      return (await net) || new Response('Offline', { status: 503 });
    })
  );
});
