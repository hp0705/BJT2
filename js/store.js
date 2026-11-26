// LocalStorage state manager (bjt.v1) with safe try/catch fallback
const STORAGE_KEY = 'bjt.v1';

const DEFAULT_STATE = {
  version: 1,
  settings: {
    lang: 'vi',    // 'vi' | 'ja'
    theme: 'auto', // 'auto' | 'light' | 'dark'
    fontScale: 1,  // 0.9 | 1 | 1.15
    audioRate: 1.0,
    autoPlayAfterAnswer: false,
    showReadingOnCard: true,
    unlockAll: false
  },
  streak: { count: 0, lastDate: null },
  lastBackupAt: null,
  iosHintDismissed: false,
  lessonProgress: {}, // { [lessonId]: { vocabDone: bool, quizBest: number, quizPassed: bool, practiceDone: {...} } }
  quizHistory: [],    // [{ lessonId, date, score, total, passed }]
  srs: {},            // { [vocabId]: { id, box, due, lapses, streakOk, hard } }
  errors: {
    tagCounts: {},    // { [tag]: number }
    recentWrong: []   // [{ id, lessonId, tags, date }]
  }
};

let memoryState = null;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadState() {
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryState = {
        ...clone(DEFAULT_STATE),
        ...parsed,
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
        streak: { ...DEFAULT_STATE.streak, ...(parsed.streak || {}) },
        errors: { ...DEFAULT_STATE.errors, ...(parsed.errors || {}) }
      };
      return memoryState;
    }
  } catch (_) {}
  memoryState = clone(DEFAULT_STATE);
  return memoryState;
}

export function saveState() {
  const s = loadState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (_) {}
}

export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function touchStreak() {
  const s = loadState();
  const today = getTodayStr();
  if (s.streak.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.streak.count = s.streak.lastDate === yesterday ? (s.streak.count || 0) + 1 : 1;
  s.streak.lastDate = today;
  saveState();
}

export function getLessonState(lessonId) {
  const s = loadState();
  if (!s.lessonProgress[lessonId]) {
    s.lessonProgress[lessonId] = {
      vocabDone: false,
      quizBest: 0,
      quizPassed: false,
      practiceDone: {}
    };
  }
  return s.lessonProgress[lessonId];
}

export function recordError(q) {
  const s = loadState();
  const tags = q.tags && q.tags.length ? q.tags : ['GUESS'];
  for (const t of tags) {
    s.errors.tagCounts[t] = (s.errors.tagCounts[t] || 0) + 1;
  }
  s.errors.recentWrong = [
    { id: q.id, lessonId: q.lessonId || '', tags, date: getTodayStr() },
    ...s.errors.recentWrong.filter((x) => x.id !== q.id)
  ].slice(0, 80);
  saveState();
}

export function exportJson() {
  const s = loadState();
  s.lastBackupAt = new Date().toISOString();
  saveState();
  return JSON.stringify(s, null, 2);
}

export function importJson(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object' || !parsed.settings) {
    throw new Error('File JSON không hợp lệ.');
  }
  memoryState = {
    ...clone(DEFAULT_STATE),
    ...parsed,
    settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) }
  };
  saveState();
  return memoryState;
}

export function resetAllData() {
  memoryState = clone(DEFAULT_STATE);
  saveState();
}

export function needsBackupReminder() {
  const s = loadState();
  if (!s.quizHistory.length && !Object.keys(s.srs).length) return false;
  if (!s.lastBackupAt) return true;
  const days = (Date.now() - new Date(s.lastBackupAt).getTime()) / 86400000;
  return days >= 7;
}
