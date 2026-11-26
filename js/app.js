import { parseHash, navigate } from './router.js';
import { jp, t } from './i18n.js';
import { getLessonState, getTodayStr, loadState, saveState, touchStreak } from './store.js';
import { playSingle, setAudioToast, stopAudio } from './audio.js';
import { getDueCards } from './srs.js';
import { renderQuizSession } from './quiz.js';
import { renderHome } from './views/home.js';
import { renderPart } from './views/part.js';
import { renderLessonMenu } from './views/lesson.js';
import { renderVocab } from './views/vocab.js';
import { renderListening } from './views/listening.js';
import { renderReview } from './views/review.js';
import { renderProgress } from './views/progress.js';
import { renderSettings } from './views/settings.js';

const topBar = document.getElementById('top-bar');
const mainView = document.getElementById('main-view');
const tabBar = document.getElementById('tab-bar');
const toastEl = document.getElementById('toast');
const modalRoot = document.getElementById('modal-root');

const lessonCache = new Map();
let appCtx = null;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
}
setAudioToast(toast);

function applyTheme() {
  const st = loadState().settings;
  document.documentElement.setAttribute('data-theme', st.theme || 'auto');
  document.documentElement.style.setProperty('--font-scale', String(st.fontScale || 1));
}

async function loadLesson(lessonId) {
  if (lessonCache.has(lessonId)) return lessonCache.get(lessonId);
  const res = await fetch(`data/lessons/${lessonId}.json`);
  if (!res.ok) throw new Error(`Không tải được ${lessonId}`);
  const data = await res.json();
  lessonCache.set(lessonId, data);
  return data;
}

function openVocabModal(vocabId) {
  const v = appCtx?.vocabMap.get(vocabId);
  if (!v) return;
  modalRoot.hidden = false;
  modalRoot.innerHTML = `
    <div class="modal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="pill">${v.id}</span>
        <button class="btn-secondary" id="close-modal" style="min-height:44px;min-width:44px;">${t('close')}</button>
      </div>
      <div style="text-align:center;margin:14px 0;">
        <div class="word-jp">${jp(v.word)}</div>
        ${v.reading ? `<div class="reading-jp">${jp(v.reading)}</div>` : ''}
        <div class="meaning-vi" style="margin:6px 0;">${jp(v.meaning)}</div>
        <button class="btn-audio-sm" id="modal-audio" aria-label="Nghe">🔊</button>
      </div>
      ${v.exJp ? `<div class="doc-quote"><strong>${jp(v.exJp)}</strong><br><span class="muted">${jp(v.exVi)}</span></div>` : ''}
      ${v.tip ? `<div class="muted">💡 ${jp(v.tip)}</div>` : ''}
    </div>
  `;
  modalRoot.querySelector('#close-modal').onclick = () => { modalRoot.hidden = true; };
  modalRoot.onclick = (e) => { if (e.target === modalRoot) modalRoot.hidden = true; };
  modalRoot.querySelector('#modal-audio').onclick = () => playSingle(`audio/words/${v.id}.mp3`, v.reading || v.word);
}

function renderTopBar(title, backHash = null) {
  const streak = loadState().streak.count || 0;
  topBar.innerHTML = `
    <div class="top-bar-left">
      ${backHash ? `<button class="btn-back" id="btn-back" aria-label="Quay lại">←</button>` : ''}
      <div class="top-title">${title}</div>
    </div>
    <div class="streak-pill" title="Chuỗi ngày học">🔥 ${streak}</div>
  `;
  if (backHash) {
    topBar.querySelector('#btn-back').onclick = () => {
      stopAudio();
      navigate(backHash);
    };
  }
}

function renderTabBar(activeRoute) {
  const dueCount = getDueCards(appCtx.pool.vocab).length;
  const isJa = loadState().settings.lang === 'ja';
  const tabs = [
    { id: 'home', label: t('tab_home'), jp: '学習' },
    { id: 'review', label: t('tab_review'), jp: '復習', badge: dueCount },
    { id: 'progress', label: t('tab_progress'), jp: '進捗' },
    { id: 'settings', label: t('tab_settings'), jp: '設定' }
  ];
  tabBar.innerHTML = tabs.map((tab) => `
    <button class="tab-btn ${activeRoute === tab.id ? 'active' : ''}" data-tab="${tab.id}">
      <span>${tab.label}</span>
      ${isJa ? '' : `<span class="tab-jp">${tab.jp}</span>`}
      ${tab.badge > 0 ? `<span class="tab-badge">${tab.badge}</span>` : ''}
    </button>
  `).join('');
  tabBar.querySelectorAll('[data-tab]').forEach((b) => {
    b.onclick = () => {
      stopAudio();
      navigate(`#/${b.dataset.tab}`);
    };
  });
}

