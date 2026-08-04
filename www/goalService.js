// goalService.js - Modul Target, Proyeksi & Ringkasan (Logika 100% Identik dengan server.js)
const GoalService = {

  // GET Goals (Pengganti app.get('/api/goals'))
  getGoals() {
    const db = DBService.readDB();
    let enhancedGoals = (db.goals || []).map(g => {
      let progress = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      let remaining = Math.max(0, g.targetAmount - g.currentAmount);
      let dailyTarget = Math.round((g.monthlyTarget || 0) / 30);
      let weeklyTarget = Math.round((g.monthlyTarget || 0) / 4);
      
      let estStr = '-';
      if (g.currentAmount > 0 && dailyTarget > 0) {
         let daysNeeded = Math.ceil(remaining / dailyTarget);
         let estDate = new Date(); estDate.setDate(estDate.getDate() + daysNeeded);
         estStr = estDate.toISOString().split('T')[0];
      }

      return { ...g, remaining, progress, dailyTarget, weeklyTarget, estimatedCompletion: estStr };
    });
    return { goals: enhancedGoals };
  },

  // POST Create Goal (Pengganti app.post('/api/goals'))
  createGoal(body) {
    const db = DBService.readDB();
    const { name, targetAmount, monthlyTarget, startDate } = body;
    const newGoal = { 
      id: 'goal_' + Date.now(), 
      name, 
      targetAmount: parseFloat(targetAmount) || 0, 
      currentAmount: 0, 
      monthlyTarget: parseFloat(monthlyTarget) || 0, 
      startDate: startDate || DBService.getLocalToday() 
    };
    db.goals.push(newGoal); 
    DBService.writeDB(db); 
    return { message: 'Target dibuat', goal: newGoal };
  },

  // PUT Update Goal (Pengganti app.put('/api/goals/:id'))
  updateGoal(id, body) {
    const db = DBService.readDB();
    const index = db.goals.findIndex(item => item.id === id);
    if (index > -1) {
      db.goals[index] = { ...db.goals[index], ...body };
      if(body.targetAmount !== undefined) db.goals[index].targetAmount = parseFloat(body.targetAmount) || 0;
      if(body.currentAmount !== undefined) db.goals[index].currentAmount = parseFloat(body.currentAmount) || 0;
      if(body.monthlyTarget !== undefined) db.goals[index].monthlyTarget = parseFloat(body.monthlyTarget) || 0;
      
      DBService.writeDB(db); 
      return { message: 'Target berhasil diperbarui' };
    } else { 
      return { error: 'Target tidak ditemukan' }; 
    }
  },

  // DELETE Goal (Pengganti app.delete('/api/goals/:id'))
  deleteGoal(id) {
    const db = DBService.readDB();
    db.goals = db.goals.filter(g => g.id !== id); 
    DBService.writeDB(db); 
    return { message: 'Target dihapus' };
  },

  // GET Summary / Target Harian Pendapatan Kotor (Pengganti app.get('/api/summary'))
  getSummary() {
    const db = DBService.readDB();
    const today = DBService.getLocalToday();
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

    return {
      today, target, 
      totalAssets: db.accounts.reduce((sum, acc) => sum + acc.balance, 0),
      accountsCount: db.accounts.length,
      largestAccount: largestAcc ? largestAcc.name : '-',
      accounts: db.accounts,
      todayStats: { in: inToday, out: outToday, net: inToday - outToday, trips }
    };
  },

  // POST Update Target Harian (Pengganti app.post('/api/target'))
  updateDailyTarget(body) {
    const db = DBService.readDB(); 
    db.target = parseFloat(body.target) || 0;
    DBService.writeDB(db); 
    return { message: 'Target harian diperbarui' };
  }
};
