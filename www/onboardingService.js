// onboardingService.js - Modul Splash Screen & Onboarding Data Pengguna
const OnboardingService = {
  init() {
    this.injectStyles();
    this.showSplashScreen();
  },

  // 1. Splash Screen Professional (2-3 detik, background hijau tema, fade out halus)
  showSplashScreen() {
    const splash = document.createElement('div');
    splash.id = 'app-splash-screen';
    splash.innerHTML = `
      <div class="splash-content">
        <div class="splash-logo-icon">🏍️</div>
        <h1>Driver Management</h1>
        <p>Created by Gaska</p>
      </div>
    `;
    document.body.appendChild(splash);

    // Durasi 2.5 detik lalu hilangkan dengan efek fade out
    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
        this.checkOnboardingStatus();
      }, 400); // Waktu transisi fade out
    }, 2500);
  },

  // 2. Cek apakah pengguna sudah pernah mengisi data onboarding
  checkOnboardingStatus() {
    try {
      const db = DBService.readDB();
      if (!db.settings || !db.settings.onboardingCompleted) {
        this.showOnboardingModal();
      }
    } catch(e) {
      // Fallback jika DB belum siap
      this.showOnboardingModal();
    }
  },

  // 3. Tampilan Halaman Onboarding & Data Pengguna
  showOnboardingModal() {
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-header">
          <h2>Selamat Datang, Driver! 🚀</h2>
          <p>Personalisasi profil Anda agar Dashboard bekerja secara optimal.</p>
        </div>
        
        <div class="onboarding-body">
          <form id="onboarding-form">
            <!-- Identitas -->
            <div class="form-group">
              <label>Nama Panggilan</label>
              <input type="text" id="ob-name" placeholder="Contoh: Gaska" required value="Gaska">
            </div>

            <!-- Kendaraan -->
            <div class="form-row">
              <div class="form-group">
                <label>Jenis Kendaraan</label>
                <select id="ob-vehicle-type">
                  <option value="Motor">Motor</option>
                  <option value="Mobil">Mobil</option>
                </select>
              </div>
              <div class="form-group">
                <label>Plat Nomor</label>
                <input type="text" id="ob-plate" placeholder="B 1234 XYZ">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Merk & Tipe Kendaraan</label>
                <input type="text" id="ob-vehicle-model" placeholder="Contoh: Honda Beat / Vario">
              </div>
              <div class="form-group">
                <label>Tahun (Opsional)</label>
                <input type="number" id="ob-vehicle-year" placeholder="2023">
              </div>
            </div>

            <!-- Status Pekerjaan -->
            <div class="form-group">
              <label>Apakah Anda seorang driver online?</label>
              <div class="radio-group">
                <label><input type="radio" name="isOnlineDriver" value="yes" checked onchange="document.getElementById('platform-section').style.display='block'"> Ya</label>
                <label><input type="radio" name="isOnlineDriver" value="no" onchange="document.getElementById('platform-section').style.display='none'"> Tidak</label>
              </div>
            </div>

            <!-- Pilihan Platform -->
            <div class="form-group" id="platform-section">
              <label>Pilih Platform (Bisa lebih dari satu)</label>
              <div class="checkbox-grid">
                <label><input type="checkbox" name="platform" value="Grab"> Grab</label>
                <label><input type="checkbox" name="platform" value="Gojek"> Gojek</label>
                <label><input type="checkbox" name="platform" value="Maxim"> Maxim</label>
                <label><input type="checkbox" name="platform" value="ShopeeFood"> ShopeeFood</label>
                <label><input type="checkbox" name="platform" value="inDrive"> inDrive</label>
                <label><input type="checkbox" name="platform" value="Lalamove"> Lalamove</label>
                <label><input type="checkbox" name="platform" value="Borzo"> Borzo</label>
                <label><input type="checkbox" name="platform" value="Deliveree"> Deliveree</label>
                <label><input type="checkbox" name="platform" value="Lainnya"> Lainnya</label>
              </div>
            </div>

            <!-- Tujuan Mengemudi -->
            <div class="form-group">
              <label>Tujuan Mengemudi</label>
              <select id="ob-driving-purpose">
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Penghasilan Tambahan">Penghasilan Tambahan</option>
                <option value="Mengisi Waktu Luang">Mengisi Waktu Luang</option>
              </select>
            </div>

            <button type="submit" class="ob-submit-btn">Simpan & Mulai Bekerja</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('onboarding-form').onsubmit = (e) => {
      e.preventDefault();
      this.saveOnboardingData();
    };
  },

  // 4. Simpan Data Onboarding ke Database Lokal
  saveOnboardingData() {
    const name = document.getElementById('ob-name').value;
    const vehicleType = document.getElementById('ob-vehicle-type').value;
    const plate = document.getElementById('ob-plate').value;
    const model = document.getElementById('ob-vehicle-model').value;
    const year = document.getElementById('ob-vehicle-year').value;
    
    const isOnline = document.querySelector('input[name="isOnlineDriver"]:checked').value === 'yes';
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(el => el.value);
    const purpose = document.getElementById('ob-driving-purpose').value;

    try {
      const db = DBService.readDB();
      if (!db.settings) db.settings = {};
      
      db.settings.username = name || "Gaska";
      db.settings.userProfile = {
        name, vehicleType, plate, model, year, isOnline, selectedPlatforms, purpose,
        onboardingCompleted: true
      };
      db.settings.onboardingCompleted = true;

      DBService.writeDB(db);
      
      const overlay = document.getElementById('onboarding-overlay');
      if (overlay) overlay.remove();
      
      // Refresh halaman atau dashboard agar data langsung tampil
      window.location.reload();
    } catch(err) {
      alert("Gagal menyimpan data onboarding: " + err.message);
    }
  },

  // Styling CSS untuk Splash & Onboarding
  injectStyles() {
    if (document.getElementById('onboarding-styles')) return;
    const style = document.createElement('style');
    style.id = 'onboarding-styles';
    style.innerHTML = `
      #app-splash-screen {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: #10B981; /* Hijau premium tema aplikasi */
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        transition: opacity 0.4s ease-out;
        color: #ffffff;
        font-family: inherit;
      }
      .splash-logo-icon {
        font-size: 64px;
        margin-bottom: 16px;
        animation: bounceSplash 1s infinite alternate;
      }
      .splash-content h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }
      .splash-content p {
        margin: 8px 0 0 0;
        font-size: 14px;
        opacity: 0.9;
      }
      @keyframes bounceSplash {
        from { transform: translateY(0); }
        to { transform: translateY(-10px); }
      }

      #onboarding-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999998;
        padding: 16px;
        box-sizing: border-box;
        overflow-y: auto;
      }
      .onboarding-card {
        background: #ffffff;
        width: 100%;
        max-width: 480px;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        max-height: 90vh;
        overflow-y: auto;
      }
      .onboarding-header h2 {
        margin: 0 0 6px 0;
        font-size: 20px;
        color: #111827;
      }
      .onboarding-header p {
        margin: 0 0 20px 0;
        font-size: 13px;
        color: #6B7280;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .form-group label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
      }
      .form-group input[type="text"],
      .form-group input[type="number"],
      .form-group select {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #D1D5DB;
        border-radius: 10px;
        font-size: 14px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
      }
      .form-group input:focus, .form-group select:focus {
        border-color: #10B981;
      }
      .form-row {
        display: flex;
        gap: 12px;
      }
      .form-row .form-group {
        flex: 1;
      }
      .radio-group {
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #374151;
      }
      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        background: #F9FAFB;
        padding: 12px;
        border-radius: 10px;
        border: 1px solid #E5E7EB;
      }
      .checkbox-grid label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: normal;
        font-size: 13px;
        cursor: pointer;
      }
      .ob-submit-btn {
        width: 100%;
        background: #10B981;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        transition: background 0.2s;
      }
      .ob-submit-btn:active {
        background: #059669;
      }
    `;
    document.head.appendChild(style);
  }
};

// Auto-inisialisasi saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  OnboardingService.init();
});
