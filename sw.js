const allCache = ['mainPages-StaticV1', 'mainPages-ImgV1'];
const [staticName, imgName] = allCache;

self.addEventListener('install', event => {
  const urlsToCache = [
    '/',
    '/css/bootstrap.min.css',
    '/css/style.min.css',
    '/js/bootstrap.bundle.min.js',
    '/js/grayscale.js',
    '/js/jquery.easing.min.js',
    '/js/jquery.min.js',
    '/js/padang.js'
  ];

  // waitUntil menyuruh SW untuk tunggu hingga proses selesai
  event.waitUntil(
    caches.open(staticName).then(cache => cache.addAll(urlsToCache))
  );
});

// menghapus cache yang lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(
              cacheName =>
                cacheName.startsWith('mainPages-') &&
                !allCache.includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
});

// menympan img ke cache
const servePhoto = request => {
  const storageUrl = request.url.replace(/\.(jpg|webp|png)$/, '');
  return caches.open(imgName).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;
      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
};

// membaca setiap fetch yang terjadi
self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  // berjalan ketika url di awali dengan /img/
  if (reqUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  // berjalan ke req selain diawali oleh /img/
  event.respondWith(
    caches
      .match(event.request, { ignoreSearch: true })
      .then(response => {
        if (response) return response;

        // berjalan ketika data yang dicari tidak ada di cache
        return fetch(event.request).catch(() => {
          return new Response(
            `
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="ie=edge">
                <link rel="shortcut icon" type="image/x-icon" href="icon/favicon.ico">
                <title>Offline</title>
              </head>
              <body style="color: #555555; margin: 40px; background-color: #bdbdbd">
                <h1 id="head" style="text-align: center; font-size: 5em; color: #757575;">
                  OFFLINE
                </h1>
                <h2 id="text" style="text-align: center; color: #777777;">
                  You are offline, please check your connection
                </h2>
              </body>
          `,
            {
              headers: {
                'Content-Type': 'text/html'
              }
            }
          );
        });
      })
      .catch(() => {
        console.log('FAILED ON CACHES');
      })
  );
});
