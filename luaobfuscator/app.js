const inputCodeEl = document.getElementById('inputCode');
const outputCodeEl = document.getElementById('outputCode');
const obfuscateBtnEl = document.getElementById('obfuscateBtn');
const clearBtnEl = document.getElementById('clearBtn');
const copyBtnEl = document.getElementById('copyBtn');
const charCountEl = document.querySelector('.char-count');
const notificationEl = document.getElementById('notification');

inputCodeEl.addEventListener('input', () => {
  const charCount = inputCodeEl.value.length;
  charCountEl.textContent = charCount.toLocaleString() + ' characters';
});

obfuscateBtnEl.addEventListener('click', () => {
  const code = inputCodeEl.value.trim();

  if (!code) {
    showNotification('Enter Lua code to obfuscate', 'error');
    return;
  }

  obfuscateBtnEl.disabled = true;
  obfuscateBtnEl.textContent = '⏳ Processing...';

  setTimeout(() => {
    try {
      const obfuscated = obfuscateLua(code);
      outputCodeEl.value = obfuscated;
      showNotification('Code obfuscated successfully!', 'success');
    } catch (error) {
      showNotification('Obfuscation failed: ' + error.message, 'error');
    }

    obfuscateBtnEl.disabled = false;
    obfuscateBtnEl.innerHTML = '<span class="btn-icon">⚡</span>Obfuscate';
  }, 100);
});

clearBtnEl.addEventListener('click', () => {
  inputCodeEl.value = '';
  outputCodeEl.value = '';
  charCountEl.textContent = '0 characters';
});

copyBtnEl.addEventListener('click', () => {
  if (!outputCodeEl.value) {
    showNotification('No obfuscated code to copy', 'error');
    return;
  }

  navigator.clipboard.writeText(outputCodeEl.value).then(() => {
    showNotification('Copied to clipboard!', 'success');
  }).catch(() => {
    showNotification('Failed to copy', 'error');
  });
});

function showNotification(message, type = 'success') {
  notificationEl.textContent = message;
  notificationEl.className = `notification show ${type}`;

  setTimeout(() => {
    notificationEl.classList.remove('show');
  }, 3000);
}
