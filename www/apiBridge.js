(function() {
  const originalFetch = window.fetch;

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
        console.log(`[Bridge] 2. Payload Body terbaca:`, body);
      } catch(e) { 
        console.error(`[Bridge] 2. Gagal parse body! Error:`, e);
      }
    }

    let responseData = { error: 'Endpoint tidak ditemukan' };
    let status = 404;

    try {
      if (path === '/api/transactions' && method === 'POST') {
        console.log("[Bridge] 3. Rute cocok -> Meneruskan ke TransactionService.createTransaction()");
        status = 200;
        responseData = TransactionService.createTransaction(body);
      } 
      // (Tambahkan pencocokan rute lainnya di sini seperti kode sebelumnya)
      // else if (path === '/api/accounts' && method === 'GET') { ... }

      console.log(`[Bridge] 4. Eksekusi Service sukses. Data yang akan dikembalikan:`, responseData);

    } catch (err) {
      console.error("[Bridge] X. FATAL ERROR saat eksekusi service:", err);
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
