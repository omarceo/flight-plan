/* db.js: IndexedDB wrapper for study files (blobs stay on this device) */
const DB = (() => {
  'use strict';
  let conn = null;

  function open() {
    if (conn) return conn;
    conn = new Promise((resolve, reject) => {
      const req = indexedDB.open('flightplan', 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('subj', 'subj');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return conn;
  }

  async function run(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', mode);
      const request = fn(tx.objectStore('files'));
      tx.oncomplete = () => resolve(request && request.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    put: (file) => run('readwrite', (s) => s.put(file)),
    get: (id) => run('readonly', (s) => s.get(id)),
    del: (id) => run('readwrite', (s) => s.delete(id)),
    list: (subj) => run('readonly', (s) => s.index('subj').getAll(subj)),
  };
})();
