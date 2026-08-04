/**
 * TAHAP 1 (VERSI 1.0): SERVER.JS - FINAL POLISH (UX, AI ANALYTICS, DRIVER DASHBOARD)
 */
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static(__dirname));
const port = 5001;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const dbFile = path.join(__dirname, 'database.json');

// ==========================================
// 1. DATABASE INITIALIZATION & HELPER
// ==========================================
function readDB() {
  if (!fs.existsSync(dbFile)) {
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
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  
  let db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  
  // Patching Data Struktural Lama agar kompatibel dengan fitur baru
  if (db.target === undefined) db.target = 200000;
  if (!db.goals) db.goals = [];
  if (!db.categories) db.categories = [];
  if (!db.dailyArchives) db.dailyArchives = [];
  if (!db.settings) db.settings = { username: "Gaska", theme: "light", language: "id", currency: "IDR" };
  if (!db.settings.notifications) db.settings.notifications = { reminder: true, target: true, review: true };
  
  return db;
}

function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

function getLocalToday() {
  const date = new Date();
  date.setHours(date.getHours() + 7);
  return date.toISOString().split('T')[0];
}

// ==========================================
// 2. CORE BUSINESS LOGIC (TRANSACTION & TIPS REVERSAL)
// ==========================================
function reverseTransactionBalance(tx, db) {
  if (tx.type === 'in') {
    if (tx.paymentMethod === 'Tunai') {
      let accCash = db.accounts.find(a => a.id === 'acc_cash');
      let accGrab = db.accounts.find(a => a.id === 'acc_grab');
      if (accCash) accCash.balance -= (tx.customerPaid || 0);
      if (accGrab) accGrab.balance -= (tx.amount - (tx.customerPaid || 0));
    } else {
      let accGrab = db.accounts.find(a => a.id === (tx.accountId || 'acc_grab'));
      if (accGrab) accGrab.balance -= tx.amount;
    }
    
    if (tx.tipAmount > 0) {
      if (tx.tipPaymentMethod === 'Tunai') {
        let accCash = db.accounts.find(a => a.id === 'acc_cash');
        if (accCash) accCash.balance -= tx.tipAmount;
      } else {
        let accGrab = db.accounts.find(a => a.id === 'acc_grab');
        if (accGrab) accGrab.balance -= tx.tipAmount;
      }
    }
  } else if (tx.type === 'out') {
    let acc = db.accounts.find(a => a.id === tx.accountId);
    if (acc) acc.balance += tx.amount;
  } else if (tx.type === 'transfer') {
    let accFrom = db.accounts.find(a => a.id === tx.fromAccountId);
    let accTo = db.accounts.find(a => a.id === tx.toAccountId);
    if (accFrom) accFrom.balance += tx.amount;
    if (accTo) accTo.balance -= tx.amount;
  } else if (tx.type === 'adjustment') {
    let acc = db.accounts.find(a => a.id === tx.accountId);
    if (acc) acc.balance -= tx.amount;
  }
}

function applyTransactionBalance(tx, db) {
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
    let accTo = db.accounts.find(a => a.id === tx.toAccountId);
    if (accFrom) accFrom.balance -= tx.amount;
    if (accTo) accTo.balance += tx.amount;
  } else if (tx.type === 'adjustment') {
    let acc = db.accounts.find(a => a.id === tx.accountId);
    if (acc) acc.balance += tx.amount;
  }
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ==========================================
// 3. API TRANSAKSI
// ==========================================
app.get('/api/transactions', (req, res) => {
  const db = readDB();
  const { search, filter, category, accountId } = req.query;
  let txs = db.transactions || [];
  
  const todayStr = getLocalToday();
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
  res.json(txs);
});

app.get('/api/transactions/:id', (req, res) => {
  const db = readDB();
  const tx = db.transactions.find(t => t.id == req.params.id);
  if (tx) res.json(tx); else res.status(404).json({ error: 'Transaksi tidak ditemukan' });
});

app.post('/api/transactions', (req, res) => {
  const db = readDB();
  const { type, category, amount, paymentMethod, customerPaid, accountId, fromAccountId, toAccountId, note, tipAmount, tipPaymentMethod, date, timestamp } = req.body;
  
  let newTx = { 
    id: Date.now(), type, category, 
    amount: parseFloat(amount) || 0, 
    note: note || '', 
    date: date || getLocalToday(), 
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

  applyTransactionBalance(newTx, db);
  db.transactions.unshift(newTx);
  writeDB(db);
  res.json({ message: 'Transaksi tersimpan', transaction: newTx });
});

app.put('/api/transactions/:id', (req, res) => {
  const db = readDB();
  const txIndex = db.transactions.findIndex(t => t.id == req.params.id);
  
  if (txIndex > -1) {
    let oldTx = db.transactions[txIndex];
    reverseTransactionBalance(oldTx, db);
    
    let updatedTx = { ...oldTx, ...req.body };
    updatedTx.amount = parseFloat(req.body.amount) || 0;
    updatedTx.tipAmount = parseFloat(req.body.tipAmount) || 0;
    
    if (updatedTx.type === 'in' && updatedTx.paymentMethod === 'Tunai') {
      updatedTx.customerPaid = parseFloat(req.body.customerPaid) || 0;
    }
    
    applyTransactionBalance(updatedTx, db);
    db.transactions[txIndex] = updatedTx;
    writeDB(db);
    res.json({ message: 'Transaksi berhasil diubah secara menyeluruh' });
  } else {
    res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  const db = readDB();
  const txIndex = db.transactions.findIndex(t => t.id == req.params.id);
  if (txIndex > -1) {
    reverseTransactionBalance(db.transactions[txIndex], db);
    db.transactions.splice(txIndex, 1);
    writeDB(db);
    res.json({ message: 'Transaksi dan Tip berhasil dihapus, saldo dikembalikan' });
  } else {
    res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  }
});

// ==========================================
// 4. API REKENING
// ==========================================
app.get('/api/accounts', (req, res) => { res.json(readDB().accounts); });
app.get('/api/accounts/:id', (req, res) => {
  const db = readDB();
  const acc = db.accounts.find(a => a.id === req.params.id);
  const mutasi = db.transactions.filter(t => t.accountId === req.params.id || t.fromAccountId === req.params.id || t.toAccountId === req.params.id || (t.tipAmount > 0 && ((t.tipPaymentMethod === 'Tunai' && req.params.id === 'acc_cash') || (t.tipPaymentMethod === 'Non-Tunai' && req.params.id === 'acc_grab'))));
  res.json({ account: acc, mutasi });
});

app.post('/api/accounts', (req, res) => {
  const db = readDB();
  const { name, balance } = req.body;
  const newAccount = { id: 'acc_' + Date.now(), name, icon: 'wallet', color: 'green', balance: parseFloat(balance) || 0 };
  db.accounts.push(newAccount);
  writeDB(db);
  res.json({ message: 'Rekening dibuat' });
});

app.put('/api/accounts/:id', (req, res) => {
  const db = readDB();
  let acc = db.accounts.find(a => a.id === req.params.id);
  if (acc) {
    if (req.body.name) acc.name = req.body.name;
    if (req.body.balance !== undefined) {
      const difference = parseFloat(req.body.balance) - acc.balance;
      if (difference !== 0) {
        let adjTx = { id: Date.now(), type: 'adjustment', category: 'Penyesuaian Saldo', amount: difference, note: 'Manual Sistem', accountId: acc.id, date: getLocalToday(), timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
        applyTransactionBalance(adjTx, db);
        db.transactions.unshift(adjTx);
      }
    }
    writeDB(db);
    res.json({ message: 'Rekening diperbarui' });
  } else {
    res.status(404).json({ error: 'Rekening tidak ditemukan' });
  }
});

// ==========================================
// 5. API FINANCIAL REPORT & CHART 
// (DIPERDALAM: MENGIRIM ARRAY DETAIL KE PIE CHART)
// ==========================================
app.get('/api/financial-report', (req, res) => {
  const db = readDB();
  const { period, exactDate } = req.query; 
  let todayObj = new Date(); todayObj.setHours(todayObj.getHours() + 7);
  let todayStr = todayObj.toISOString().split('T')[0];
  
  let filteredTx = [];
  
  if (exactDate) {
    filteredTx = db.transactions.filter(t => t.date === exactDate);
  } else {
    let startStr = todayStr;
    let endStr = todayStr;
    
    if (period === '7days') {
      let d = new Date(todayObj); d.setDate(d.getDate() - 6);
      startStr = d.toISOString().split('T')[0];
    } else if (period === '30days') {
      let d = new Date(todayObj); d.setDate(d.getDate() - 29);
      startStr = d.toISOString().split('T')[0];
    } else if (period === 'this_month') {
      startStr = todayStr.substring(0, 7) + '-01';
    } else if (period && period.length === 7) { 
      startStr = period + '-01';
      let year = parseInt(period.split('-')[0]);
      let month = parseInt(period.split('-')[1]);
      let lastDay = new Date(year, month, 0).getDate();
      endStr = `${period}-${lastDay}`;
    }
    filteredTx = db.transactions.filter(t => t.date >= startStr && t.date <= endStr);
  }

  let totalIncome = 0, totalExpense = 0;
  const dailyMap = {};
  
  // Data untuk grafik dan detail rinciannya
  const pieIncome = {}; const pieExpense = {};
  const pieDetailsIncome = {}; const pieDetailsExpense = {}; 

  filteredTx.forEach(t => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { date: t.date, in: 0, out: 0, net: 0, trips: 0, txCount: 0, details: [] };
    dailyMap[t.date].txCount++;
    dailyMap[t.date].details.push(t);
    
    if (t.type === 'in') {
      totalIncome += t.amount;
      dailyMap[t.date].in += t.amount;
      
      pieIncome[t.category] = (pieIncome[t.category] || 0) + t.amount;
      if (!pieDetailsIncome[t.category]) pieDetailsIncome[t.category] = [];
      pieDetailsIncome[t.category].push(t);
      
      if (['Trip', 'Paket', 'Food', 'G-Move', 'G-Bite', 'G-Drop'].includes(t.category) || t.category.toLowerCase().includes('trip')) {
        dailyMap[t.date].trips++;
      }
      
      if (t.tipAmount > 0) {
        totalIncome += t.tipAmount;
        dailyMap[t.date].in += t.tipAmount;
        pieIncome['Tips'] = (pieIncome['Tips'] || 0) + t.tipAmount;
        
        if (!pieDetailsIncome['Tips']) pieDetailsIncome['Tips'] = [];
        pieDetailsIncome['Tips'].push({...t, amount: t.tipAmount, category: 'Tips'}); // Clone as separate line for UI
        dailyMap[t.date].txCount++;
      }
    } else if (t.type === 'out') {
      totalExpense += t.amount;
      dailyMap[t.date].out += t.amount;
      
      pieExpense[t.category] = (pieExpense[t.category] || 0) + t.amount;
      if (!pieDetailsExpense[t.category]) pieDetailsExpense[t.category] = [];
      pieDetailsExpense[t.category].push(t);
    }
    dailyMap[t.date].net = dailyMap[t.date].in - dailyMap[t.date].out;
  });

  let historyArray = Object.values(dailyMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  let totalAssets = db.accounts.reduce((s, a) => s + a.balance, 0);

  res.json({
    summary: { totalAssets, totalIncome, totalExpense, netProfit: totalIncome - totalExpense },
    charts: { dailyTrend: historyArray.slice().reverse(), pieIncome, pieExpense, pieDetailsIncome, pieDetailsExpense },
    history: historyArray
  });
});

// ==========================================
// 6. API DASHBOARD DRIVER & TUTUP BUKU
// ==========================================
app.get('/api/driver-dashboard', (req, res) => {
  const db = readDB();
  const today = getLocalToday();
  const txs = db.transactions.filter(t => t.date === today);
  
  let stats = {
    totalTrip: 0, tripSelesai: 0, tripBatal: 0,
    pendapatan: 0, labaBersih: 0, totalTip: 0, pengeluaran: 0,
    jamOnlineMins: 0, 
    jamProduktifData: new Array(24).fill(0)
  };

  let minTime = null, maxTime = null;

  txs.forEach(t => {
    // Parse time for hours online and peak chart
    if (t.timestamp) {
      const [h, m] = t.timestamp.split(':').map(Number);
      const minutes = (h * 60) + (m || 0);
      if (minTime === null || minutes < minTime) minTime = minutes;
      if (maxTime === null || minutes > maxTime) maxTime = minutes;
      
      if (t.type === 'in' && h >= 0 && h < 24) {
        stats.jamProduktifData[h] += t.amount;
      }
    }

    if (t.type === 'in') {
      stats.pendapatan += t.amount;
      if (t.tipAmount > 0) {
        stats.totalTip += t.tipAmount;
        stats.pendapatan += t.tipAmount;
      }
      
      let isTrip = ['Trip', 'Paket', 'Food', 'G-Move', 'G-Bite', 'G-Drop'].includes(t.category) || t.category.toLowerCase().includes('trip');
      if (isTrip) {
        stats.totalTrip++;
        if (t.note.toLowerCase().includes('batal') || t.note.toLowerCase().includes('cancel')) {
          stats.tripBatal++;
        } else {
          stats.tripSelesai++;
        }
      }
    } else if (t.type === 'out') {
      stats.pengeluaran += t.amount;
    }
  });

  stats.labaBersih = stats.pendapatan - stats.pengeluaran;
  
  if (minTime !== null && maxTime !== null && maxTime >= minTime) {
    stats.jamOnlineMins = maxTime - minTime;
  }

  // Peak Hours calculation
  let peakHour = stats.jamProduktifData.indexOf(Math.max(...stats.jamProduktifData));
  let peakVal = stats.jamProduktifData[peakHour];
  
  // AI Summary Generation
  let hours = Math.floor(stats.jamOnlineMins / 60);
  let summary = `Hari ini Anda telah menyelesaikan ${stats.tripSelesai} trip dengan laba bersih Rp${stats.labaBersih.toLocaleString('id-ID')}.`;
  if (peakVal > 0) {
    summary += ` Jam kerja paling produktif Anda adalah pukul ${peakHour}:00 - ${peakHour+1}:00.`;
  }
  if (stats.tripBatal > 0) {
    summary += ` Terdapat ${stats.tripBatal} trip yang dibatalkan.`;
  }

  res.json({
    stats,
    target: db.target,
    aiSummary: summary,
    peakHour: peakVal > 0 ? `${peakHour}:00 - ${peakHour+1}:00` : '-'
  });
});

app.post('/api/tutup-buku', (req, res) => {
  const db = readDB();
  const today = getLocalToday();
  
  // Prevent duplicate tutup buku on the same day unless overridden
  const existingIdx = db.dailyArchives.findIndex(a => a.date === today);
  
  // Fetch today's snapshot via internal logic
  let inToday = 0, outToday = 0, tipToday = 0, trips = 0;
  db.transactions.filter(t => t.date === today).forEach(t => {
    if (t.type === 'in') {
      inToday += t.amount;
      if (t.tipAmount > 0) { inToday += t.tipAmount; tipToday += t.tipAmount; }
      if (['Trip', 'Paket', 'Food'].includes(t.category) || t.category.toLowerCase().includes('trip')) trips++;
    } else if (t.type === 'out') {
      outToday += t.amount;
    }
  });

  let archive = {
    id: 'arch_' + Date.now(),
    date: today,
    totalTrip: trips,
    pendapatan: inToday,
    pengeluaran: outToday,
    labaBersih: inToday - outToday,
    totalTip: tipToday,
    targetStatus: (inToday >= db.target) ? 'Tercapai' : 'Kurang',
    summary: `Menyelesaikan ${trips} trip dengan laba bersih Rp${(inToday - outToday).toLocaleString('id-ID')}.`
  };

  if (existingIdx > -1) db.dailyArchives[existingIdx] = archive;
  else db.dailyArchives.unshift(archive);

  writeDB(db);
  res.json({ message: 'Buku harian berhasil ditutup dan diarsipkan.', archive });
});

app.get('/api/tutup-buku', (req, res) => {
  res.json(readDB().dailyArchives || []);
});

// ==========================================
// 7. API KECERDASAN FINANSIAL (AI ANALYTICS REAL DATA)
// (DIPERDALAM SESUAI INSTRUKSI VERSI 1.0)
// ==========================================
app.get('/api/analytics-deep', (req, res) => {
  const db = readDB();
  const todayStr = getLocalToday();
  
  // Ambil data 30 hari terakhir
  let dStart = new Date(); dStart.setHours(dStart.getHours() + 7); dStart.setDate(dStart.getDate() - 29);
  const startStr = dStart.toISOString().split('T')[0];
  
  // Ambil data minggu lalu vs minggu ini untuk komparasi tren
  let dMid = new Date(); dMid.setHours(dMid.getHours() + 7); dMid.setDate(dMid.getDate() - 7);
  const midStr = dMid.toISOString().split('T')[0];

  const monthTx = db.transactions.filter(t => t.date >= startStr && t.date <= todayStr);
  const thisWeekTx = monthTx.filter(t => t.date >= midStr && t.date <= todayStr);
  const lastWeekTx = monthTx.filter(t => t.date >= startStr && t.date < midStr);

  let totalIn = 0, totalOut = 0, tipTotal = 0, totalTrips = 0;
  const categoryOutMap = {}; const hourlyMap = {}; const dayMap = {};
  const thisWeekExpMap = {}; const lastWeekExpMap = {};

  monthTx.forEach(t => {
    let dayOfWeek = new Date(t.date).getDay();
    let hour = t.timestamp ? parseInt(t.timestamp.split(':')[0]) : 0;
    
    if (t.type === 'in') {
      totalIn += t.amount;
      dayMap[dayOfWeek] = (dayMap[dayOfWeek] || 0) + t.amount;
      hourlyMap[hour] = (hourlyMap[hour] || 0) + t.amount;
      if (t.category.toLowerCase().includes('trip') || ['Trip', 'Paket', 'Food'].includes(t.category)) totalTrips++;
      
      if (t.tipAmount > 0) { tipTotal += t.tipAmount; totalIn += t.tipAmount; }
    } else if (t.type === 'out') {
      totalOut += t.amount;
      categoryOutMap[t.category] = (categoryOutMap[t.category] || 0) + t.amount;
      
      if (t.date >= midStr) thisWeekExpMap[t.category] = (thisWeekExpMap[t.category] || 0) + t.amount;
      else lastWeekExpMap[t.category] = (lastWeekExpMap[t.category] || 0) + t.amount;
    }
  });

  // Logika Evaluasi Financial Health
  let healthScore = 100;
  let reason = "Kondisi keuangan sangat sehat dan stabil.";
  if (totalOut === 0 && totalIn === 0) { healthScore = 0; reason = "Belum ada data yang cukup untuk dianalisa."; }
  else if (totalOut > totalIn) { healthScore = 40; reason = "Kritis: Pengeluaran 30 hari terakhir melebihi total pendapatan Anda."; }
  else if (totalOut > (totalIn * 0.7)) { healthScore = 65; reason = "Perhatian: Biaya operasional memakan lebih dari 70% pendapatan kotor Anda."; }
  else if (totalOut > (totalIn * 0.5)) { healthScore = 85; reason = "Cukup baik, rasio pengeluaran operasional berada pada ambang batas wajar (50%)."; }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  let bestHour = Object.keys(hourlyMap).length > 0 ? Object.keys(hourlyMap).reduce((a, b) => hourlyMap[a] > hourlyMap[b] ? a : b) : null;
  let bestDayIdx = Object.keys(dayMap).length > 0 ? Object.keys(dayMap).reduce((a, b) => dayMap[a] > dayMap[b] ? a : b) : null;
  
  let avgTripIn = totalTrips > 0 ? (totalIn / totalTrips) : 0;
  
  // Cek peningkatan pengeluaran tajam
  let increasingExpMsg = null;
  for (const cat in thisWeekExpMap) {
    let lastWk = lastWeekExpMap[cat] || 0;
    let thisWk = thisWeekExpMap[cat];
    if (lastWk > 0 && thisWk > (lastWk * 1.2)) { // Naik > 20%
      let pct = Math.round(((thisWk - lastWk) / lastWk) * 100);
      increasingExpMsg = `Pengeluaran ${cat} meningkat tajam sebesar ${pct}% dibanding minggu sebelumnya.`;
      break; 
    }
  }

  const insights = [];

  // Insight 1: Performa Driver & Analisa Pendapatan
  if (totalTrips > 0) {
    let pctBestHour = Math.round((hourlyMap[bestHour] / totalIn) * 100);
    insights.push({
      title: "Performa Pendapatan & Jam Emas", type: "positive", icon: "motorcycle",
      dataPoint: `Jam ${bestHour}:00 - ${parseInt(bestHour)+1}:00 = ${pctBestHour}% Total Pendapatan`,
      desc: `Rata-rata pendapatan per trip Anda adalah Rp ${Math.round(avgTripIn).toLocaleString('id-ID')}. Hari ${days[bestDayIdx]} merupakan hari paling menguntungkan.`,
      recommendation: `Untuk memaksimalkan pendapatan, pastikan Anda selalu online pada jam ${bestHour}:00 dan fokus di hari ${days[bestDayIdx]}.`
    });
  }

  // Insight 2: Analisis Tip
  if (tipTotal > 0) {
    let pctTip = ((tipTotal/totalIn)*100).toFixed(1);
    insights.push({
      title: "Analisa Tip Pelanggan", type: "positive", icon: "hand-holding-dollar",
      dataPoint: `Total Tip 30 Hari: Rp ${tipTotal.toLocaleString('id-ID')}`,
      desc: `Tip menyumbang ${pctTip}% dari seluruh pendapatan kotor operasional Anda.`,
      recommendation: `Rasio tip ini sangat baik. Pertahankan kenyamanan berkendara, kebersihan helm/motor, dan sapaan ramah kepada pelanggan.`
    });
  }

  // Insight 3: Analisa Pengeluaran & Cash Flow
  let biggestExpCat = Object.keys(categoryOutMap).length > 0 ? Object.keys(categoryOutMap).reduce((a, b) => categoryOutMap[a] > categoryOutMap[b] ? a : b) : null;
  if (biggestExpCat) {
    insights.push({
      title: "Analisa Pengeluaran Operasional", type: increasingExpMsg ? "warning" : "positive", icon: "magnifying-glass-chart",
      dataPoint: `Beban Terbesar: ${biggestExpCat}`,
      desc: increasingExpMsg || `Beban operasional tertinggi Anda berada di kategori ${biggestExpCat} (Rp ${categoryOutMap[biggestExpCat].toLocaleString('id-ID')}).`,
      recommendation: `Evaluasi kembali apakah pengeluaran ${biggestExpCat} bisa ditekan. Cari alternatif rute atau perbaiki pola gaya berkendara (jika beban bensin yang dominan).`
    });
  }
  
  // Insight 4: Evaluasi Target (Proyeksi)
  if (db.goals && db.goals.length > 0) {
    let activeGoal = db.goals[0]; // Ambil target pertama sbg sampel
    let progress = activeGoal.targetAmount > 0 ? Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100) : 0;
    insights.push({
      title: "Evaluasi Target: " + activeGoal.name, type: progress > 50 ? "positive" : "warning", icon: "bullseye",
      dataPoint: `Progres Terkumpul: ${progress}%`,
      desc: progress === 0 ? `Anda belum mulai menabung untuk target ini.` : `Anda telah berhasil mengumpulkan Rp${activeGoal.currentAmount.toLocaleString('id-ID')} dari target Rp${activeGoal.targetAmount.toLocaleString('id-ID')}.`,
      recommendation: `Sisihkan setidaknya Rp${Math.round(activeGoal.monthlyTarget/30).toLocaleString('id-ID')} per hari sebelum uang hasil operasional terpakai.`
    });
  }

  res.json({ healthScore, explanation: reason, insights });
});

// ==========================================
// 8. API TARGET, PROYEKSI & SIMULASI
// ==========================================
app.get('/api/goals', (req, res) => {
  const db = readDB();
  let enhancedGoals = db.goals.map(g => {
    let progress = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
    let remaining = Math.max(0, g.targetAmount - g.currentAmount);
    let dailyTarget = Math.round((g.monthlyTarget || 0) / 30);
    let weeklyTarget = Math.round((g.monthlyTarget || 0) / 4);
    
    // ATURAN BARU: Jangan beri estimasi jika saldo terkumpul masih 0
    let estStr = '-';
    if (g.currentAmount > 0 && dailyTarget > 0) {
       let daysNeeded = Math.ceil(remaining / dailyTarget);
       let estDate = new Date(); estDate.setDate(estDate.getDate() + daysNeeded);
       estStr = estDate.toISOString().split('T')[0];
    }

    return { ...g, remaining, progress, dailyTarget, weeklyTarget, estimatedCompletion: estStr };
  });
  res.json({ goals: enhancedGoals });
});

app.post('/api/goals', (req, res) => {
  const db = readDB();
  const { name, targetAmount, monthlyTarget, startDate } = req.body;
  const newGoal = { id: 'goal_' + Date.now(), name, targetAmount: parseFloat(targetAmount) || 0, currentAmount: 0, monthlyTarget: parseFloat(monthlyTarget) || 0, startDate: startDate || getLocalToday() };
  db.goals.push(newGoal); writeDB(db); res.json({ message: 'Target dibuat', goal: newGoal });
});

app.put('/api/goals/:id', (req, res) => {
  const db = readDB();
  const index = db.goals.findIndex(item => item.id === req.params.id);
  if (index > -1) {
    db.goals[index] = { ...db.goals[index], ...req.body };
    // Format numeric parsing to be safe
    if(req.body.targetAmount !== undefined) db.goals[index].targetAmount = parseFloat(req.body.targetAmount) || 0;
    if(req.body.currentAmount !== undefined) db.goals[index].currentAmount = parseFloat(req.body.currentAmount) || 0;
    if(req.body.monthlyTarget !== undefined) db.goals[index].monthlyTarget = parseFloat(req.body.monthlyTarget) || 0;
    
    writeDB(db); res.json({ message: 'Target berhasil diperbarui' });
  } else { res.status(404).json({ error: 'Target tidak ditemukan' }); }
});

app.delete('/api/goals/:id', (req, res) => {
  const db = readDB();
  db.goals = db.goals.filter(g => g.id !== req.params.id); writeDB(db); res.json({ message: 'Target dihapus' });
});

// Target Harian Pendapatan Kotor
app.get('/api/summary', (req, res) => {
  const db = readDB();
  const today = getLocalToday();
  const target = db.target;
  let inToday = 0, outToday = 0, trips = 0;

  db.transactions.filter(t => t.date === today).forEach(t => {
    if (t.type === 'in') { 
      inToday += t.amount; 
      if (t.tipAmount > 0) inToday += t.tipAmount;
      if (['Trip', 'Paket', 'Food', 'G-Move', 'G-Bite', 'G-Drop'].includes(t.category) || t.category.toLowerCase().includes('trip') || t.category.toLowerCase().includes('order')) {
        if (!t.note.toLowerCase().includes('batal') && !t.note.toLowerCase().includes('cancel')) {
           trips++; 
        }
      }
    }
    if (t.type === 'out') { outToday += t.amount; }
  });

  let largestAcc = db.accounts.reduce((prev, current) => (prev.balance > current.balance) ? prev : current, db.accounts[0] || null);

  res.json({
    today, target, 
    totalAssets: db.accounts.reduce((sum, acc) => sum + acc.balance, 0),
    accountsCount: db.accounts.length,
    largestAccount: largestAcc ? largestAcc.name : '-',
    accounts: db.accounts,
    todayStats: { in: inToday, out: outToday, net: inToday - outToday, trips }
  });
});

app.post('/api/target', (req, res) => {
  const db = readDB(); db.target = parseFloat(req.body.target) || 0;
  writeDB(db); res.json({ message: 'Target harian diperbarui' });
});

// ==========================================
// 9. API PENGATURAN, KATEGORI & BACKUP/RESTORE
// ==========================================
app.get('/api/settings', (req, res) => { res.json(readDB().settings); });
app.put('/api/settings', (req, res) => {
  const db = readDB(); 
  db.settings = { ...db.settings, ...req.body };
  writeDB(db); res.json({ message: 'Pengaturan disimpan', settings: db.settings });
});

// Backup & Restore DB
app.get('/api/backup', (req, res) => {
  res.setHeader('Content-disposition', 'attachment; filename=grab_tracker_backup.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(readDB(), null, 2));
});
app.post('/api/restore', (req, res) => {
  if (req.body && req.body.transactions && req.body.accounts) { 
    writeDB(req.body); 
    res.json({ message: 'Database berhasil dipulihkan' }); 
  } else { 
    res.status(400).json({ error: 'Format database tidak valid' }); 
  }
});

// Endpoint Kategori
app.get('/api/categories', (req, res) => res.json(readDB().categories));
app.post('/api/categories', (req, res) => {
  const db = readDB(); const { name, type, icon } = req.body;
  const newCat = { id: 'cat_' + Date.now(), name: name || 'Baru', type: type || 'out', icon: icon || 'tag', color: 'gray' };
  db.categories.push(newCat); writeDB(db); res.json({ message: 'Kategori ditambahkan', category: newCat });
});
app.delete('/api/categories/:id', (req, res) => {
  const db = readDB(); db.categories = db.categories.filter(c => c.id !== req.params.id); writeDB(db); res.json({ message: 'Kategori dihapus' });
});

app.listen(port, () => console.log(`🚀 MASTER FINANCIAL SUITE v1.0 BACKEND AKTIF PADA PORT ${port}`));
