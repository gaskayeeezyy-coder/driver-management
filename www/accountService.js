// accountService.js - Modul Rekening & Aset (Logika 100% Identik dengan server.js)
const AccountService = {

  // GET All Accounts (Pengganti app.get('/api/accounts'))
  getAccounts() {
    const db = DBService.readDB();
    return db.accounts;
  },

  // GET Account By ID & Mutasi (Pengganti app.get('/api/accounts/:id'))
  getAccountById(id) {
    const db = DBService.readDB();
    const acc = db.accounts.find(a => a.id === id);
    if (!acc) return { error: 'Rekening tidak ditemukan' };

    const mutasi = db.transactions.filter(t => 
      t.accountId === id || 
      t.fromAccountId === id || 
      t.toAccountId === id || 
      (t.tipAmount > 0 && (
        (t.tipPaymentMethod === 'Tunai' && id === 'acc_cash') || 
        (t.tipPaymentMethod === 'Non-Tunai' && id === 'acc_grab')
      ))
    );
    return { account: acc, mutasi };
  },

  // POST Create Account (Pengganti app.post('/api/accounts'))
  createAccount(body) {
    const db = DBService.readDB();
    const { name, balance } = body;
    const newAccount = { 
      id: 'acc_' + Date.now(), 
      name, 
      icon: 'wallet', 
      color: 'green', 
      balance: parseFloat(balance) || 0 
    };
    db.accounts.push(newAccount);
    DBService.writeDB(db);
    return { message: 'Rekening dibuat', account: newAccount };
  },

  // PUT Update / Adjust Account (Pengganti app.put('/api/accounts/:id'))
  updateAccount(id, body) {
    const db = DBService.readDB();
    let acc = db.accounts.find(a => a.id === id);
    if (acc) {
      if (body.name) acc.name = body.name;
      if (body.balance !== undefined) {
        const difference = parseFloat(body.balance) - acc.balance;
        if (difference !== 0) {
          let adjTx = { 
            id: Date.now(), 
            type: 'adjustment', 
            category: 'Penyesuaian Saldo', 
            amount: difference, 
            note: 'Manual Sistem', 
            accountId: acc.id, 
            date: DBService.getLocalToday(), 
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
          };
          // Menggunakan logika applyTransactionBalance dari TransactionService
          TransactionService.applyTransactionBalance(adjTx, db);
          db.transactions.unshift(adjTx);
        }
      }
      DBService.writeDB(db);
      return { message: 'Rekening diperbarui' };
    } else {
      return { error: 'Rekening tidak ditemukan' };
    }
  }
};
