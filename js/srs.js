// Leitner 5-box Spaced Repetition System
import { loadState, saveState, getTodayStr } from './store.js';
import { addDaysLocal } from './date.js';

export const BOX_INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
};

export function ensureCard(vocabId) {
  const s = loadState();
  if (!s.srs[vocabId]) {
    s.srs[vocabId] = {
      id: vocabId,
      box: 1,
      due: addDaysLocal(getTodayStr(), 1),
      lapses: 0,
      streakOk: 0,
      hard: false
    };
    saveState();
  }
  return s.srs[vocabId];
}

export function addToBox1(vocabId) {
  const s = loadState();
  const prev = s.srs[vocabId];
  s.srs[vocabId] = {
    id: vocabId,
    box: 1,
    due: getTodayStr(),
    lapses: prev ? prev.lapses : 0,
    streakOk: 0,
    hard: prev ? prev.hard : false
  };
  saveState();
}

export function gradeCard(vocabId, isCorrect) {
  const card = ensureCard(vocabId);
  const today = getTodayStr();
  if (isCorrect) {
    card.box = Math.min(5, (card.box || 1) + 1);
    card.streakOk = (card.streakOk || 0) + 1;
    if (card.hard && card.streakOk >= 2) {
      card.hard = false;
    }
    card.due = addDaysLocal(today, BOX_INTERVALS[card.box]);
  } else {
    card.box = 1;
    card.lapses = (card.lapses || 0) + 1;
    card.streakOk = 0;
    if (card.lapses >= 2) {
      card.hard = true;
    }
    card.due = addDaysLocal(today, 1);
  }
  saveState();
  return card;
}

export function getDueCards(poolVocab) {
  const s = loadState();
  const today = getTodayStr();
  const byId = new Map(poolVocab.map((v) => [v.id, v]));
  const due = [];
  for (const card of Object.values(s.srs)) {
    if (!byId.has(card.id)) continue;
    if (card.hard || card.due <= today) {
      due.push({ card, vocab: byId.get(card.id) });
    }
  }
  // Hard cards first, then lowest box
  due.sort((a, b) => (b.card.hard - a.card.hard) || (a.card.box - b.card.box));
  return due.slice(0, 33); // max 25 due + 8 hard per session
}

export function getBoxCounts() {
  const s = loadState();
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, hard: 0, total: 0 };
  for (const c of Object.values(s.srs)) {
    const b = Math.min(5, Math.max(1, c.box || 1));
    counts[b] += 1;
    counts.total += 1;
    if (c.hard) counts.hard += 1;
  }
  return counts;
}
