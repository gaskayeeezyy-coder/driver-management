// reportService.js - Modul Laporan, Driver Dashboard, AI Analytics, Settings & Backup (Logika 100% Identik dengan server.js)
const ReportService = {

  // Financial Report & Chart (Pengganti app.get('/api/financial-report'))
  getFinancialReport(query = {}) {
    const db = DBService.readDB();
    const { period, exactDate } = query; 
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
          pieDetailsIncome['Tips'].push({...t, amount: t.tipAmount, category: 'Tips'}); 
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

    return {
      summary: { totalAssets, totalIncome, totalExpense, netProfit: totalIncome - totalExpense },
      charts: { dailyTrend: historyArray.slice().reverse(), pieIncome, pieExpense, pieDetailsIncome, pieDetailsExpense },
      history: historyArray
    };
  },

  // Driver Dashboard (Pengganti app.get('/api/driver-dashboard'))
    getDriverDashboard() {
    const db = DBService.readDB();
    const todayStr = DBService.getLocalToday();
    const todayTxs = (db.transactions || []).filter(t => t.date === todayStr);

    let totalIncome = todayTxs.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
    let totalTrip = todayTxs.filter(t => t.type === 'in').length;
    
    // Ambil data waktu online mentah (misal dari setting atau akumulasi trip), lalu format rapi
    let rawMinutes = db.driverOnlineMinutes || 0; // atau sumber data waktu online Anda
    let formattedOnlineTime = this.formatOnlineTime(rawMinutes);

    return {
      onlineTime: formattedOnlineTime,
      totalIncome: totalIncome,
      totalTrip: totalTrip,
      target: db.target || 200000
    };

    let minTime = null, maxTime = null;

    txs.forEach(t => {
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
      const totalMin = stats.jamOnlineMins || 0;
    const jam = Math.floor(totalMin / 60);
    const menit = totalMin % 60;
    stats.formattedOnlineTime = `${jam}j ${menit}m`;

    let peakHour = stats.jamProduktifData.indexOf(Math.max(...stats.jamProduktifData));
    let peakVal = stats.jamProduktifData[peakHour];
    
    let summary = `Hari ini Anda telah menyelesaikan ${stats.tripSelesai} trip dengan laba bersih Rp${stats.labaBersih.toLocaleString('id-ID')}.`;
    if (peakVal > 0) {
      summary += ` Jam kerja paling produktif Anda adalah pukul ${peakHour}:00 - ${peakHour+1}:00.`;
    }
    if (stats.tripBatal > 0) {
      summary += ` Terdapat ${stats.tripBatal} trip yang dibatalkan.`;
    }

    return {
      stats,
      target: db.target,
      aiSummary: summary,
      peakHour: peakVal > 0 ? `${peakHour}:00 - ${peakHour+1}:00` : '-'
    };
  },

  // Tutup Buku (Pengganti app.post('/api/tutup-buku'))
  processTutupBuku() {
    const db = DBService.readDB();
    const today = DBService.getLocalToday();
    
    const existingIdx = db.dailyArchives.findIndex(a => a.date === today);
    
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

    DBService.writeDB(db);
    return { message: 'Buku harian berhasil ditutup dan diarsipkan.', archive };
  },

  // Get Daily Archives (Pengganti app.get('/api/tutup-buku'))
  getDailyArchives() {
    const db = DBService.readDB();
    return db.dailyArchives || [];
  },

  // Analytics Deep / AI Financial Analytics (Pengganti app.get('/api/analytics-deep'))
  getAnalyticsDeep() {
    const db = DBService.readDB();
    const todayStr = DBService.getLocalToday();
    
    let dStart = new Date(); dStart.setHours(dStart.getHours() + 7); dStart.setDate(dStart.getDate() - 29);
    const startStr = dStart.toISOString().split('T')[0];
    
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
    
    let increasingExpMsg = null;
    for (const cat in thisWeekExpMap) {
      let lastWk = lastWeekExpMap[cat] || 0;
      let thisWk = thisWeekExpMap[cat];
      if (lastWk > 0 && thisWk > (lastWk * 1.2)) { 
        let pct = Math.round(((thisWk - lastWk) / lastWk) * 100);
        increasingExpMsg = `Pengeluaran ${cat} meningkat tajam sebesar ${pct}% dibanding minggu sebelumnya.`;
        break; 
      }
    }

    const insights = [];

    if (totalTrips > 0) {
      let pctBestHour = Math.round((hourlyMap[bestHour] / totalIn) * 100);
      insights.push({
        title: "Performa Pendapatan & Jam Emas", type: "positive", icon: "motorcycle",
        dataPoint: `Jam ${bestHour}:00 - ${parseInt(bestHour)+1}:00 = ${pctBestHour}% Total Pendapatan`,
        desc: `Rata-rata pendapatan per trip Anda adalah Rp ${Math.round(avgTripIn).toLocaleString('id-ID')}. Hari ${days[bestDayIdx]} merupakan hari paling menguntungkan.`,
        recommendation: `Untuk memaksimalkan pendapatan, pastikan Anda selalu online pada jam ${bestHour}:00 dan fokus di hari ${days[bestDayIdx]}.`
      });
    }

    if (tipTotal > 0) {
      let pctTip = ((tipTotal/totalIn)*100).toFixed(1);
      insights.push({
        title: "Analisa Tip Pelanggan", type: "positive", icon: "hand-holding-dollar",
        dataPoint: `Total Tip 30 Hari: Rp ${tipTotal.toLocaleString('id-ID')}`,
        desc: `Tip menyumbang ${pctTip}% dari seluruh pendapatan kotor operasional Anda.`,
        recommendation: `Rasio tip ini sangat baik. Pertahankan kenyamanan berkendara, kebersihan helm/motor, dan sapaan ramah kepada pelanggan.`
      });
    }

    let biggestExpCat = Object.keys(categoryOutMap).length > 0 ? Object.keys(categoryOutMap).reduce((a, b) => categoryOutMap[a] > categoryOutMap[b] ? a : b) : null;
    if (biggestExpCat) {
      insights.push({
        title: "Analisa Pengeluaran Operasional", type: increasingExpMsg ? "warning" : "positive", icon: "magnifying-glass-chart",
        dataPoint: `Beban Terbesar: ${biggestExpCat}`,
        desc: increasingExpMsg || `Beban operasional tertinggi Anda berada di kategori ${biggestExpCat} (Rp ${categoryOutMap[biggestExpCat].toLocaleString('id-ID')}).`,
        recommendation: `Evaluasi kembali apakah pengeluaran ${biggestExpCat} bisa ditekan. Cari alternatif rute atau perbaiki pola gaya berkendara (jika beban bensin yang dominan).`
      });
    }
    
    const dbGoals = db.goals || [];
    if (dbGoals.length > 0) {
      let activeGoal = dbGoals[0]; 
      let progress = activeGoal.targetAmount > 0 ? Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100) : 0;
      insights.push({
        title: "Evaluasi Target: " + activeGoal.name, type: progress > 50 ? "positive" : "warning", icon: "bullseye",
        dataPoint: `Progres Terkumpul: ${progress}%`,
        desc: progress === 0 ? `Anda belum mulai menabung untuk target ini.` : `Anda telah berhasil mengumpulkan Rp${activeGoal.currentAmount.toLocaleString('id-ID')} dari target Rp${activeGoal.targetAmount.toLocaleString('id-ID')}.`,
        recommendation: `Sisihkan setidaknya Rp${Math.round(activeGoal.monthlyTarget/30).toLocaleString('id-ID')} per hari sebelum uang hasil operasional terpakai.`
      });
    }

    return { healthScore, explanation: reason, insights };
  },

  // Settings, Categories & Backup/Restore
  getCategories() {
    const db = DBService.readDB();
    return db.categories;
  },

  createCategory(body) {
    const db = DBService.readDB(); 
    const { name, type, icon } = body;
    const newCat = { id: 'cat_' + Date.now(), name: name || 'Baru', type: type || 'out', icon: icon || 'tag', color: 'gray' };
    db.categories.push(newCat); 
    DBService.writeDB(db); 
    return { message: 'Kategori ditambahkan', category: newCat };
  },

  deleteCategory(id) {
    const db = DBService.readDB(); 
    db.categories = db.categories.filter(c => c.id !== id); 
    DBService.writeDB(db); 
    return { message: 'Kategori dihapus' };
  },

  getSettings() {
    const db = DBService.readDB();
    return db.settings;
  },

  updateSettings(body) {
    const db = DBService.readDB(); 
    db.settings = { ...db.settings, ...body };
    DBService.writeDB(db); 
    return { message: 'Pengaturan disimpan', settings: db.settings };
  },

  backupDB() {
    const db = DBService.readDB();
    return db;
  },

  restoreDB(body) {
    if (body && body.transactions && body.accounts) { 
      DBService.writeDB(body); 
      return { message: 'Database berhasil dipulihkan' }; 
    } else { 
      return { error: 'Format database tidak valid' }; 
    }
  }
    // Tambahkan fungsi ini di dalam obyek ReportService di reportService.js
  getChangeLog() {
    return [
      {
        version: "v1.2.0",
        date: "2026",
        title: "User Experience & Personalization Update",
        items: [
          "Splash Screen baru yang halus dan profesional",
          "Onboarding pengguna baru & profil kendaraan",
          "Personalisasi Dashboard Driver & Platform",
          "Sistem translasi multibahasa penuh (8 bahasa termasuk Sunda & Jawa)",
          "Custom Dialog / Modal modern menggantikan popup sistem",
          "Perbaikan bug layout Waktu Online di Dashboard Driver",
          "Optimalisasi UI & Bug Fix menyeluruh"
        ]
      },
      {
        version: "v1.1.0",
        date: "2025 - 2026",
        title: "Offline Architecture & Financial Hub",
        items: [
          "Migrasi arsitektur 100% offline (tanpa server/Termux)",
          "Financial Hub & Chart analitik keuangan",
          "AI Analytics & Skor Kesehatan Keuangan",
          "Manajemen Target & Multi Rekening / Dompet",
          "Fitur Backup & Restore data lokal",
          "Perbaikan sistem mutasi transaksi & reversal saldo"
        ]
      },
      {
        version: "v1.0.0",
        date: "2025",
        title: "Initial Release",
        items: [
          "Rilis pertama aplikasi Driver Management",
          "Pencatatan trip, pemasukan, dan pengeluaran harian",
          "Dashboard ringkasan harian ojek online"
        ]
      }
    ];
  },
};
