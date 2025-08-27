self.addEventListener('install', event => {
  console.log('✅ Service Worker installé');
});

self.addEventListener('fetch', function(event) {
  // Par défaut, laisse passer les requêtes (mais يمكن تعديل ذلك لاحقاً)
});
