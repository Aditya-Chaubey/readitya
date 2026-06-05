/* =========================================================
   contact.js — copy-to-clipboard channels + toast
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast');
  let toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  document.querySelectorAll('.channel').forEach((ch) => {
    ch.addEventListener('click', async () => {
      const val = ch.dataset.copy;
      const href = ch.dataset.href;
      if (val) {
        try {
          await navigator.clipboard.writeText(val);
          showToast(`copied: ${val}`);
          ch.classList.add('copied');
          const action = ch.querySelector('.caction');
          const prev = action.textContent;
          action.textContent = '✓ copied';
          setTimeout(() => { action.textContent = prev; ch.classList.remove('copied'); }, 1800);
        } catch {
          showToast('copy failed — select manually');
        }
      } else if (href) {
        window.open(href, '_blank', 'noopener');
      }
    });
  });
});
