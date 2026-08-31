// ==================== 存档 ====================
function save() {
  try {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch (e) {}
}

