const PWA = {
  init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }

    // Install prompt
    let deferred;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferred = e;
      const btn = document.getElementById('installBtn');
      btn.classList.remove('hidden');
      btn.onclick = async () => {
        btn.classList.add('hidden');
        deferred.prompt();
        await deferred.userChoice;
      };
    });

    // Persistent storage
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    // Wake lock during typing
    document.addEventListener('focusin', async () => {
      try {
        if ('wakeLock' in navigator && document.getElementById('view-practice').classList.contains('active')) {
          this._wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {}
    });

    // Update toast
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data === 'update-available') {
          const t = document.getElementById('toast');
          t.innerHTML = '🆕 Update available! <button id="reloadBtn">Reload</button>';
          t.classList.remove('hidden');
          document.getElementById('reloadBtn').onclick = () => location.reload();
        }
      });
    }

    // Drag-and-drop .txt
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        App.currentText = r.result.slice(0, 5000);
        document.querySelector('.nav-btn[data-view="practice"]').click();
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.mode-btn[data-mode="custom"]').classList.add('active');
        setTimeout(() => App.startSession(true), 50);
        App.toast('Text loaded from file');
      };
      r.readAsText(f);
    });

    // Badge
    if ('setAppBadge' in navigator) {
      const streak = Store.get('streak', 0);
      if (streak > 0) navigator.setAppBadge(streak).catch(() => {});
    }
  }
};
document.addEventListener('DOMContentLoaded', () => PWA.init());