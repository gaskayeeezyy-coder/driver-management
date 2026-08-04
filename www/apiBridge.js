// apiBridge.js - Jembatan Offline yang mencegat fetch('/api/...') dan meneruskannya ke Local Services
(function() {
  const originalFetch = window.fetch;

  // Helper untuk parsing query parameters dari URL (misal: /api/transactions?filter=today)
  function parseUrl(url) {
    const [path, search] = url.split('?');
    const query = {};
    if (search) {
      search.split('&').forEach(param => {
        const [key, val] = param.split('=');
        query[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
    }
    return { path, query };
  }

  // Interceptor pengganti server Express
  window.fetch = async function(input, init = {}) {
    let url = typeof input === 'string' ? input : input.url;

    // Jika bukan panggilan ke /api/, teruskan ke fetch normal (misal CDN Tailwind, FontAwesome, Chart.js)
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    const { path, query } = parseUrl(url);
    const method = (init.method || 'GET').toUpperCase();
    let body = null;
    if (init.body) {
      try { body = JSON.parse(init.body); } catch(e) { body = init.body; }
    }

    let responseData = { error: 'Endpoint tidak ditemukan' };
    let status = 200;

    try {
      // 1. TRANSACTIONS
      if (path === '/api/transactions' && method === 'GET') {
        responseData = TransactionService.getTransactions(query);
      } else if (path === '/api/transactions' && method === 'POST') {
        responseData = TransactionService.createTransaction(body);
      } else if (path.match(^\/api\/transactions\/[^\/]+$) && method === 'GET') {
        const id = path.split('/')[3];
        responseData = TransactionService.getTransactionById(id);
      } else if (path.match(^\/api\/transactions\/[^\/]+$) && method === 'PUT') {
        const id = path.split('/')[3];
        responseData = TransactionService.updateTransaction(id, body);
      } else if (path.match(^\/api\/transactions\/[^\/]+$) && method === 'DELETE') {
        const id = path.split('/')[3];
        responseData = TransactionService.deleteTransaction(id);
      }

      // 2. ACCOUNTS
      else if (path === '/api/accounts' && method === 'GET') {
        responseData = AccountService.getAccounts();
      } else if (path === '/api/accounts' && method === 'POST') {
        responseData = AccountService.createAccount(body);
      } else if (path.match(^\/api\/accounts\/[^\/]+$) && method === 'GET') {
        const id = path.split('/')[3];
        responseData = AccountService.getAccountById(id);
      } else if (path.match(^\/api\/accounts\/[^\/]+$) && method === 'PUT') {
        const id = path.split('/')[3];
        responseData = AccountService.updateAccount(id, body);
      } else if (path.match(^\/api\/accounts\/[^\/]+$) && method === 'DELETE') {
        const id = path.split('/')[3];
        // Tambahan pengaman jika ada pemanggilan delete account
        const db = DBService.readDB();
        db.accounts = db.accounts.filter(a => a.id !== id);
        DBService.writeDB(db);
        responseData = { message: 'Rekening dihapus' };
      }

      // 3. GOALS & TARGETS & SUMMARY
      else if (path === '/api/goals' && method === 'GET') {
        responseData = GoalService.getGoals();
      } else if (path === '/api/goals' && method === 'POST') {
        responseData = GoalService.createGoal(body);
      } else if (path.match(^\/api\/goals\/[^\/]+$) && method === 'PUT') {
        const id = path.split('/')[3];
        responseData = GoalService.updateGoal(id, body);
      } else if (path.match(^\/api\/goals\/[^\/]+$) && method === 'DELETE') {
        const id = path.split('/')[3];
        responseData = GoalService.deleteGoal(id);
      } else if (path === '/api/summary' && method === 'GET') {
        responseData = GoalService.getSummary();
      } else if (path === '/api/target' && method === 'POST') {
        responseData = GoalService.updateDailyTarget(body);
      }

      // 4. REPORTS, DRIVER DASHBOARD, TUTUP BUKU & AI ANALYTICS
      else if (path === '/api/financial-report' && method === 'GET') {
        responseData = ReportService.getFinancialReport(query);
      } else if (path === '/api/driver-dashboard' && method === 'GET') {
        responseData = ReportService.getDriverDashboard();
      } else if (path === '/api/tutup-buku' && method === 'POST') {
        responseData = ReportService.processTutupBuku();
      } else if (path === '/api/tutup-buku' && method === 'GET') {
        responseData = ReportService.getDailyArchives();
      } else if (path === '/api/analytics-deep' && method === 'GET') {
        responseData = ReportService.getAnalyticsDeep();
      }

      // 5. SETTINGS, CATEGORIES & BACKUP/RESTORE
      else if (path === '/api/categories' && method === 'GET') {
        responseData = ReportService.getCategories();
      } else if (path === '/api/categories' && method === 'POST') {
        responseData = ReportService.createCategory(body);
      } else if (path.match(^\/api\/categories\/[^\/]+$) && method === 'DELETE') {
        const id = path.split('/')[3];
        responseData = ReportService.deleteCategory(id);
      } else if (path === '/api/settings' && method === 'GET') {
        responseData = ReportService.getSettings();
      } else if (path === '/api/settings' && method === 'PUT') {
        responseData = ReportService.updateSettings(body);
      } else if (path === '/api/backup' && method === 'GET') {
        // Simulasi backup download file JSON secara lokal di browser/APK
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ReportService.backupDB(), null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "driver_management_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        responseData = { message: 'Backup berhasil diunduh' };
      } else if (path === '/api/restore' && method === 'POST') {
        responseData = ReportService.restoreDB(body);
      }

    } catch (err) {
      console.error("API Bridge Error:", err);
      status = 500;
      responseData = { error: err.message };
    }

    // Mengembalikan objek Response standar milik fetch API
    return new Response(JSON.stringify(responseData), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
})();

// Helper Global untuk tombol Export Backup di HTML jika memakai fungsi klik langsung
function exportBackupFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ReportService.backupDB(), null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "driver_management_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
