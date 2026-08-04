const DBService = {
  DB_KEY: 'driver_management_master_db',

  initDB() {
    let existing = localStorage.getItem(this.DB_KEY);
    if (!existing) {
      console.log("[Database] Inisialisasi DB baru karena kosong");
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
        transactions: [], goals: [], dailyArchives: []
      };
      localStorage.setItem(this.DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
    
    let db = JSON.parse(existing);
    let updated = false;
    if (db.target === undefined) { db.target = 200000; updated = true; }
    if (!db.goals) { db.goals = []; updated = true; }
    if (!db.categories) { db.categories = []; updated = true; }
    if (!db.dailyArchives) { db.dailyArchives = []; updated = true; }
    if (!db.settings) { db.settings = { username: "Gaska", theme: "light", language: "id", currency: "IDR" }; updated = true; }
    if (!db.settings.notifications) { db.settings.notifications = { reminder: true, target: true, review: true }; updated = true; }
    
    if (updated) localStorage.setItem(this.DB_KEY, JSON.stringify(db));
    return db;
  },

  readDB() {
    console.log("[Database] readDB() terpanggil");
    return this.initDB();
  },

  writeDB(data) {
    console.log("[Database] writeDB() terpanggil");
    localStorage.setItem(this.DB_KEY, JSON.stringify(data));
    console.log("[Database] write success -> Data tersimpan di localStorage");
  },

  getLocalToday() {
    const date = new Date();
    date.setHours(date.getHours() + 7);
    return date.toISOString().split('T')[0];
  }
};
