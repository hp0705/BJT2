import { startQueue, toggleQueuePause, stepQueue, setQueueRate, stopAudio } from '../audio.js';
import { renderQuizSession } from '../quiz.js';
import { getLessonState, loadState, saveState, touchStreak } from '../store.js';
import { navigate } from '../router.js';
import { t } from '../i18n.js';

export function renderListening(container, ctx, lessonId, lesson, lrIndex = 0) {
  const lr = lesson.listening[Number(lrIndex)];
  if (!lr) {
    container.innerHTML = `<div class="card">Không tìm thấy bài nghe.</div>`;
    return;
  }

  let showScript = false;
  let showTrans = false;
  let activeLine = -1;
  let isPaused = true;
  let rate = loadState().settings.audioRate || 1.0;

  const urls = lr.lines.map((_, i) => `audio/listening/${lr.id}/${String(i + 1).padStart(2, '0')}.mp3`);
  const texts = lr.lines.map((l) => l.text);

  container.innerHTML = `
    <div class="card">
      <div class="muted">${lesson.id} · ${lr.id}</div>
      <h2 style="margin:4px 0 8px;font-size:1.15rem;">${lr.title}</h2>
      ${lr.doc ? `<div id="lr-doc">${lr.doc}</div>` : ''}
    </div>

    <div class="card">
      <div class="player-controls">
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn-secondary" id="btn-prev" aria-label="Câu trước">⏮</button>
          <button class="btn-primary" id="btn-play" style="width:auto;min-height:48px;padding:0 18px;">${t('play_dialogue')}</button>
          <button class="btn-secondary" id="btn-next-line" aria-label="Câu sau">⏭</button>
        </div>
        <div class="speed-group">
          ${[0.85, 1.0, 1.15].map((r) => `
            <button class="speed-btn ${rate === r ? 'active' : ''}" data-rate="${r}">${r}×</button>
          `).join('')}
        </div>
      </div>

      <div class="btn-row" style="margin-top:12px;">
        <button class="btn-secondary" id="btn-toggle-script">${t('show_script')}</button>
        <button class="btn-secondary" id="btn-toggle-trans">${t('show_trans')}</button>
      </div>

      <div id="script-box" style="margin-top:12px;display:none;">
        ${lr.lines.map((l, i) => `
          <div class="dialogue-line" data-line="${i}">
            <button class="btn-audio-sm" data-play-line="${i}" aria-label="Phát dòng ${i + 1}">▶</button>
            <div>
              <div class="muted" style="font-weight:700;">${l.label || l.speaker}</div>
              <div>${l.text}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div id="trans-box" style="margin-top:12px;display:none;">
        ${(lr.translation || []).map((t) => `<div class="muted" style="margin-bottom:6px;">${t}</div>`).join('') || '<div class="muted">Chưa có bản dịch tách dòng.</div>'}
      </div>
    </div>

    <div id="lr-quiz-slot"></div>
  `;

  const playBtn = container.querySelector('#btn-play');
  const scriptBox = container.querySelector('#script-box');
  const transBox = container.querySelector('#trans-box');

  function highlightLine(idx, paused) {
    activeLine = idx;
    isPaused = paused;
    playBtn.textContent = paused ? t('resume') : t('pause');
    container.querySelectorAll('.dialogue-line').forEach((el) => {
      el.classList.toggle('playing', Number(el.dataset.line) === idx);
    });
  }

  function startFrom(idx) {
    startQueue({
      urls,
      texts,
      startIndex: idx,
      rate,
      onLineChange: highlightLine,
      onDone: () => {
        activeLine = -1;
        isPaused = true;
        playBtn.textContent = t('replay');
        highlightLine(-1, true);
      }
    });
  }

  playBtn.onclick = () => {
    if (activeLine === -1) startFrom(0);
    else {
      const playing = toggleQueuePause();
      playBtn.textContent = playing ? t('pause') : t('resume');
    }
  };
  container.querySelector('#btn-prev').onclick = () => stepQueue(-1);
  container.querySelector('#btn-next-line').onclick = () => stepQueue(1);

  container.querySelectorAll('.speed-btn').forEach((b) => {
    b.onclick = () => {
      rate = Number(b.dataset.rate);
      setQueueRate(rate);
      container.querySelectorAll('.speed-btn').forEach((x) => x.classList.toggle('active', Number(x.dataset.rate) === rate));
    };
  });

  container.querySelector('#btn-toggle-script').onclick = (e) => {
    showScript = !showScript;
    scriptBox.style.display = showScript ? 'block' : 'none';
    e.target.textContent = showScript ? t('hide_script') : t('show_script');
  };

  container.querySelector('#btn-toggle-trans').onclick = (e) => {
    showTrans = !showTrans;
    transBox.style.display = showTrans ? 'block' : 'none';
    e.target.textContent = showTrans ? t('hide_trans') : t('show_trans');
  };

  container.querySelectorAll('[data-play-line]').forEach((b) => {
    b.onclick = () => startFrom(Number(b.dataset.playLine));
  });

  renderQuizSession({
    container: container.querySelector('#lr-quiz-slot'),
    items: lr.questions,
    title: `Câu hỏi ${lr.id}`,
    immediateFeedback: !lesson.isTest,
    shuffleItems: false,
    vocabMap: ctx.vocabMap,
    onOpenVocab: ctx.openVocabModal,
    onComplete: ({ passed }) => {
      touchStreak();
      const lp = getLessonState(lessonId);
      lp.practiceDone = lp.practiceDone || {};
      lp.practiceDone[`lr_${lrIndex}`] = passed;
      saveState();
    },
    onExit: () => {
      stopAudio();
      navigate(`#/lesson/${lessonId}`);
    }
  });
}
