// modalService.js - Modul Custom Modal & Bottom Sheet Pengganti Alert Bawaan Android
const ModalService = {
  // Menampilkan Modal Konfirmasi (Pengganti confirm() bawaan)
  showConfirm(title, message, onConfirm, onCancel) {
    this.createModalContainer();
    const overlay = document.getElementById('custom-modal-overlay');
    
    overlay.innerHTML = `
      <div class="custom-modal-box">
        <div class="custom-modal-header">
          <h3>${title}</h3>
        </div>
        <div class="custom-modal-body">
          <p>${message}</p>
        </div>
        <div class="custom-modal-footer">
          <button id="modal-btn-cancel" class="custom-modal-btn secondary">${I18nService ? I18nService.t('cancel') : 'Batal'}</button>
          <button id="modal-btn-ok" class="custom-modal-btn primary">${I18nService ? I18nService.t('save') : 'Ya'}</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('modal-btn-ok').onclick = () => {
      this.closeModal();
      if (typeof onConfirm === 'function') onConfirm();
    };

    document.getElementById('modal-btn-cancel').onclick = () => {
      this.closeModal();
      if (typeof onCancel === 'function') onCancel();
    };
  },

  // Menampilkan Alert Pesan (Pengganti alert() bawaan)
  showAlert(title, message, onClose) {
    this.createModalContainer();
    const overlay = document.getElementById('custom-modal-overlay');
    
    overlay.innerHTML = `
      <div class="custom-modal-box">
        <div class="custom-modal-header">
          <h3>${title}</h3>
        </div>
        <div class="custom-modal-body">
          <p>${message}</p>
        </div>
        <div class="custom-modal-footer center">
          <button id="modal-btn-ok" class="custom-modal-btn primary full">OK</button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('modal-btn-ok').onclick = () => {
      this.closeModal();
      if (typeof onClose === 'function') onClose();
    };
  },

  // Menutup modal
  closeModal() {
    const overlay = document.getElementById('custom-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
  },

  // Injeksi elemen dasar overlay modal ke dalam body secara otomatis jika belum ada
  createModalContainer() {
    if (document.getElementById('custom-modal-overlay')) return;

    // Tambahkan style CSS kustom untuk modal modern rounded & shadow
    const style = document.createElement('style');
    style.innerHTML = `
      #custom-modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(3px);
        display: none;
        justify-content: center;
        align-items: flex-end; /* Efek bottom sheet modern di mobile */
        z-index: 99999;
        animation: fadeInModal 0.2s ease-out;
      }
      .custom-modal-box {
        background: #ffffff;
        width: 100%;
        max-width: 500px;
        border-top-left-radius: 24px;
        border-top-right-radius: 24px;
        padding: 24px;
        box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
        animation: slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .custom-modal-header h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }
      .custom-modal-body p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #4B5563;
        line-height: 1.5;
      }
      .custom-modal-footer {
        display: flex;
        gap: 12px;
      }
      .custom-modal-footer.center {
        justify-content: center;
      }
      .custom-modal-btn {
        flex: 1;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: background 0.2s;
      }
      .custom-modal-btn.primary {
        background: #10B981; /* Hijau tema aplikasi */
        color: #ffffff;
      }
      .custom-modal-btn.primary:active {
        background: #059669;
      }
      .custom-modal-btn.secondary {
        background: #F3F4F6;
        color: #374151;
      }
      .custom-modal-btn.full {
        width: 100%;
      }
      @keyframes fadeInModal {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUpModal {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    const overlayDiv = document.createElement('div');
    overlayDiv.id = 'custom-modal-overlay';
    document.body.appendChild(overlayDiv);
  }
};
