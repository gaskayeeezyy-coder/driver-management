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
