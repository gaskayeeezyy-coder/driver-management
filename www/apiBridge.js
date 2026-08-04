// apiBridge.js - Jembatan Offline (Versi Lengkap + Log Tracing)
(function() {
  const originalFetch = window.fetch;

  function parseUrl(url) {
    let cleanUrl = url;
    try {
      const parsedObj = new URL(url, window.location.origin);
      cleanUrl = parsedObj.pathname + parsedObj.search;
    } catch(e) {}

    const [path, search] = cleanUrl.split('?');
    const query = {};
    if (search) {
      search.split('&').forEach(param => {
        const [key, val] = param.split('=');
        query[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
    }
    return { path, query };
  }

  window.fetch = async function(input, init = {}) {
    let url = typeof input === 'string' ? input : input.url;

    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
    const { path, query } = parseUrl(url);
    
    console.log(`\n=========================================`);
    console.log(`[Bridge] 1. Intercept ${method} request ke: ${path}`);

    let body = null;
    if (init && init.body) {
      try { 
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body; 
        console.log(`[Bridge] 2. Payload Body terbaca`);
      } catch(e) { }
    }

    let responseData = { error: 'Endpoint tidak ditemukan' };
    let status = 404;

    try {
      // 1. TRANSACTIONS
      if (path === '/api/transactions' && method === 'GET') {
        console.log("[Bridge] 3. Rute cocok -> TransactionService.getTransactions");
        status = 200; responseData = TransactionService.getTransactions(query);
      } else if (path === '/api/transactions' && method === 'POST') {
        console.log("[Bridge] 3. Rute cocok -> TransactionService.createTransaction");
        status = 200; responseData = TransactionService.createTransaction(body);
      } else if (path.match(/^\/api\/transactions\/[^\/]+$/) && method === 'GET') {
        const id = path.split('/')[3];
        status = 200; responseData = TransactionService.getTransactionById(id);
      } else if (path.match(/^\/api\/transactions\/[^\/]+$/) && method === 'PUT') {
        const id = path.split('/')[3];
        status = 200; responseData = TransactionService.updateTransaction(id, body);
      } else if (path.match(/^\/api\/transactions\/[^\/]+$/) && method === 'DELETE') {
        const id = path.split('/')[3];
        status = 200; responseData = TransactionService.deleteTransaction(id);
      }

      // 2. ACCOUNTS
      else if (path === '/api/accounts' && method === 'GET') {
        console.log("[Bridge] 3. Rute cocok -> AccountService.getAccounts");
        status = 200; responseData = AccountService.getAccounts();
      } else if (path === '/api/accounts' && method === 'POST') {
        status = 200; responseData = AccountService.createAccount(body);
      } else if (path.match(/^\/api\/accounts\/[^\/]+$/) && method === 'GET') {
        const id = path.split('/')[3];
        status = 200; responseData = AccountService.getAccountById(id);
      } else if (path.match(/^\/api\/accounts\/[^\/]+$/) && method === 'PUT') {
        const id = path.split('/')[3];
        status = 200; responseData = AccountService.updateAccount(id, body);
      }

      // 3. GOALS & TARGETS & SUMMARY
      else if (path === '/api/goals' && method === 'GET') {
        status = 200; responseData = GoalService.getGoals();
      } else if (path === '/api/goals' && method === 'POST') {
        status = 200; responseData = GoalService.createGoal(body);
      } else if (path.match(/^\/api\/goals\/[^\/]+$/) && method === 'PUT') {
        const id = path.split('/')[3];
        status = 200; responseData = GoalService.updateGoal(id, body);
      } else if (path.match(/^\/api\/goals\/[^\/]+$/) && method === 'DELETE') {
        const id = path.split('/')[3];
        status = 200; responseData = GoalService.deleteGoal(id);
      } else if (path === '/api/summary' && method === 'GET') {
        status = 200; responseData = GoalService.getSummary();
      } else if (path === '/api/target' && method === 'POST') {
        status = 200; responseData = GoalService.updateDailyTarget(body);
      }

      // 4. REPORTS, DRIVER DASHBOARD, TUTUP BUKU & AI ANALYTICS
      else if (path === '/api/financial-report' && method === 'GET') {
        console.log("[Bridge] 3. Rute cocok -> ReportService.getFinancialReport");
        status = 200; responseData = ReportService.getFinancialReport(query);
      } else if (path === '/api/driver-dashboard' && method === 'GET') {
        console.log("[Bridge] 3. Rute cocok -> ReportService.getDriverDashboard");
        status = 200; responseData = ReportService.getDriverDashboard();
      } else if (path === '/api/tutup-buku' && method === 'POST') {
        status = 200; responseData = ReportService.processTutupBuku();
      } else if (path === '/api/tutup-buku' && method === 'GET') {
        status = 200; responseData = ReportService.getDailyArchives();
      } else if (path === '/api/analytics-deep' && method === 'GET') {
        status = 200; responseData = ReportService.getAnalyticsDeep();
      }

      // 5. SETTINGS & CATEGORIES
      else if (path === '/api/categories' && method === 'GET') {
        status = 200; responseData = ReportService.getCategories();
      } else if (path === '/api/categories' && method === 'POST') {
        status = 200; responseData = ReportService.createCategory(body);
      } else if (path.match(/^\/api\/categories\/[^\/]+$/) && method === 'DELETE') {
        const id = path.split('/')[3];
        status = 200; responseData = ReportService.deleteCategory(id);
      } else if (path === '/api/settings' && method === 'GET') {
        status = 200; responseData = ReportService.getSettings();
      } else if (path === '/api/settings' && method === 'PUT') {
        status = 200; responseData = ReportService.updateSettings(body);
      } else if (path === '/api/changelog' && method === 'GET') {
        status = 200; 
        responseData = ReportService.getChangeLog();
      }

      console.log(`[Bridge] 4. Eksekusi Service sukses.`);

    } catch (err) {
      console.error("[Bridge] X. ERROR saat eksekusi service:", err);
      status = 500;
      responseData = { error: err.message };
    }

    console.log(`[Bridge] 5. Return Response ke UI (Status: ${status})`);
    console.log(`=========================================\n`);

    return new Response(JSON.stringify(responseData), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
})();
