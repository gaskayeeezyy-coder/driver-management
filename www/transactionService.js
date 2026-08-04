// transactionService.js - Modul Transaksi (Logika 100% Identik dengan server.js)
const TransactionService = {
  reverseTransactionBalance(tx, db) { /* logika asli tidak diubah */ },
  applyTransactionBalance(tx, db) { /* logika asli tidak diubah */ },

  getTransactions(query = {}) {
    console.log("[TransactionService] getTransactions() terpanggil dengan query:", query);
    const db = DBService.readDB();
    // (potong kode filter demi contoh, pastikan Anda menimpa dengan fungsi getTransactions asli + log ini)
    return db.transactions || [];
  },

  createTransaction(body) {
    console.log("[TransactionService] createTransaction() terpanggil. Data body:", body);
    const db = DBService.readDB();
    const { type, category, amount, paymentMethod, customerPaid, accountId, fromAccountId, toAccountId, note, tipAmount, tipPaymentMethod, date, timestamp } = body;
    
    let newTx = { 
      id: Date.now(), type, category, 
      amount: parseFloat(amount) || 0, note: note || '', 
      date: date || DBService.getLocalToday(), 
      timestamp: timestamp || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: paymentMethod || 'Non-Tunai', customerPaid: parseFloat(customerPaid) || 0,
      tipAmount: parseFloat(tipAmount) || 0, tipPaymentMethod: tipPaymentMethod || 'Non-Tunai',
      accountId, fromAccountId, toAccountId
    };

    if (type === 'transfer') {
      let accFrom = db.accounts.find(a => a.id === fromAccountId);
      let accTo = db.accounts.find(a => a.id === toAccountId);
      newTx.category = `Transfer: ${accFrom ? accFrom.name : '-'} ➜ ${accTo ? accTo.name : '-'}`;
    }

    this.applyTransactionBalance(newTx, db);
    db.transactions.unshift(newTx);
    
    console.log("[TransactionService] Mempersiapkan writeDB...");
    DBService.writeDB(db);
    console.log("[TransactionService] createTransaction() selesai. Mengembalikan response.");
    return { message: 'Transaksi tersimpan', transaction: newTx };
  },

  // updateTransaction() dan deleteTransaction() dibiarkan sama seperti aslinya
};


  // Core Business Logic: Apply Saldo (Persis seperti di server.js)
  applyTransactionBalance(tx, db) {
    if (tx.type === 'in') {
      if (tx.paymentMethod === 'Tunai') {
        let accCash = db.accounts.find(a => a.id === 'acc_cash');
        let accGrab = db.accounts.find(a => a.id === 'acc_grab');
        if (accCash) accCash.balance += (tx.customerPaid || 0);
        if (accGrab) accGrab.balance += (tx.amount - (tx.customerPaid || 0));
      } else {
        let accGrab = db.accounts.find(a => a.id === (tx.accountId || 'acc_grab'));
        if (accGrab) accGrab.balance += tx.amount;
      }

      if (tx.tipAmount > 0) {
        if (tx.tipPaymentMethod === 'Tunai') {
          let accCash = db.accounts.find(a => a.id === 'acc_cash');
          if (accCash) accCash.balance += tx.tipAmount;
        } else {
          let accGrab = db.accounts.find(a => a.id === 'acc_grab');
          if (accGrab) accGrab.balance += tx.tipAmount;
        }
      }
    } else if (tx.type === 'out') {
      let acc = db.accounts.find(a => a.id === tx.accountId);
      if (acc) acc.balance -= tx.amount;
    } else if (tx.type === 'transfer') {
      let accFrom = db.accounts.find(a => a.id === tx.fromAccountId);
      let accTo = db.accounts.find(a => a.id === toAccountId);
      if (accFrom) accFrom.balance -= tx.amount;
      if (accTo) accTo.balance += tx.amount;
    } else if (tx.type === 'adjustment') {
      let acc = db.accounts.find(a => a.id === tx.accountId);
      if (acc) acc.balance += tx.amount;
    }
  },

  // GET Transactions (Pengganti app.get('/api/transactions'))
  getTransactions(query = {}) {
    const db = DBService.readDB();
    const { search, filter, category, accountId } = query;
    let txs = db.transactions || [];
    
    const todayStr = DBService.getLocalToday();
    const d = new Date(); d.setHours(d.getHours() + 7); d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    if (filter === 'today') txs = txs.filter(t => t.date === todayStr);
    else if (filter === 'yesterday') txs = txs.filter(t => t.date === yesterdayStr);
    
    if (category) txs = txs.filter(t => t.category === category);
    if (accountId) txs = txs.filter(t => t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId);
    
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(t => t.category.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q)));
    }
    return txs;
  },

  // GET Transaction By ID (Pengganti app.get('/api/transactions/:id'))
  getTransactionById(id) {
    const db = DBService.readDB();
    const tx = db.transactions.find(t => t.id == id);
    return tx || { error: 'Transaksi tidak ditemukan' };
  },

  // POST Transaction (Pengganti app.post('/api/transactions'))
  createTransaction(body) {
    const db = DBService.readDB();
    const { type, category, amount, paymentMethod, customerPaid, accountId, fromAccountId, toAccountId, note, tipAmount, tipPaymentMethod, date, timestamp } = body;
    
    let newTx = { 
      id: Date.now(), type, category, 
      amount: parseFloat(amount) || 0, 
      note: note || '', 
      date: date || DBService.getLocalToday(), 
      timestamp: timestamp || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: paymentMethod || 'Non-Tunai', 
      customerPaid: parseFloat(customerPaid) || 0,
      tipAmount: parseFloat(tipAmount) || 0,
      tipPaymentMethod: tipPaymentMethod || 'Non-Tunai',
      accountId, fromAccountId, toAccountId
    };

    if (type === 'transfer') {
      let accFrom = db.accounts.find(a => a.id === fromAccountId);
      let accTo = db.accounts.find(a => a.id === toAccountId);
      newTx.category = `Transfer: ${accFrom ? accFrom.name : '-'} ➜ ${accTo ? accTo.name : '-'}`;
    }

    this.applyTransactionBalance(newTx, db);
    db.transactions.unshift(newTx);
    DBService.writeDB(db);
    return { message: 'Transaksi tersimpan', transaction: newTx };
  },

  // PUT Transaction (Pengganti app.put('/api/transactions/:id'))
  updateTransaction(id, body) {
    const db = DBService.readDB();
    const txIndex = db.transactions.findIndex(t => t.id == id);
    
    if (txIndex > -1) {
      let oldTx = db.transactions[txIndex];
      this.reverseTransactionBalance(oldTx, db);
      
      let updatedTx = { ...oldTx, ...body };
      updatedTx.amount = parseFloat(body.amount) || 0;
      updatedTx.tipAmount = parseFloat(body.tipAmount) || 0;
      
      if (updatedTx.type === 'in' && updatedTx.paymentMethod === 'Tunai') {
        updatedTx.customerPaid = parseFloat(body.customerPaid) || 0;
      }
      
      this.applyTransactionBalance(updatedTx, db);
      db.transactions[txIndex] = updatedTx;
      DBService.writeDB(db);
      return { message: 'Transaksi berhasil diubah secara menyeluruh' };
    } else {
      return { error: 'Transaksi tidak ditemukan' };
    }
  },

  // DELETE Transaction (Pengganti app.delete('/api/transactions/:id'))
  deleteTransaction(id) {
    const db = DBService.readDB();
    const txIndex = db.transactions.findIndex(t => t.id == id);
    if (txIndex > -1) {
      this.reverseTransactionBalance(db.transactions[txIndex], db);
      db.transactions.splice(txIndex, 1);
      DBService.writeDB(db);
      return { message: 'Transaksi dan Tip berhasil dihapus, saldo dikembalikan' };
    } else {
      return { error: 'Transaksi tidak ditemukan' };
    }
  }
};