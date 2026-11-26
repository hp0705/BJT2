// Reusable Quiz Engine: shuffles questions and options, grades by content
import { playSingle } from './audio.js';
import { addToBox1 } from './srs.js';
import { loadState, recordError } from './store.js';
import { t } from './i18n.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function prepareQuestions(rawItems, doShuffle = true) {
  const list = doShuffle ? shuffle(rawItems) : [...rawItems];
  return list.map((item) => {
    const entries = Object.entries(item.options || {});
    const correctText = item.options?.[item.answer] ?? '';
    const mixed = doShuffle ? shuffle(entries) : entries;
    const letters = ['A', 'B', 'C', 'D'];
    const newOptions = {};
    let newAnswer = 'A';
    mixed.forEach(([, text], idx) => {
      const L = letters[idx];
      newOptions[L] = text;
      if (text === correctText) newAnswer = L;
    });
    return { ...item, options: newOptions, answer: newAnswer };
  });
}

export function renderQuizSession({
  container,
  items,
  title,
  passAt = null,
  immediateFeedback = true,
  shuffleItems = true,
  vocabMap = new Map(),
  onOpenVocab = () => {},
  onComplete = () => {},
  onExit = () => {}
}) {
  const questions = prepareQuestions(items, shuffleItems);
  let idx = 0;
  const answers = []; // { q, chosen, isCorrect }

  function renderQuestion() {
    const q = questions[idx];
    const pct = Math.round(((idx + 1) / questions.length) * 100);
    const chosenEntry = answers[idx];
    const isAnswered = Boolean(chosenEntry);

    container.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span class="muted">${title}</span>
          <strong>${idx + 1} / ${questions.length}</strong>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>

      <div class="card">
        ${q.questionType === 'depiction' && q.imageSpec ? `<div class="doc-quote"><strong>Mô tả tranh:</strong> ${q.imageSpec}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div style="font-size:1.08rem;font-weight:600;white-space:pre-line;">${
            q.questionType === 'expression_listening' && !isAnswered
              ? t('listen_prompt')
              : q.q
          }</div>
          ${q.questionType === 'expression_listening' ? `<button class="btn-audio-sm" id="q-play-prompt" aria-label="Nghe câu dẫn">🔊</button>` : ''}
        </div>
      </div>

      <div class="option-list" id="opt-list">
        ${Object.entries(q.options).map(([letter, text]) => {
          let cls = 'option-btn';
          if (isAnswered && immediateFeedback) {
            if (letter === q.answer) cls += ' correct';
            else if (letter === chosenEntry.chosen) cls += ' wrong';
          } else if (isAnswered && letter === chosenEntry.chosen) {
            cls += ' selected';
          }
          const showText = !(q.questionType === 'expression_listening' || q.questionType === 'depiction') || isAnswered;
          return `
            <button class="${cls}" data-letter="${letter}" ${isAnswered && immediateFeedback ? 'disabled' : ''}>
              <span class="option-letter">${letter}</span>
              <span style="flex:1;">${showText ? text : `Phương án ${letter} (bấm 🔊 để nghe)`}</span>
              ${!showText ? `<span class="btn-audio-sm" data-opt-audio="${letter}" role="button" aria-label="Nghe phương án ${letter}">🔊</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      ${isAnswered && immediateFeedback ? `
        <div class="card ${chosenEntry.isCorrect ? '' : 'card-accent'}">
          <div style="font-weight:700;margin-bottom:6px;">
            ${chosenEntry.isCorrect ? t('correct_msg') : t('wrong_msg', { a: q.answer })}
          </div>
          <div id="explain-box">${formatExplain(q.explain)}</div>
        </div>
      ` : ''}

      <button class="btn-primary" id="btn-next" ${isAnswered ? '' : 'disabled style="opacity:0.5"'}>
        ${idx + 1 < questions.length ? t('next') : t('see_result')}
      </button>
    `;

    const promptAudioBtn = container.querySelector('#q-play-prompt');
    if (promptAudioBtn) {
      promptAudioBtn.onclick = () => playSingle(`audio/prompts/${q.id}.mp3`, q.q);
    }

    container.querySelectorAll('[data-opt-audio]').forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        const L = el.dataset.optAudio;
        playSingle(`audio/options/${q.id}_${L}.mp3`, q.options[L]);
      };
    });

    container.querySelectorAll('.option-btn').forEach((btn) => {
      btn.onclick = () => {
        if (isAnswered && immediateFeedback) return;
        const letter = btn.dataset.letter;
        const isCorrect = letter === q.answer;
        answers[idx] = { q, chosen: letter, isCorrect };
        if (immediateFeedback) {
          if (!isCorrect) {
            recordError(q);
            (q.vocabIds || []).forEach((vid) => addToBox1(vid));
          }
          if (loadState().settings.autoPlayAfterAnswer && q.vocabIds?.[0]) {
            const v = vocabMap.get(q.vocabIds[0]);
            if (v) playSingle(`audio/words/${v.id}.mp3`, v.reading || v.word);
          }
        }
        renderQuestion();
      };
    });

    container.querySelectorAll('.vocab-tag-btn').forEach((btn) => {
      btn.onclick = () => onOpenVocab(btn.dataset.vid);
    });

    const nextBtn = container.querySelector('#btn-next');
    nextBtn.onclick = () => {
      if (!answers[idx]) return;
      if (idx + 1 < questions.length) {
        idx += 1;
        renderQuestion();
      } else {
        renderResult();
      }
    };
  }

  function formatExplain(text) {
    if (!text) return '';
    return text.replace(/`([A-Z]{2,4}-(?:[A-Z0-9]+-)?[0-9]{2,3})`/g, (_, id) => {
      if (vocabMap.has(id)) {
        return `<button class="vocab-tag-btn" data-vid="${id}">${id}</button>`;
      }
      return `<code>${id}</code>`;
    });
  }

  function renderResult() {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const total = questions.length;
    const wrongList = answers.filter((a) => !a.isCorrect);
    const passed = passAt !== null ? correctCount >= passAt : (correctCount / total) >= 0.7;

    if (!immediateFeedback) {
      wrongList.forEach((w) => recordError(w.q));
    }

    onComplete({ score: correctCount, total, passed, wrongList });

    container.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:${passed ? 'var(--ok)' : 'var(--bad)'};">
          ${correctCount} / ${total}
        </div>
        <div style="font-weight:700;margin:6px 0;">
          ${passed ? t('quiz_pass') : t('quiz_fail')}
        </div>
        ${passAt !== null ? `<div class="muted">${t('pass_at', { p: passAt, t: total })}</div>` : ''}
      </div>

      ${wrongList.length ? `
        <div class="card">
          <strong>${t('wrong_list', { n: wrongList.length })}</strong>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;">
            ${wrongList.map((w) => `
              <div style="border-top:1px solid var(--border);padding-top:10px;">
                <div style="font-weight:600;">${w.q.q}</div>
                <div class="muted">→ <strong>${w.q.answer} (${w.q.options[w.q.answer]})</strong></div>
                <div style="margin-top:4px;font-size:0.9rem;">${formatExplain(w.q.explain)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `<div class="card">${t('perfect')}</div>`}

      <div class="btn-row">
        ${wrongList.length ? `<button class="btn-secondary" id="btn-retry-wrong">${t('retry_wrong', { n: wrongList.length })}</button>` : '<div></div>'}
        <button class="btn-primary" id="btn-done-quiz">${t('back')}</button>
      </div>
    `;

    container.querySelectorAll('.vocab-tag-btn').forEach((btn) => {
      btn.onclick = () => onOpenVocab(btn.dataset.vid);
    });

    const retryBtn = container.querySelector('#btn-retry-wrong');
    if (retryBtn) {
      retryBtn.onclick = () => {
        renderQuizSession({
          container,
          items: wrongList.map((w) => w.q),
          title: `${title} (Làm lại câu sai)`,
          passAt: wrongList.length,
          immediateFeedback: true,
          shuffleItems: true,
          vocabMap,
          onOpenVocab,
          onComplete: () => {},
          onExit
        });
      };
    }

    container.querySelector('#btn-done-quiz').onclick = onExit;
  }

  renderQuestion();
}
