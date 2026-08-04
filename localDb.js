// localDb.js - Pengganti server.js untuk versi APK Offline
const LocalDB = {
  // 1. Membaca Data dari Memori HP
  readDB: function() {
    let data = localStorage.getItem('driver_db');
    if (!data) {
      // Data awal jika aplikasi baru pertama kali diinstal
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
      this.writeDB(initialData);
      return initialData;
    }
    return JSON.parse(data);
  },

  // 2. Menyimpan Data ke Memori HP
  writeDB: function(data) {
    localStorage.setItem('driver_db', JSON.stringify(data));
  },

  // 3. Fungsi Tambah Transaksi (Pengganti app.post('/api/transactions'))
  tambahTransaksi: function(txData) {
    const db = this.readDB();
    
    // Logika perhitungan saldo (sama persis dengan server.js)
    if (txData.type === 'in') {
      if (txData.paymentMethod === 'Tunai') {
        let accCash = db.accounts.find(a => a.id === 'acc_cash');
        let accGrab = db.accounts.find(a => a.id === 'acc_grab');
        if (accCash) accCash.balance += (txData.customerPaid || 0);
        if (accGrab) accGrab.balance += (txData.amount - (txData.customerPaid || 0));
      } else {
        let accGrab = db.accounts.find(a => a.id === (txData.accountId || 'acc_grab'));
        if (accGrab) accGrab.balance += txData.amount;
      }
    } else if (txData.type === 'out') {
      let acc = db.accounts.find(a => a.id === txData.accountId);
      if (acc) acc.balance -= txData.amount;
    }

    // Masukkan transaksi ke urutan paling atas
    db.transactions.unshift(txData);
    this.writeDB(db);
    return txData;
  },

  // 4. Fungsi Mengambil Semua Transaksi (Pengganti app.get('/api/transactions'))
  getTransaksi: function() {
    return this.readDB().transactions;
  }
};