async function routeView() {
  stopAudio();
  const { route, param1, param2 } = parseHash();
  const tabKey = ['review', 'progress', 'settings'].includes(route) ? route : 'home';
  renderTabBar(tabKey);

  try {
    if (route === 'home') {
      renderTopBar('BJT J2');
      renderHome(mainView, appCtx);
    } else if (route === 'part') {
      renderTopBar(param1, '#/home');
      renderPart(mainView, appCtx, param1);
    } else if (route === 'lesson') {
      const lesson = await loadLesson(param1);
      renderTopBar(param1, `#/part/${lesson.part}`);
      renderLessonMenu(mainView, appCtx, param1, lesson);
    } else if (route === 'vocab') {
      const lesson = await loadLesson(param1);
      renderTopBar(`Từ vựng · ${param1}`, `#/lesson/${param1}`);
      renderVocab(mainView, appCtx, param1, lesson);
    } else if (route === 'quiz') {
      const lesson = await loadLesson(param1);
      renderTopBar(`Quiz · ${param1}`, `#/lesson/${param1}`);
      renderQuizSession({
        container: mainView,
        items: lesson.vocabQuiz.items,
        title: `Quiz từ vựng ${param1}`,
        passAt: lesson.vocabQuiz.passAt,
        immediateFeedback: true,
        shuffleItems: true,
        vocabMap: appCtx.vocabMap,
        onOpenVocab: openVocabModal,
        onComplete: ({ score, total, passed }) => {
          touchStreak();
          const s = loadState();
          const lp = getLessonState(param1);
          lp.quizBest = Math.max(lp.quizBest || 0, score);
          if (passed) lp.quizPassed = true;
          s.quizHistory.unshift({ lessonId: param1, date: getTodayStr(), score, total, passed });
          s.quizHistory = s.quizHistory.slice(0, 50);
          saveState();
        },
        onExit: () => navigate(`#/lesson/${param1}`)
      });
    } else if (route === 'listening') {
      const lesson = await loadLesson(param1);
      renderTopBar(`Nghe · ${param1}`, `#/lesson/${param1}`);
      renderListening(mainView, appCtx, param1, lesson, param2 || 0);
    } else if (route === 'practice') {
      const lesson = await loadLesson(param1);
      renderTopBar(`Thực chiến · ${param1}`, `#/lesson/${param1}`);
      if (param2 === 'notes') {
        mainView.innerHTML = `
          <div class="card">
            <strong>Điểm cần nhớ nhanh (${param1})</strong>
            <ul style="padding-left:18px;margin:10px 0 0;">
              ${(lesson.notes || []).map((n) => `<li style="margin-bottom:8px;">${n}</li>`).join('')}
            </ul>
          </div>
          <button class="btn-primary" id="notes-back">Quay lại bài học</button>
        `;
        mainView.querySelector('#notes-back').onclick = () => navigate(`#/lesson/${param1}`);
      } else if (param2 === 'reading') {
        const rd = lesson.reading[0];
        if (!rd) { mainView.innerHTML = `<div class="card">Không có bài đọc.</div>`; return; }
        mainView.innerHTML = `
          <details class="card" open>
            <summary style="font-weight:700;cursor:pointer;">📄 ${rd.title} (chạm để thu gọn)</summary>
            <div style="margin-top:10px;line-height:1.65;">${rd.passageHtml}</div>
          </details>
          <div id="rd-quiz-slot"></div>
        `;
        renderQuizSession({
          container: mainView.querySelector('#rd-quiz-slot'),
          items: rd.questions,
          title: 'Đọc hiểu',
          immediateFeedback: !lesson.isTest,
          shuffleItems: false,
          vocabMap: appCtx.vocabMap,
          onOpenVocab: openVocabModal,
          onComplete: ({ passed }) => {
            touchStreak();
            const lp = getLessonState(param1);
            lp.practiceDone = lp.practiceDone || {};
            lp.practiceDone.reading = passed;
            saveState();
          },
          onExit: () => navigate(`#/lesson/${param1}`)
        });
      } else {
        const map = { expr: lesson.expression, grammar: lesson.grammar, depict: lesson.depiction };
        const items = map[param2] || [];
        renderQuizSession({
          container: mainView,
          items,
          title: `${param1} · ${param2}`,
          immediateFeedback: !lesson.isTest,
          shuffleItems: !lesson.isTest,
          vocabMap: appCtx.vocabMap,
          onOpenVocab: openVocabModal,
          onComplete: ({ passed }) => {
            touchStreak();
            const lp = getLessonState(param1);
            lp.practiceDone = lp.practiceDone || {};
            lp.practiceDone[param2] = passed;
            saveState();
          },
          onExit: () => navigate(`#/lesson/${param1}`)
        });
      }
    } else if (route === 'review') {
      renderTopBar(t('title_review'));
      renderReview(mainView, appCtx);
    } else if (route === 'progress') {
      renderTopBar(t('title_progress'));
      renderProgress(mainView, appCtx);
    } else if (route === 'settings') {
      renderTopBar(t('title_settings'));
      renderSettings(mainView, appCtx);
    } else {
      navigate('#/home');
    }
  } catch (err) {
    mainView.innerHTML = `
      <div class="card">
        <strong>Đã có lỗi xảy ra</strong>
        <div class="muted" style="margin:6px 0 12px;">${err.message}</div>
        <button class="btn-primary" onclick="location.hash='#/home'">Về trang chủ</button>
      </div>
    `;
  }
}

async function init() {
  applyTheme();
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch (_) {}
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
  try {
    const [indexRes, poolRes] = await Promise.all([
      fetch('data/index.json'),
      fetch('data/review-pool.json')
    ]);
    const index = await indexRes.json();
    const pool = await poolRes.json();
    const vocabMap = new Map((pool.vocab || []).map((v) => [v.id, v]));
    appCtx = { index, pool, vocabMap, loadLesson, openVocabModal, toast, applyTheme };
    window.addEventListener('hashchange', routeView);
    routeView();
  } catch (err) {
    mainView.innerHTML = `
      <div class="card">
        <strong>Không tải được dữ liệu</strong>
        <div class="muted" style="margin:6px 0;">Hãy chạy <code>python tools/parse_md.py</code> và mở qua HTTP server (không mở trực tiếp bằng file://).</div>
      </div>
    `;
  }
}

init();
