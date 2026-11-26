import { playSingle } from '../audio.js';
import { addToBox1, ensureCard } from '../srs.js';
import { getLessonState, loadState, saveState, touchStreak } from '../store.js';
import { navigate } from '../router.js';
import { jp, t } from '../i18n.js';

export function renderVocab(container, ctx, lessonId, lesson) {
  const vocab = lesson.vocab || [];
  if (!vocab.length) {
    container.innerHTML = `<div class="card">Bài này không có bảng từ vựng riêng.</div>`;
    return;
  }

  const lp = getLessonState(lessonId);
  let tab = 'card'; // 'card' | 'list'
  let idx = Math.min(vocab.length - 1, Math.max(0, lp.vocabIndex || 0));
  let flipped = false;
  const s = loadState();

  function render() {
    const v = vocab[idx];
    const showReading = s.settings.showReadingOnCard;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <span class="muted">${v.group || ''} · ${idx + 1}/${vocab.length}</span>
        <div class="seg-tabs" style="width:180px;">
          <button class="seg-tab ${tab === 'card' ? 'active' : ''}" id="tab-card">${t('card_tab')}</button>
          <button class="seg-tab ${tab === 'list' ? 'active' : ''}" id="tab-list">${t('list_tab')}</button>
        </div>
      </div>

      ${tab === 'card' ? `
        <div class="card flashcard" id="flashcard">
          <div class="word-jp">${jp(v.word)}</div>
          ${(flipped || showReading) && v.reading ? `<div class="reading-jp">${jp(v.reading)}</div>` : ''}
          <button class="btn-audio" id="btn-play-word" aria-label="Nghe từ">🔊</button>

          ${flipped ? `
            <div class="meaning-vi">${jp(v.meaning)}</div>
            ${v.exJp ? `
              <div style="background:var(--surface-2);padding:12px;border-radius:12px;width:100%;text-align:left;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                  <strong>${jp(v.exJp)}</strong>
                  <button class="btn-audio-sm" id="btn-play-ex" aria-label="Nghe ví dụ">🔊</button>
                </div>
                ${v.exVi ? `<div class="muted" style="margin-top:4px;">${jp(v.exVi)}</div>` : ''}
              </div>
            ` : (v.exVi ? `<div class="muted" style="text-align:left;width:100%;">📌 ${jp(v.exVi)}</div>` : '')}
            ${v.tip ? `<div class="muted" style="text-align:left;width:100%;">💡 ${jp(v.tip)}</div>` : ''}
          ` : `<div class="muted">${t('tap_flip')}</div>`}
        </div>

        <div class="btn-row">
          <button class="btn-bad" id="btn-not-yet">${t('not_yet')}</button>
          <button class="btn-ok" id="btn-got-it">${t('got_it')}</button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${vocab.map((item, i) => `
            <div class="card" style="padding:12px 14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>
                  <strong style="font-size:1.1rem;">${jp(item.word)}</strong>
                  ${item.reading ? `<span class="muted">(${jp(item.reading)})</span>` : ''}
                  <div>${jp(item.meaning)}</div>
                </div>
                <button class="btn-audio-sm" data-play-idx="${i}" aria-label="Nghe ${item.word}">🔊</button>
              </div>
              ${item.exJp ? `<div class="muted" style="margin-top:6px;">${jp(item.exJp)}${item.exVi ? ` → ${jp(item.exVi)}` : ''}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `}

      ${(lesson.cards?.length || lesson.confusedPairs?.length) && (tab === 'list' || idx === vocab.length - 1) ? `
        <div class="card">
          <strong>Ghi chú phân biệt & Cặp dễ nhầm</strong>
          ${(lesson.cards || []).map((c) => `<div style="margin-top:6px;"><code>${c.id}</code> ${c.html}</div>`).join('')}
          ${(lesson.confusedPairs || []).map((p) => `<div class="muted" style="margin-top:6px;">• ${p}</div>`).join('')}
        </div>
      ` : ''}
    `;

    container.querySelector('#tab-card').onclick = () => { tab = 'card'; render(); };
    container.querySelector('#tab-list').onclick = () => { tab = 'list'; render(); };

    if (tab === 'card') {
      container.querySelector('#flashcard').onclick = (e) => {
        if (e.target.closest('button')) return;
        flipped = !flipped;
        render();
      };
      container.querySelector('#btn-play-word').onclick = (e) => {
        e.stopPropagation();
        playSingle(`audio/words/${v.id}.mp3`, v.reading || v.word);
      };
      const exBtn = container.querySelector('#btn-play-ex');
      if (exBtn) {
        exBtn.onclick = (e) => {
          e.stopPropagation();
          playSingle(`audio/examples/${v.id}.mp3`, v.exJp);
        };
      }

      const advance = (remembered) => {
        touchStreak();
        if (remembered) ensureCard(v.id);
        else addToBox1(v.id);
        if (idx + 1 < vocab.length) {
          idx += 1;
          lp.vocabIndex = idx;
          saveState();
          flipped = false;
          render();
        } else {
          lp.vocabDone = true;
          delete lp.vocabIndex;
          saveState();
          ctx.toast(t('vocab_done_toast'));
          navigate(`#/lesson/${lessonId}`);
        }
      };

      container.querySelector('#btn-not-yet').onclick = () => advance(false);
      container.querySelector('#btn-got-it').onclick = () => advance(true);
    } else {
      container.querySelectorAll('[data-play-idx]').forEach((btn) => {
        btn.onclick = () => {
          const item = vocab[Number(btn.dataset.playIdx)];
          playSingle(`audio/words/${item.id}.mp3`, item.reading || item.word);
        };
      });
    }
  }

  render();
}
