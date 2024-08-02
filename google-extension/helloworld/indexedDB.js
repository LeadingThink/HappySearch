// 这里假设 umd.js 是 idb 库的正确引用，你需要根据你的实际路径进行调整
importScripts('umd.js');

const dbPromise = idb.openDB('texts-db', 1, {
    upgrade(upgradeDB) {
        if (!upgradeDB.objectStoreNames.contains('texts')) {
            upgradeDB.createObjectStore('texts', { keyPath: 'id' });
        }
    }
});

function addText(id, text) {
    dbPromise.then(db => {
        const tx = db.transaction('texts', 'readwrite');
        tx.objectStore('texts').put({ id: id, text: text });
        return tx.complete;
    });
}

function getText(id) {
    return dbPromise.then(db => {
        return db.transaction('texts').objectStore('texts').get(id);
    });
}
