// Single-<audio> player with queue, speed control, and Web Speech API fallback
import { loadState } from './store.js';

const player = new Audio();
player.preload = 'metadata';

let queueState = null; // { urls: [], texts: [], index: 0, onLineChange, onDone, timerId }
let toastFn = () => {};

export function setAudioToast(fn) {
  toastFn = fn;
}

export function stopAudio() {
  if (queueState && queueState.timerId) {
    clearTimeout(queueState.timerId);
  }
  queueState = null;
  player.pause();
  player.currentTime = 0;
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }
}

function applyRate(rate) {
  const r = rate || loadState().settings.audioRate || 1.0;
  player.playbackRate = r;
  if ('preservesPitch' in player) player.preservesPitch = true;
}

function speakFallback(text, rate = 1.0, onEnd = null) {
  if (!('speechSynthesis' in window) || !text) {
    if (onEnd) onEnd();
    return;
  }
  toastFn('Đang dùng giọng dự phòng của thiết bị');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = rate;
  const voices = window.speechSynthesis.getVoices() || [];
  const jp = voices.find((v) => v.lang.startsWith('ja') && /Kyoko|Otoya|O-Ren|Google/i.test(v.name))
    || voices.find((v) => v.lang.startsWith('ja'));
  if (jp) u.voice = jp;
  u.onend = () => { if (onEnd) onEnd(); };
  u.onerror = () => { if (onEnd) onEnd(); };
  window.speechSynthesis.speak(u);
}

export function playSingle(url, fallbackText = '', rateOverride = null) {
  stopAudio();
  const rate = rateOverride || loadState().settings.audioRate || 1.0;
  player.src = url;
  applyRate(rate);
  player.onended = null;
  player.onerror = () => speakFallback(fallbackText, rate);
  const p = player.play();
  if (p && p.catch) {
    p.catch(() => speakFallback(fallbackText, rate));
  }
}

export function startQueue({ urls, texts, startIndex = 0, rate = null, onLineChange = () => {}, onDone = () => {} }) {
  stopAudio();
  queueState = {
    urls,
    texts,
    index: startIndex,
    rate,
    paused: false,
    onLineChange,
    onDone,
    timerId: null
  };
  playQueueIndex(startIndex);
}

function playQueueIndex(idx) {
  if (!queueState) return;
  if (idx < 0 || idx >= queueState.urls.length) {
    const doneCb = queueState.onDone;
    queueState = null;
    onQueueFinish(doneCb);
    return;
  }
  queueState.index = idx;
  queueState.paused = false;
  queueState.onLineChange(idx, false);

  const url = queueState.urls[idx];
  const txt = queueState.texts[idx] || '';
  const rate = queueState.rate || loadState().settings.audioRate || 1.0;

  const advance = () => {
    if (!queueState || queueState.paused) return;
    queueState.timerId = setTimeout(() => {
      if (queueState && !queueState.paused) {
        playQueueIndex(idx + 1);
      }
    }, 400);
  };

  player.src = url;
  applyRate(rate);
  player.onended = advance;
  player.onerror = () => speakFallback(txt, rate, advance);
  const p = player.play();
  if (p && p.catch) {
    p.catch(() => speakFallback(txt, rate, advance));
  }
}

function onQueueFinish(cb) {
  if (cb) cb();
}

export function toggleQueuePause() {
  if (!queueState) return false;
  if (queueState.paused) {
    queueState.paused = false;
    queueState.onLineChange(queueState.index, false);
    const p = player.play();
    if (p && p.catch) p.catch(() => {});
    return true;
  } else {
    queueState.paused = true;
    if (queueState.timerId) clearTimeout(queueState.timerId);
    player.pause();
    queueState.onLineChange(queueState.index, true);
    return false;
  }
}

export function stepQueue(delta) {
  if (!queueState) return;
  if (queueState.timerId) clearTimeout(queueState.timerId);
  const next = Math.max(0, Math.min(queueState.urls.length - 1, queueState.index + delta));
  playQueueIndex(next);
}

export function setQueueRate(newRate) {
  if (queueState) queueState.rate = newRate;
  applyRate(newRate);
}

export async function prefetchPartAudio(partId, lessons, onProgress) {
  if (!('caches' in window)) {
    throw new Error('Trình duyệt không hỗ trợ Cache Storage.');
  }
  const cache = await caches.open('bjt-j2-audio-v1');
  const urls = [];
  for (const les of lessons) {
    for (const v of les.vocab || []) {
      urls.push(`audio/words/${v.id}.mp3`);
      if (v.exJp) urls.push(`audio/examples/${v.id}.mp3`);
    }
    for (const lr of les.listening || []) {
      (lr.lines || []).forEach((_, i) => {
        urls.push(`audio/listening/${lr.id}/${String(i + 1).padStart(2, '0')}.mp3`);
      });
    }
  }
  let done = 0;
  for (const u of urls) {
    try {
      const hit = await cache.match(u);
      if (!hit) {
        const res = await fetch(u);
        if (res.ok) await cache.put(u, res);
      }
    } catch (_) {}
    done += 1;
    onProgress(done, urls.length);
  }
  return urls.length;
}
