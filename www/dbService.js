// dbService.js - Engine Database Lokal Pengganti fs & database.json untuk Android Offline
const DBService = {
  DB_KEY: 'driver_management_master_db',

  // Inisialisasi struktur data awal (Persis seperti inisialisasi di server.js)
  initDB() {
    let existing = localStorage.getItem(this.DB_KEY);
    if (!existing) {
      const initialData = { 
        settings: { username: "Gaska", theme: "light", language: "id", currency: "IDR", notifications: { reminder: true, target: true, review: true } },
        target: 200000, 
        accounts: [
          { id: 'acc_cash', name: 'Dompet Tunai', balance: 0, icon: 'wallet', color: 'gray' },
          { id: 'acc_grab', name: 'Dompet Digital Grab', balance: 0, icon: 'mobile-screen', color: 'green' }
        ],
        categories: [
          { id: 'cat_1', name: 'Bensin', type: 'out', icon: 'gas-pump', color: 'red' },
          { id: 'cat_2', name: 'Makan', type: 'out', icon: 'utensils', color: 'orange' },
          { id: 'cat_3', name: 'Servis Motor', type: 'out', icon: 'screwdriver-wrench', color: 'red' },
          { id: 'cat_4', name: 'Parkir', type: 'out', icon: 'square-parking', color: 'red' },
          { id: 'cat_in_1', name: 'Trip', type: 'in', icon: 'motorcycle', color: 'green' },
          { id: 'cat_in_2', name: 'Bonus', type: 'in', icon: 'gift', color: 'pink' }
        ],
        transactions: [],
        goals: [],
        dailyArchives: []
      };
      localStorage.setItem(this.DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
    
    let db = JSON.parse(existing);
    
    // Patching Data Struktural Lama agar kompatibel (Persis seperti di server.js)
    let updated = false;
    if (db.target === undefined) { db.target = 200000; updated = true; }
    if (!db.goals) { db.goals = []; updated = true; }
    if (!db.categories) { db.categories = []; updated = true; }
    if (!db.dailyArchives) { db.dailyArchives = []; updated = true; }
    if (!db.settings) { db.settings = { username: "Gaska", theme: "light", language: "id", currency: "IDR" }; updated = true; }
    if (!db.settings.notifications) { db.settings.notifications = { reminder: true, target: true, review: true }; updated = true; }
    
    if (updated) {
      localStorage.setItem(this.DB_KEY, JSON.stringify(db));
    }
    
    return db;
  },

  // Pengganti readDB()
  readDB() {
    return this.initDB();
  },

  // Pengganti writeDB()
  writeDB(data) {
    localStorage.setItem(this.DB_KEY, JSON.stringify(data));
  },

  // Helper tanggal lokal (Persis seperti di server.js)
  getLocalToday() {
    const date = new Date();
    date.setHours(date.getHours() + 7);
    return date.toISOString().split('T')[0];
  }
};
