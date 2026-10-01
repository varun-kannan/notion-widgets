document.querySelectorAll('[data-folder]').forEach(button => {
  button.addEventListener('click', async () => {
    const url = new URL('./' + button.dataset.folder + '/', location.href).href;
    const status = document.getElementById('status');
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
      status.textContent = 'This is a local preview. Host the folder on HTTPS before embedding in Notion.';
      status.scrollIntoView({ block: 'center' });
      return;
    }
    try { await navigator.clipboard.writeText(url); button.textContent = 'Copied'; setTimeout(() => { button.textContent = 'Copy embed URL'; }, 1500); }
    catch { status.textContent = 'Copy this URL: ' + url; status.scrollIntoView({ block: 'center' }); }
  });
});
