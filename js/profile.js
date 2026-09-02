const PROFILE_VERSION = 1;

function newProfile() {
  return {
    version: PROFILE_VERSION,
    unlockedProfessionIds: Object.keys(PROFESSIONS),
    records: {}
  };
}

function normalizeProfile(saved) {
  const profile = saved && typeof saved === 'object' ? saved : newProfile();
  const unlocked = Array.isArray(profile.unlockedProfessionIds) ? profile.unlockedProfessionIds : [];
  profile.version = PROFILE_VERSION;
  profile.unlockedProfessionIds = [...new Set([...Object.keys(PROFESSIONS), ...unlocked.filter(id => PROFESSIONS[id])])];
  profile.records = profile.records && typeof profile.records === 'object' ? profile.records : {};
  Object.keys(profile.records).forEach(id => {
    if (!PROFESSIONS[id]) {
      delete profile.records[id];
      return;
    }
    const record = profile.records[id] || {};
    profile.records[id] = {
      runs: Math.max(0, Math.floor(Number(record.runs) || 0)),
      wins: Math.max(0, Math.floor(Number(record.wins) || 0)),
      bestNetWorth: Math.max(0, Number(record.bestNetWorth) || 0)
    };
  });
  return profile;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(CONFIG.PROFILE_SAVE_KEY);
    return normalizeProfile(raw ? JSON.parse(raw) : null);
  } catch (e) {
    return newProfile();
  }
}

function saveProfile(profile) {
  const normalized = normalizeProfile(profile);
  try { localStorage.setItem(CONFIG.PROFILE_SAVE_KEY, JSON.stringify(normalized)); } catch (e) {}
  return normalized;
}

function unlockEligibleProfessions(progress) {
  const profile = loadProfile();
  let changed = false;
  Object.values(PROFESSIONS).forEach(profession => {
    if (!profession.unlock || profile.unlockedProfessionIds.includes(profession.id)) return;
    if ((Number(progress && progress.peakNetWorth) || 0) >= profession.unlock.peakNetWorth) {
      profile.unlockedProfessionIds.push(profession.id);
      changed = true;
    }
  });
  if (changed) saveProfile(profile);
  return profile;
}

function recordRunResult(result) {
  const profile = loadProfile();
  const professionId = normalizeProfessionId(result && result.professionId);
  const previous = profile.records[professionId] || { runs: 0, wins: 0, bestNetWorth: 0 };
  const finalNetWorth = Math.max(0, Number(result && result.finalNetWorth) || 0);
  profile.records[professionId] = {
    runs: previous.runs + 1,
    wins: previous.wins + (result && result.survived ? 1 : 0),
    bestNetWorth: Math.max(previous.bestNetWorth, finalNetWorth)
  };
  const saved = saveProfile(profile);
  return unlockEligibleProfessions({ peakNetWorth: result && result.peakNetWorth });
}
